import { describe, expect, it, vi } from 'vitest';
import type { SaveFile } from '../../src/data/types';
import { SAVE_VERSION, SaveManager } from '../../src/systems/SaveManager';
import { MemorySaveBackend, type SaveBackend } from '../../src/systems/save/SaveBackend';
import { migrateSaveFile, type Migration } from '../../src/systems/save/migrations';
import { makeSaveFile, newState, NYRA } from './fixtures';

const T1 = '2026-03-01T10:00:00.000Z';
const T2 = '2026-03-02T10:00:00.000Z';

function clock(iso: string): () => Date {
  return () => new Date(iso);
}

/** Backend qui échoue à chaque appel (réseau coupé). */
class FailingBackend implements SaveBackend {
  async list(): Promise<never> {
    throw new Error('réseau');
  }
  async load(): Promise<never> {
    throw new Error('réseau');
  }
  async save(): Promise<never> {
    throw new Error('réseau');
  }
  async remove(): Promise<never> {
    throw new Error('réseau');
  }
}

describe('createFile', () => {
  it('résume la partie', () => {
    const state = newState();
    state.recruit('nyra', NYRA);
    state.updateHero('kael', { level: 4 });
    state.updateHero('nyra', { level: 3 });
    state.addPlayTime(60_000);
    state.setAct(2);
    const manager = new SaveManager(new MemorySaveBackend(), null, { now: clock(T1) });
    const file = manager.createFile(state, 2, 'Port-Lazuli');
    expect(file.saveVersion).toBe(SAVE_VERSION);
    expect(file.slot).toBe(2);
    expect(file.createdAt).toBe(T1);
    expect(file.updatedAt).toBe(T1);
    expect(file.summary).toEqual({
      slot: 2,
      act: 2,
      locationName: 'Port-Lazuli',
      partyLevel: 4,
      playTimeMs: 60_000,
      updatedAt: T1,
      heroes: ['kael', 'nyra'],
    });
    expect(file.state).toEqual(state.toData());
  });
});

describe('save et autoSave', () => {
  it('écrit en local et en ligne', async () => {
    const local = new MemorySaveBackend();
    const cloud = new MemorySaveBackend();
    const manager = new SaveManager(local, cloud, { now: clock(T1) });
    const result = await manager.save(1, newState(), 'Brumeval');
    expect(result).toEqual({ local: true, cloud: true });
    expect(local.files.get(1)?.summary.locationName).toBe('Brumeval');
    expect(cloud.files.get(1)?.summary.locationName).toBe('Brumeval');
  });

  it('sans cloud, cloud vaut false ; une panne réseau ne bloque pas', async () => {
    const local = new MemorySaveBackend();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const offline = new SaveManager(local, null);
    expect(await offline.save(1, newState(), 'Brumeval')).toEqual({ local: true, cloud: false });
    const broken = new SaveManager(local, new FailingBackend());
    expect(await broken.save(2, newState(), 'Brumeval')).toEqual({ local: true, cloud: false });
    expect(local.files.has(2)).toBe(true);
    warn.mockRestore();
  });

  it('autoSave utilise l’emplacement 0 et conserve createdAt', async () => {
    const local = new MemorySaveBackend();
    const manager1 = new SaveManager(local, null, { now: clock(T1) });
    await manager1.autoSave(newState(), 'Forge');
    const manager2 = new SaveManager(local, null, { now: clock(T2) });
    await manager2.autoSave(newState(), 'Place');
    const file = local.files.get(0);
    expect(file?.createdAt).toBe(T1);
    expect(file?.updatedAt).toBe(T2);
    expect(file?.summary.locationName).toBe('Place');
  });

  it('refuse un emplacement invalide', async () => {
    const manager = new SaveManager(new MemorySaveBackend());
    await expect(manager.save(7, newState(), 'x')).rejects.toThrow(/invalide/);
  });
});

describe('load et list', () => {
  it('préfère la version la plus récente entre local et cloud', async () => {
    const local = new MemorySaveBackend();
    const cloud = new MemorySaveBackend();
    await local.save(1, makeSaveFile(1, T1, { summary: { ...makeSaveFile(1, T1).summary, locationName: 'Local' } }));
    await cloud.save(1, makeSaveFile(1, T2, { summary: { ...makeSaveFile(1, T2).summary, locationName: 'Cloud' } }));
    await local.save(2, makeSaveFile(2, T2));
    await cloud.save(2, makeSaveFile(2, T1));
    await local.save(3, makeSaveFile(3, T1));
    const manager = new SaveManager(local, cloud);
    expect((await manager.load(1))?.summary.locationName).toBe('Cloud');
    expect((await manager.load(2))?.updatedAt).toBe(T2);
    expect((await manager.load(3))?.slot).toBe(3);
    expect(await manager.load(0)).toBeNull();
  });

  it('retombe sur le local quand le cloud est en panne', async () => {
    const local = new MemorySaveBackend();
    await local.save(1, makeSaveFile(1, T1));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const manager = new SaveManager(local, new FailingBackend());
    expect((await manager.load(1))?.slot).toBe(1);
    expect((await manager.list()).map((s) => s.slot)).toEqual([1]);
    warn.mockRestore();
  });

  it('fusionne les listes en gardant le plus récent par emplacement', async () => {
    const local = new MemorySaveBackend();
    const cloud = new MemorySaveBackend();
    await local.save(0, makeSaveFile(0, T1));
    await cloud.save(0, makeSaveFile(0, T2));
    await cloud.save(3, makeSaveFile(3, T1));
    const manager = new SaveManager(local, cloud);
    const list = await manager.list();
    expect(list.map((s) => [s.slot, s.updatedAt])).toEqual([
      [0, T2],
      [3, T1],
    ]);
  });

  it('remove supprime des deux côtés', async () => {
    const local = new MemorySaveBackend();
    const cloud = new MemorySaveBackend();
    await local.save(1, makeSaveFile(1, T1));
    await cloud.save(1, makeSaveFile(1, T1));
    const manager = new SaveManager(local, cloud);
    await manager.remove(1);
    expect(local.files.size).toBe(0);
    expect(cloud.files.size).toBe(0);
  });
});

describe('syncFromCloud', () => {
  it('rapatrie le plus récent du cloud et pousse le plus récent du local', async () => {
    const local = new MemorySaveBackend();
    const cloud = new MemorySaveBackend();
    await local.save(1, makeSaveFile(1, T1));
    await cloud.save(1, makeSaveFile(1, T2));
    await local.save(2, makeSaveFile(2, T2));
    await cloud.save(2, makeSaveFile(2, T1));
    await local.save(3, makeSaveFile(3, T1));
    await cloud.save(0, makeSaveFile(0, T1));
    const manager = new SaveManager(local, null);
    expect(await manager.syncFromCloud()).toEqual({ pulled: [], pushed: [] });
    manager.setCloud(cloud);
    expect(manager.hasCloud).toBe(true);
    const result = await manager.syncFromCloud();
    expect(result).toEqual({ pulled: [0, 1], pushed: [2, 3] });
    expect(local.files.get(1)?.updatedAt).toBe(T2);
    expect(cloud.files.get(2)?.updatedAt).toBe(T2);
    expect(local.files.has(0)).toBe(true);
    expect(cloud.files.has(3)).toBe(true);
  });
});

describe('migrations', () => {
  const addLore: Migration = {
    from: 0,
    migrate: (file: SaveFile) => ({
      ...file,
      state: { ...file.state, lore: [...file.state.lore, 'migre'] },
    }),
  };

  it('applique les migrations jusqu’à la version courante', () => {
    const old = makeSaveFile(1, T1, { saveVersion: 0 });
    const migrated = migrateSaveFile(old, [addLore], 1);
    expect(migrated.saveVersion).toBe(1);
    expect(migrated.state.lore).toEqual(['migre']);
    expect(old.saveVersion).toBe(0);
  });

  it('refuse une version future ou une migration manquante', () => {
    expect(() => migrateSaveFile(makeSaveFile(1, T1, { saveVersion: 99 }))).toThrow(/plus récente/);
    expect(() => migrateSaveFile(makeSaveFile(1, T1, { saveVersion: 0 }), [], 1)).toThrow(
      /Aucune migration/,
    );
  });

  it('load migre les anciens fichiers', async () => {
    const local = new MemorySaveBackend();
    await local.save(1, makeSaveFile(1, T1, { saveVersion: 0 }));
    const manager = new SaveManager(local, null, { migrations: [addLore] });
    const file = await manager.load(1);
    expect(file?.saveVersion).toBe(SAVE_VERSION);
    expect(file?.state.lore).toEqual(['migre']);
    expect(manager.migrate(makeSaveFile(1, T1)).saveVersion).toBe(SAVE_VERSION);
  });
});

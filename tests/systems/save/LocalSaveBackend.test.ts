import { describe, expect, it, vi } from 'vitest';
import {
  isSaveFile,
  isValidSlot,
  LocalSaveBackend,
  localSaveKey,
  MemorySaveBackend,
  SAVE_SLOTS,
} from '../../../src/systems/save/SaveBackend';
import { FakeStorage, makeSaveFile } from '../fixtures';

const T1 = '2026-03-01T10:00:00.000Z';

describe('constantes', () => {
  it('connaît 4 emplacements, 0 étant la sauvegarde automatique', () => {
    expect(SAVE_SLOTS).toEqual([0, 1, 2, 3]);
    expect(isValidSlot(3)).toBe(true);
    expect(isValidSlot(4)).toBe(false);
    expect(localSaveKey(2)).toBe('aldara:save:2');
  });

  it('isSaveFile vérifie la forme', () => {
    expect(isSaveFile(makeSaveFile(1, T1))).toBe(true);
    expect(isSaveFile(null)).toBe(false);
    expect(isSaveFile({ saveVersion: 1 })).toBe(false);
  });
});

describe('LocalSaveBackend', () => {
  it('écrit et relit dans le storage', async () => {
    const storage = new FakeStorage();
    const backend = new LocalSaveBackend(storage);
    await backend.save(1, makeSaveFile(1, T1));
    expect(storage.map.has('aldara:save:1')).toBe(true);
    const loaded = await backend.load(1);
    expect(loaded?.slot).toBe(1);
    expect(loaded?.updatedAt).toBe(T1);
    expect(await backend.load(2)).toBeNull();
    expect((await backend.list()).map((s) => s.slot)).toEqual([1]);
    await backend.remove(1);
    expect(await backend.load(1)).toBeNull();
  });

  it('ignore un JSON corrompu ou un fichier invalide', async () => {
    const storage = new FakeStorage();
    storage.setItem('aldara:save:0', '{ pas du json');
    storage.setItem('aldara:save:1', JSON.stringify({ foo: 1 }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const backend = new LocalSaveBackend(storage);
    expect(await backend.load(0)).toBeNull();
    expect(await backend.load(1)).toBeNull();
    expect(await backend.list()).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(4);
    warn.mockRestore();
  });

  it('sans localStorage, exige un storage explicite', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true });
    try {
      expect(() => new LocalSaveBackend()).toThrow(/localStorage/);
    } finally {
      if (original) Object.defineProperty(globalThis, 'localStorage', original);
      else Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });
});

describe('MemorySaveBackend', () => {
  it('renvoie des copies indépendantes', async () => {
    const backend = new MemorySaveBackend();
    const file = makeSaveFile(2, T1);
    await backend.save(2, file);
    file.summary.locationName = 'modifié';
    const loaded = await backend.load(2);
    expect(loaded?.summary.locationName).toBe('Brumeval');
    if (loaded) loaded.summary.locationName = 'autre';
    expect((await backend.load(2))?.summary.locationName).toBe('Brumeval');
    expect(await backend.list()).toHaveLength(1);
    await backend.remove(2);
    expect(await backend.list()).toEqual([]);
  });
});

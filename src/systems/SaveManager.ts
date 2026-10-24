/**
 * Sauvegarde : écrit toujours en local (cache), puis en ligne si un backend
 * cloud est branché. Le jeu ne bloque jamais sur le réseau.
 */
import type { SaveFile, SaveSummary } from '../data/types';
import type { GameState } from './GameState';
import { AUTO_SAVE_SLOT, isValidSlot, type SaveBackend } from './save/SaveBackend';
import { MIGRATIONS, migrateSaveFile, SAVE_VERSION, type Migration } from './save/migrations';

export { SAVE_VERSION };

export interface SaveResult {
  local: boolean;
  cloud: boolean;
}

export interface SyncResult {
  /** Emplacements récupérés depuis le cloud (plus récents en ligne). */
  pulled: number[];
  /** Emplacements envoyés au cloud (plus récents en local). */
  pushed: number[];
}

export interface SaveManagerOptions {
  now?: () => Date;
  migrations?: readonly Migration[];
}

function newer(a: { updatedAt: string } | null, b: { updatedAt: string } | null): -1 | 0 | 1 {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const ta = Date.parse(a.updatedAt);
  const tb = Date.parse(b.updatedAt);
  if (ta === tb) return 0;
  return ta > tb ? -1 : 1;
}

export class SaveManager {
  private cloud: SaveBackend | null;
  private readonly now: () => Date;
  private readonly migrations: readonly Migration[];

  constructor(
    private readonly local: SaveBackend,
    cloud: SaveBackend | null = null,
    options: SaveManagerOptions = {},
  ) {
    this.cloud = cloud;
    this.now = options.now ?? (() => new Date());
    this.migrations = options.migrations ?? MIGRATIONS;
  }

  get hasCloud(): boolean {
    return this.cloud !== null;
  }

  setCloud(backend: SaveBackend | null): void {
    this.cloud = backend;
  }

  // --- Fichiers -------------------------------------------------------------

  createFile(state: GameState, slot: number, locationName: string, createdAt?: string): SaveFile {
    const now = this.now().toISOString();
    const party = state.partyIds();
    const levels = party.map((id) => state.getHero(id)?.level ?? 1);
    const partyLevel =
      levels.length === 0 ? 1 : Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
    const summary: SaveSummary = {
      slot,
      act: state.act,
      locationName,
      partyLevel,
      playTimeMs: state.playTimeMs,
      updatedAt: now,
      heroes: party,
    };
    return {
      saveVersion: SAVE_VERSION,
      slot,
      createdAt: createdAt ?? now,
      updatedAt: now,
      summary,
      state: state.toData(),
    };
  }

  migrate(file: SaveFile): SaveFile {
    return migrateSaveFile(file, this.migrations);
  }

  // --- Écriture -------------------------------------------------------------

  async save(slot: number, state: GameState, locationName: string): Promise<SaveResult> {
    if (!isValidSlot(slot)) throw new Error(`Emplacement de sauvegarde invalide : ${slot}`);
    const previous = await this.safeLoad(this.local, slot);
    const file = this.createFile(state, slot, locationName, previous?.createdAt);
    const local = await this.safeWrite(this.local, slot, file, 'local');
    const cloud = this.cloud ? await this.safeWrite(this.cloud, slot, file, 'en ligne') : false;
    return { local, cloud };
  }

  autoSave(state: GameState, locationName: string): Promise<SaveResult> {
    return this.save(AUTO_SAVE_SLOT, state, locationName);
  }

  async remove(slot: number): Promise<void> {
    await this.local.remove(slot);
    if (this.cloud) {
      try {
        await this.cloud.remove(slot);
      } catch (error) {
        console.warn('[save] suppression en ligne impossible', error);
      }
    }
  }

  // --- Lecture --------------------------------------------------------------

  /** Charge la version la plus récente entre le cache local et le cloud, migrée. */
  async load(slot: number): Promise<SaveFile | null> {
    const local = await this.safeLoad(this.local, slot);
    const cloud = this.cloud ? await this.safeLoad(this.cloud, slot) : null;
    const chosen = newer(local, cloud) <= 0 ? (local ?? cloud) : cloud;
    return chosen ? this.migrate(chosen) : null;
  }

  /** Fusionne les listes locale et en ligne, en gardant le plus récent par emplacement. */
  async list(): Promise<SaveSummary[]> {
    const merged = new Map<number, SaveSummary>();
    for (const summary of await this.safeList(this.local)) merged.set(summary.slot, summary);
    if (this.cloud) {
      for (const summary of await this.safeList(this.cloud)) {
        const current = merged.get(summary.slot) ?? null;
        if (newer(current, summary) > 0) merged.set(summary.slot, summary);
      }
    }
    return [...merged.values()].sort((a, b) => a.slot - b.slot);
  }

  /**
   * Après une connexion : rapatrie les sauvegardes en ligne plus récentes et
   * pousse les sauvegardes locales plus récentes (ou absentes en ligne).
   */
  async syncFromCloud(): Promise<SyncResult> {
    const result: SyncResult = { pulled: [], pushed: [] };
    if (!this.cloud) return result;
    const slots = new Set<number>();
    for (const s of await this.safeList(this.local)) slots.add(s.slot);
    for (const s of await this.safeList(this.cloud)) slots.add(s.slot);
    for (const slot of [...slots].sort()) {
      const local = await this.safeLoad(this.local, slot);
      const cloud = await this.safeLoad(this.cloud, slot);
      const order = newer(local, cloud);
      if (order > 0 && cloud) {
        if (await this.safeWrite(this.local, slot, cloud, 'local')) result.pulled.push(slot);
      } else if (order < 0 && local) {
        if (await this.safeWrite(this.cloud, slot, local, 'en ligne')) result.pushed.push(slot);
      }
    }
    return result;
  }

  // --- Accès tolérants aux pannes -------------------------------------------

  private async safeLoad(backend: SaveBackend, slot: number): Promise<SaveFile | null> {
    try {
      return await backend.load(slot);
    } catch (error) {
      console.warn(`[save] lecture de l'emplacement ${slot} impossible`, error);
      return null;
    }
  }

  private async safeList(backend: SaveBackend): Promise<SaveSummary[]> {
    try {
      return await backend.list();
    } catch (error) {
      console.warn('[save] liste des sauvegardes impossible', error);
      return [];
    }
  }

  private async safeWrite(
    backend: SaveBackend,
    slot: number,
    file: SaveFile,
    label: string,
  ): Promise<boolean> {
    try {
      await backend.save(slot, file);
      return true;
    } catch (error) {
      console.warn(`[save] écriture ${label} de l'emplacement ${slot} impossible`, error);
      return false;
    }
  }
}

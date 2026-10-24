/**
 * Stockage des sauvegardes : interface commune, backend localStorage et
 * backend mémoire (tests). Le backend Supabase est dans SupabaseSaveBackend.ts.
 */
import type { SaveFile, SaveSummary } from '../../data/types';

/** Emplacement 0 : sauvegarde automatique. 1 à 3 : emplacements du joueur. */
export const AUTO_SAVE_SLOT = 0;
export const MANUAL_SLOTS: readonly number[] = [1, 2, 3];
export const SAVE_SLOTS: readonly number[] = [AUTO_SAVE_SLOT, ...MANUAL_SLOTS];

export function isValidSlot(slot: number): boolean {
  return SAVE_SLOTS.includes(slot);
}

export interface SaveBackend {
  list(): Promise<SaveSummary[]>;
  load(slot: number): Promise<SaveFile | null>;
  save(slot: number, file: SaveFile): Promise<void>;
  remove(slot: number): Promise<void>;
}

/** Vérification minimale de la forme d'un fichier de sauvegarde. */
export function isSaveFile(value: unknown): value is SaveFile {
  if (typeof value !== 'object' || value === null) return false;
  const file = value as Partial<SaveFile>;
  return (
    typeof file.saveVersion === 'number' &&
    typeof file.slot === 'number' &&
    typeof file.updatedAt === 'string' &&
    typeof file.summary === 'object' &&
    file.summary !== null &&
    typeof file.state === 'object' &&
    file.state !== null
  );
}

// --- Mémoire (tests) -------------------------------------------------------

export class MemorySaveBackend implements SaveBackend {
  readonly files = new Map<number, SaveFile>();

  async list(): Promise<SaveSummary[]> {
    return [...this.files.values()]
      .map((file) => file.summary)
      .sort((a, b) => a.slot - b.slot);
  }

  async load(slot: number): Promise<SaveFile | null> {
    const file = this.files.get(slot);
    return file ? structuredClone(file) : null;
  }

  async save(slot: number, file: SaveFile): Promise<void> {
    this.files.set(slot, structuredClone(file));
  }

  async remove(slot: number): Promise<void> {
    this.files.delete(slot);
  }
}

// --- localStorage -----------------------------------------------------------

/** Sous-ensemble de l'API Storage utilisé, pour pouvoir injecter un faux en test. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const LOCAL_SAVE_PREFIX = 'aldara:save:';

export function localSaveKey(slot: number): string {
  return `${LOCAL_SAVE_PREFIX}${slot}`;
}

function defaultStorage(): StorageLike {
  if (typeof globalThis.localStorage !== 'undefined') return globalThis.localStorage;
  throw new Error('localStorage indisponible : passe un StorageLike à LocalSaveBackend.');
}

export class LocalSaveBackend implements SaveBackend {
  private readonly storage: StorageLike;

  constructor(storage?: StorageLike) {
    this.storage = storage ?? defaultStorage();
  }

  async list(): Promise<SaveSummary[]> {
    const summaries: SaveSummary[] = [];
    for (const slot of SAVE_SLOTS) {
      const file = await this.load(slot);
      if (file) summaries.push(file.summary);
    }
    return summaries;
  }

  /** Renvoie null si l'emplacement est vide ou si le JSON est corrompu. */
  async load(slot: number): Promise<SaveFile | null> {
    const raw = this.storage.getItem(localSaveKey(slot));
    if (raw === null) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isSaveFile(parsed)) return parsed;
      console.warn(`[save] emplacement ${slot} : fichier invalide, ignoré.`);
      return null;
    } catch {
      console.warn(`[save] emplacement ${slot} : JSON corrompu, ignoré.`);
      return null;
    }
  }

  async save(slot: number, file: SaveFile): Promise<void> {
    this.storage.setItem(localSaveKey(slot), JSON.stringify(file));
  }

  async remove(slot: number): Promise<void> {
    this.storage.removeItem(localSaveKey(slot));
  }
}

/**
 * Sauvegardes en ligne dans la table Supabase `saves`
 * (clé primaire `(user_id, slot)`, voir supabase/migrations/0001_saves.sql).
 *
 * Le backend ne dépend que d'une vue minimale du client (`SavesClient`) pour
 * être testable avec un faux client ; `savesClientFrom` adapte le vrai client.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GameStateData, SaveFile, SaveSummary } from '../../data/types';
import type { SaveBackend } from './SaveBackend';

export const SAVES_TABLE = 'saves';

export interface SaveRow {
  user_id: string;
  slot: number;
  data: GameStateData;
  save_version: number;
  summary: SaveSummary;
  created_at: string;
  updated_at: string;
}

export interface QueryError {
  message: string;
  code?: string;
}

export interface SavesQuery extends PromiseLike<{ data: SaveRow[] | null; error: QueryError | null }> {
  eq(column: string, value: string | number): SavesQuery;
}

export interface SavesTable {
  select(columns: string): SavesQuery;
  upsert(row: SaveRow, options?: { onConflict?: string }): PromiseLike<{ error: QueryError | null }>;
  delete(): SavesQuery;
}

export interface SavesClient {
  from(table: typeof SAVES_TABLE): SavesTable;
}

/** Adapte le client Supabase complet à la vue minimale utilisée ici. */
export function savesClientFrom(client: SupabaseClient): SavesClient {
  return {
    from: (table) => client.from(table) as unknown as SavesTable,
  };
}

export function rowToFile(row: SaveRow): SaveFile {
  return {
    saveVersion: row.save_version,
    slot: row.slot,
    createdAt: row.created_at,
    updatedAt: row.summary.updatedAt ?? row.updated_at,
    summary: { ...row.summary, slot: row.slot },
    state: row.data,
  };
}

export function fileToRow(userId: string, slot: number, file: SaveFile): SaveRow {
  return {
    user_id: userId,
    slot,
    data: file.state,
    save_version: file.saveVersion,
    summary: { ...file.summary, slot },
    created_at: file.createdAt,
    updated_at: file.updatedAt,
  };
}

function fail(action: string, error: QueryError): never {
  throw new Error(`[save] ${action} en ligne impossible : ${error.message}`);
}

export class SupabaseSaveBackend implements SaveBackend {
  constructor(
    private readonly client: SavesClient,
    private readonly userId: string,
  ) {}

  async list(): Promise<SaveSummary[]> {
    const { data, error } = await this.client
      .from(SAVES_TABLE)
      .select('slot, summary')
      .eq('user_id', this.userId);
    if (error) fail('liste', error);
    return (data ?? [])
      .map((row) => ({ ...row.summary, slot: row.slot }))
      .sort((a, b) => a.slot - b.slot);
  }

  async load(slot: number): Promise<SaveFile | null> {
    const { data, error } = await this.client
      .from(SAVES_TABLE)
      .select('*')
      .eq('user_id', this.userId)
      .eq('slot', slot);
    if (error) fail('chargement', error);
    const row = data?.[0];
    return row ? rowToFile(row) : null;
  }

  async save(slot: number, file: SaveFile): Promise<void> {
    const { error } = await this.client
      .from(SAVES_TABLE)
      .upsert(fileToRow(this.userId, slot, file), { onConflict: 'user_id,slot' });
    if (error) fail('sauvegarde', error);
  }

  async remove(slot: number): Promise<void> {
    const { error } = await this.client
      .from(SAVES_TABLE)
      .delete()
      .eq('user_id', this.userId)
      .eq('slot', slot);
    if (error) fail('suppression', error);
  }
}

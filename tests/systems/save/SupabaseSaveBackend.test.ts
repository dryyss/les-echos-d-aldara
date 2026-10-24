import { describe, expect, it } from 'vitest';
import {
  fileToRow,
  rowToFile,
  SupabaseSaveBackend,
  type QueryError,
  type SaveRow,
  type SavesClient,
  type SavesQuery,
  type SavesTable,
} from '../../../src/systems/save/SupabaseSaveBackend';
import { makeSaveFile } from '../fixtures';

const T1 = '2026-03-01T10:00:00.000Z';
const USER = '11111111-2222-3333-4444-555555555555';

interface Call {
  op: 'select' | 'upsert' | 'delete';
  columns?: string;
  filters: [string, string | number][];
  row?: SaveRow;
  options?: { onConflict?: string };
}

/** Faux client Supabase : enregistre les appels et sert les lignes de `rows`. */
class FakeSavesClient implements SavesClient {
  readonly calls: Call[] = [];
  rows: SaveRow[] = [];
  error: QueryError | null = null;

  from(): SavesTable {
    return {
      select: (columns) => this.query({ op: 'select', columns, filters: [] }),
      delete: () => this.query({ op: 'delete', filters: [] }),
      upsert: (row, options) => {
        this.calls.push({ op: 'upsert', row, options, filters: [] });
        if (!this.error) this.rows = [...this.rows.filter((r) => r.slot !== row.slot), row];
        return Promise.resolve({ error: this.error });
      },
    };
  }

  private query(call: Call): SavesQuery {
    this.calls.push(call);
    const matching = () =>
      this.rows.filter((row) =>
        call.filters.every(([column, value]) => row[column as keyof SaveRow] === value),
      );
    const query: SavesQuery = {
      eq: (column, value) => {
        call.filters.push([column, value]);
        return query;
      },
      then: (onFulfilled, onRejected) => {
        if (call.op === 'delete' && !this.error) {
          const kept = new Set(matching());
          this.rows = this.rows.filter((r) => !kept.has(r));
        }
        const result = { data: this.error ? null : matching(), error: this.error };
        return Promise.resolve(result).then(onFulfilled, onRejected);
      },
    };
    return query;
  }
}

describe('conversion ligne ↔ fichier', () => {
  it('fait l’aller-retour', () => {
    const file = makeSaveFile(2, T1);
    const row = fileToRow(USER, 2, file);
    expect(row).toMatchObject({ user_id: USER, slot: 2, save_version: 1, updated_at: T1 });
    expect(rowToFile(row)).toEqual(file);
  });

  it('impose le slot de la ligne dans le résumé', () => {
    const file = makeSaveFile(1, T1);
    const row = fileToRow(USER, 3, file);
    expect(row.summary.slot).toBe(3);
    expect(rowToFile(row).slot).toBe(3);
  });
});

describe('SupabaseSaveBackend', () => {
  it('sauvegarde par upsert sur (user_id, slot)', async () => {
    const client = new FakeSavesClient();
    const backend = new SupabaseSaveBackend(client, USER);
    await backend.save(1, makeSaveFile(1, T1));
    expect(client.calls[0]).toMatchObject({
      op: 'upsert',
      options: { onConflict: 'user_id,slot' },
      row: { user_id: USER, slot: 1 },
    });
  });

  it('charge et liste en filtrant sur l’utilisateur', async () => {
    const client = new FakeSavesClient();
    const backend = new SupabaseSaveBackend(client, USER);
    await backend.save(1, makeSaveFile(1, T1));
    await backend.save(0, makeSaveFile(0, T1));
    client.rows.push(fileToRow('autre-utilisateur', 2, makeSaveFile(2, T1)));

    const loaded = await backend.load(1);
    expect(loaded?.slot).toBe(1);
    expect(client.calls.at(-1)).toMatchObject({
      op: 'select',
      filters: [
        ['user_id', USER],
        ['slot', 1],
      ],
    });
    expect(await backend.load(3)).toBeNull();
    expect((await backend.list()).map((s) => s.slot)).toEqual([0, 1]);
  });

  it('supprime la ligne de l’emplacement', async () => {
    const client = new FakeSavesClient();
    const backend = new SupabaseSaveBackend(client, USER);
    await backend.save(1, makeSaveFile(1, T1));
    await backend.remove(1);
    expect(client.rows).toEqual([]);
    expect(client.calls.at(-1)).toMatchObject({ op: 'delete', filters: [['user_id', USER], ['slot', 1]] });
  });

  it('transforme une erreur Supabase en exception lisible', async () => {
    const client = new FakeSavesClient();
    client.error = { message: 'permission denied', code: '42501' };
    const backend = new SupabaseSaveBackend(client, USER);
    await expect(backend.load(1)).rejects.toThrow(/permission denied/);
    await expect(backend.save(1, makeSaveFile(1, T1))).rejects.toThrow(/sauvegarde en ligne/);
    await expect(backend.list()).rejects.toThrow(/liste/);
    await expect(backend.remove(1)).rejects.toThrow(/suppression/);
  });
});

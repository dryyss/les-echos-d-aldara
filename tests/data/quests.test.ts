import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateData } from '../../src/data/schemas';
import type { ItemData, QuestData, ResonanceData } from '../../src/data/types';
import { GameState } from '../../src/systems/GameState';
import { QuestManager } from '../../src/systems/QuestManager';
import { HEROES } from '../systems/fixtures';

const DATA_DIR = join(__dirname, '..', '..', 'data');

function load<T>(file: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8')) as T;
}

const quests = load<QuestData[]>('quests.json');
const items = load<ItemData[]>('items.json');
const resonances = load<ResonanceData[]>('resonances.json');
const itemIds = new Set(items.map((i) => i.id));
const resonanceIds = new Set(resonances.map((r) => r.id));

describe('quests.json', () => {
  it('respecte son schéma', () => {
    const result = validateData('quests.json', quests);
    expect(result.ok ? [] : result.errors).toEqual([]);
  });

  it('contient M1-01 à M1-03 dans l’ordre', () => {
    expect(quests.map((q) => q.id)).toEqual(['m1-01', 'm1-02', 'm1-03']);
  });

  it('enchaîne les missions et pose les drapeaux', () => {
    const state = GameState.newGame(HEROES);
    const manager = new QuestManager(state, quests);
    expect(manager.start('m1-01')).toBe(true);
    expect(manager.start('m1-02')).toBe(false);
    manager.complete('m1-01');
    expect(state.hasFlag('m1_01_fini')).toBe(true);
    expect(manager.isActive('m1-02')).toBe(true);
    manager.complete('m1-02');
    expect(manager.isActive('m1-03')).toBe(true);
  });

  it('ne référence que des objets et des Résonances existants', () => {
    for (const quest of quests) {
      for (const objet of quest.recompenses?.objets ?? []) {
        expect(itemIds.has(objet.id), `${quest.id}:${objet.id}`).toBe(true);
      }
      const resonance = quest.recompenses?.resonance;
      if (resonance) expect(resonanceIds.has(resonance), `${quest.id}:${resonance}`).toBe(true);
    }
  });
});

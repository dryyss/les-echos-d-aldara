import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateData } from '../../src/data/schemas';
import type { EncounterGroup, EnemyData, ItemData, LueurData } from '../../src/data/types';

const DATA_DIR = join(__dirname, '..', '..', 'data');

function load<T>(file: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8')) as T;
}

const enemies = load<EnemyData[]>('enemies.json');
const encounters = load<EncounterGroup[]>('encounters.json');
const items = load<ItemData[]>('items.json');
const lueurs = load<LueurData[]>('lueurs.json');

const enemyIds = new Set(enemies.map((e) => e.id));
const itemIds = new Set(items.map((i) => i.id));
const lueurIds = new Set(lueurs.map((l) => l.id));

function collectStrings(value: unknown, path: string, out: { path: string; text: string }[]): void {
  if (typeof value === 'string') out.push({ path, text: value });
  else if (Array.isArray(value)) value.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
  else if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) collectStrings(v, `${path}.${k}`, out);
  }
}

describe('enemies.json', () => {
  it('respecte son schéma', () => {
    const result = validateData('enemies.json', enemies);
    expect(result.ok ? [] : result.errors).toEqual([]);
  });

  it('a des ids uniques en kebab-case', () => {
    const ids = enemies.map((e) => e.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    expect(ids.filter((id) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id))).toEqual([]);
  });

  it('couvre tous les ennemis référencés par encounters.json', () => {
    const missing = [...new Set(encounters.flatMap((g) => g.enemies))].filter(
      (id) => !enemyIds.has(id),
    );
    expect(missing).toEqual([]);
  });

  it('ne référence que des objets et des Lueurs existants', () => {
    const badDrops = enemies.flatMap((e) =>
      e.drops.filter((d) => !itemIds.has(d.item)).map((d) => `${e.id}:${d.item}`),
    );
    const badLueurs = enemies
      .filter((e) => e.lueurReward !== undefined && !lueurIds.has(e.lueurReward))
      .map((e) => `${e.id}:${e.lueurReward}`);
    expect(badDrops).toEqual([]);
    expect(badLueurs).toEqual([]);
  });

  it('n’utilise ni tiret cadratin, ni apostrophe droite, ni « ... »', () => {
    const strings: { path: string; text: string }[] = [];
    collectStrings(enemies, 'enemies.json', strings);
    const errors = strings
      .filter(({ text }) => /[—–']/.test(text) || text.includes('...'))
      .map(({ path, text }) => `${path} : « ${text} »`);
    expect(errors).toEqual([]);
  });

  it('les boss ont noFlee et une IA de boss', () => {
    for (const enemy of enemies.filter((e) => e.boss)) {
      expect(enemy.noFlee, enemy.id).toBe(true);
      expect(enemy.ai, enemy.id).toBe('boss');
    }
  });
});

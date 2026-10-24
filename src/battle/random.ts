/**
 * Tirages aléatoires déterministes : toutes les fonctions reçoivent le rng.
 * Règle : un tirage sans choix réel (0 ou 1 candidat, chance 0 ou 1) ne consomme pas le rng,
 * ce qui rend les tests plus simples à prévoir.
 */
import type { Rng } from './types';

/** Indice aléatoire dans [0, length), ou −1 si la liste est vide. */
export function pickIndex(length: number, rng: Rng): number {
  if (length <= 0) return -1;
  if (length === 1) return 0;
  return Math.min(length - 1, Math.floor(rng() * length));
}

export function pickOne<T>(items: readonly T[], rng: Rng): T | undefined {
  const index = pickIndex(items.length, rng);
  return index < 0 ? undefined : items[index];
}

/** Tire `count` éléments distincts, dans un ordre aléatoire. */
export function pickMany<T>(items: readonly T[], count: number, rng: Rng): T[] {
  const pool = [...items];
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = pickIndex(pool.length, rng);
    const [item] = pool.splice(index, 1);
    if (item !== undefined) picked.push(item);
  }
  return picked;
}

/** Entier aléatoire dans [min, max] inclus. */
export function rangeInt(min: number, max: number, rng: Rng): number {
  if (max <= min) return min;
  return min + pickIndex(max - min + 1, rng);
}

/** Vrai avec la probabilité `chance` (0 à 1). */
export function rollChance(chance: number, rng: Rng): boolean {
  if (chance <= 0) return false;
  if (chance >= 1) return true;
  return rng() < chance;
}

/** Tirage pondéré ; les poids nuls ou négatifs sont ignorés. */
export function weightedPick<T>(
  items: readonly T[],
  weightOf: (item: T) => number,
  rng: Rng,
): T | undefined {
  if (items.length === 0) return undefined;
  if (items.length === 1) return items[0];
  const weights = items.map((item) => Math.max(0, weightOf(item)));
  const total = weights.reduce((acc, weight) => acc + weight, 0);
  if (total <= 0) return pickOne(items, rng);
  let roll = rng() * total;
  for (let i = 0; i < items.length; i += 1) {
    roll -= weights[i] ?? 0;
    if (roll < 0) return items[i];
  }
  return items[items.length - 1];
}

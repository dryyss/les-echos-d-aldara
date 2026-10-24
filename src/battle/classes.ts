/**
 * Classes des héros selon leurs Lueurs Liées (docs/technique/equilibrage.md, section Classes).
 * La Lueur Prisme ne compte pour aucun élément ni pour le total, mais rend possible l'Accordeur.
 */
import { ELEMENTS } from '../data/types';
import type { Element, ElementalValues, HeroData, LueurData, StatKey, Stats } from '../data/types';

export type ClassArchetype = 'base' | 'pure' | 'hybrid' | 'accordeur';

export interface HeroClass {
  name: string;
  /** 0 (classe de base) à 5. */
  rank: number;
  archetype: ClassArchetype;
  primary: Element;
  secondary: Element | null;
  /** Facteurs appliqués en dernier dans le calcul des stats (1,08 = +8 %). */
  multipliers: Partial<Record<StatKey, number>>;
  /** Bonus fixes ajoutés avant les multiplicateurs (ex. +2 Chance par rang pour Vent). */
  flatBonus: Partial<Stats>;
  /** Bonus de Puissance élémentaire (ex. +3 Puissance Eau par rang). */
  powerBonus: Partial<ElementalValues>;
}

export const RANK_THRESHOLDS: readonly number[] = [2, 4, 6, 8, 10];
export const PRISME_ID = 'prisme';

export function isPrisme(lueur: LueurData): boolean {
  return lueur.id === PRISME_ID || lueur.element === 'prisme';
}

export function countLinkedByElement(lueurs: readonly LueurData[]): ElementalValues {
  const counts: ElementalValues = { terre: 0, feu: 0, eau: 0, vent: 0 };
  for (const lueur of lueurs) {
    if (lueur.element !== 'prisme') counts[lueur.element] += 1;
  }
  return counts;
}

/** Nombre de seuils franchis parmi 2, 4, 6, 8, 10. */
export function classRank(total: number): number {
  return RANK_THRESHOLDS.filter((threshold) => total >= threshold).length;
}

interface ThemeAccumulator {
  percent: Partial<Record<StatKey, number>>;
  flat: Partial<Stats>;
  power: Partial<ElementalValues>;
}

function bump<K extends string>(record: Partial<Record<K, number>>, key: K, value: number): void {
  record[key] = (record[key] ?? 0) + value;
}

/** Ajoute le thème d'un élément : `share` vaut 1 (classe pure) ou 0,5 (hybride). */
function addTheme(acc: ThemeAccumulator, element: Element, rank: number, share: number): void {
  const scaled = (value: number): number => value * rank * share;
  switch (element) {
    case 'terre':
      bump(acc.percent, 'hp', scaled(4));
      bump(acc.percent, 'defense', scaled(4));
      break;
    case 'feu':
      bump(acc.percent, 'attack', scaled(5));
      break;
    case 'eau':
      bump(acc.percent, 'pr', scaled(5));
      bump(acc.power, 'eau', scaled(3));
      break;
    case 'vent':
      bump(acc.percent, 'speed', scaled(5));
      bump(acc.flat, 'luck', scaled(2));
      break;
  }
}

function toMultipliers(percent: Partial<Record<StatKey, number>>): Partial<Record<StatKey, number>> {
  const multipliers: Partial<Record<StatKey, number>> = {};
  for (const [key, value] of Object.entries(percent) as [StatKey, number][]) {
    multipliers[key] = 1 + value / 100;
  }
  return multipliers;
}

/** Élément non natif dominant ; égalité tranchée dans l'ordre terre, feu, eau, vent. */
function dominantOther(counts: ElementalValues, primary: Element): Element | null {
  let best: Element | null = null;
  for (const element of ELEMENTS) {
    if (element === primary || counts[element] === 0) continue;
    if (best === null || counts[element] > counts[best]) best = element;
  }
  return best;
}

function accordeurClass(hero: HeroData, rank: number): HeroClass {
  const factor = 1 + (3 * rank) / 100;
  return {
    name: hero.classes.accordeur,
    rank,
    archetype: 'accordeur',
    primary: hero.element,
    secondary: null,
    multipliers: {
      hp: factor,
      pr: factor,
      attack: factor,
      defense: factor,
      speed: factor,
      luck: factor,
    },
    flatBonus: {},
    powerBonus: {},
  };
}

export function computeClass(hero: HeroData, linkedLueurs: readonly LueurData[]): HeroClass {
  const counts = countLinkedByElement(linkedLueurs);
  const total = ELEMENTS.reduce((acc, element) => acc + counts[element], 0);
  const rank = classRank(total);
  const primary = hero.element;

  if (rank === 0) {
    return {
      name: hero.classes.base,
      rank: 0,
      archetype: 'base',
      primary,
      secondary: null,
      multipliers: {},
      flatBonus: {},
      powerBonus: {},
    };
  }

  const hasPrisme = linkedLueurs.some(isPrisme);
  const allFour = ELEMENTS.every((element) => counts[element] > 0);
  if (hasPrisme && allFour) return accordeurClass(hero, rank);

  const acc: ThemeAccumulator = { percent: {}, flat: {}, power: {} };
  const secondary = dominantOther(counts, primary);
  if (secondary === null) {
    addTheme(acc, primary, rank, 1);
    return {
      name: rank <= 2 ? hero.classes.pure[0] : hero.classes.pure[1],
      rank,
      archetype: 'pure',
      primary,
      secondary: null,
      multipliers: toMultipliers(acc.percent),
      flatBonus: acc.flat,
      powerBonus: acc.power,
    };
  }

  addTheme(acc, primary, rank, 0.5);
  addTheme(acc, secondary, rank, 0.5);
  return {
    name: hero.classes.hybrid[secondary],
    rank,
    archetype: 'hybrid',
    primary,
    secondary,
    multipliers: toMultipliers(acc.percent),
    flatBonus: acc.flat,
    powerBonus: acc.power,
  };
}

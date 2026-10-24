/**
 * Calcul des statistiques d'un héros :
 * base + croissance × (niveau − 1), équipement, Lueurs Liées, bonus permanents,
 * bonus fixes de classe, puis multiplicateurs de classe (arrondi inférieur à la fin).
 */
import { ELEMENTS, STAT_KEYS } from '../data/types';
import type {
  ElementalValues,
  FullStats,
  HeroData,
  HeroState,
  ItemData,
  LueurData,
  StatKey,
  Stats,
} from '../data/types';
import { computeClass } from './classes';
import { floorSafe } from './math';
import { levelFromXp, MAX_LEVEL, xpForLevel } from './xp';

export interface StatsContext {
  items: Record<string, ItemData>;
  linkedLueurs: readonly LueurData[];
}

/** Chaque Lueur Liée ajoute +5 Puissance et +5 Résistance dans son élément (Prisme : les 4). */
export const LUEUR_ELEMENT_BONUS = 5;

function mapStats(compute: (key: StatKey) => number): Stats {
  return {
    hp: compute('hp'),
    pr: compute('pr'),
    attack: compute('attack'),
    defense: compute('defense'),
    speed: compute('speed'),
    luck: compute('luck'),
  };
}

function addPartialStats(target: Stats, bonus: Partial<Stats> | undefined): void {
  if (!bonus) return;
  for (const key of STAT_KEYS) target[key] += bonus[key] ?? 0;
}

function addPartialElemental(
  target: ElementalValues,
  bonus: Partial<ElementalValues> | undefined,
): void {
  if (!bonus) return;
  for (const element of ELEMENTS) target[element] += bonus[element] ?? 0;
}

function floorElemental(values: ElementalValues): ElementalValues {
  return {
    terre: floorSafe(values.terre),
    feu: floorSafe(values.feu),
    eau: floorSafe(values.eau),
    vent: floorSafe(values.vent),
  };
}

/** Stats de base au niveau donné, arrondies à l'entier inférieur. */
export function baseStatsAtLevel(hero: HeroData, level: number): Stats {
  const steps = Math.max(0, level - 1);
  return mapStats((key) => floorSafe(hero.baseStats[key] + hero.growth[key] * steps));
}

/** Objets équipés présents dans le catalogue. */
export function equippedItems(state: HeroState, items: Record<string, ItemData>): ItemData[] {
  const equipped: ItemData[] = [];
  for (const itemId of Object.values(state.equipment)) {
    if (itemId === null) continue;
    const item = items[itemId];
    if (item) equipped.push(item);
  }
  return equipped;
}

function addLueurBonus(
  stats: Stats,
  power: ElementalValues,
  resistance: ElementalValues,
  lueur: LueurData,
): void {
  addPartialStats(stats, lueur.bonus);
  addPartialElemental(power, lueur.bonus.power);
  addPartialElemental(resistance, lueur.bonus.resistance);
  const elements = lueur.element === 'prisme' ? ELEMENTS : [lueur.element];
  for (const element of elements) {
    power[element] += LUEUR_ELEMENT_BONUS;
    resistance[element] += LUEUR_ELEMENT_BONUS;
  }
}

export function computeHeroStats(hero: HeroData, state: HeroState, ctx: StatsContext): FullStats {
  const stats = baseStatsAtLevel(hero, state.level);
  const power: ElementalValues = { ...hero.basePower };
  const resistance: ElementalValues = { ...hero.baseResistance };

  for (const item of equippedItems(state, ctx.items)) {
    addPartialStats(stats, item.stats);
    addPartialElemental(resistance, item.resistance);
  }
  for (const lueur of ctx.linkedLueurs) addLueurBonus(stats, power, resistance, lueur);
  addPartialStats(stats, state.permanentBonus);

  const heroClass = computeClass(hero, ctx.linkedLueurs);
  addPartialStats(stats, heroClass.flatBonus);
  addPartialElemental(power, heroClass.powerBonus);

  const multiplied = mapStats((key) => floorSafe(stats[key] * (heroClass.multipliers[key] ?? 1)));
  return {
    ...multiplied,
    power: floorElemental(power),
    resistance: floorElemental(resistance),
  };
}

export interface XpGain {
  state: HeroState;
  levelsGained: number;
  before: Stats;
  after: Stats;
}

/** Ajoute de l'XP ; les PV et PR courants augmentent du gain de PV et PR max (sauf héros K.O.). */
export function gainXp(hero: HeroData, state: HeroState, amount: number): XpGain {
  const xp = Math.min(state.xp + Math.max(0, amount), xpForLevel(MAX_LEVEL));
  const level = Math.max(state.level, levelFromXp(xp));
  const before = baseStatsAtLevel(hero, state.level);
  const after = baseStatsAtLevel(hero, level);
  const hp = state.hp > 0 ? state.hp + (after.hp - before.hp) : state.hp;
  const pr = state.pr + (after.pr - before.pr);
  return {
    state: { ...state, xp, level, hp, pr },
    levelsGained: level - state.level,
    before,
    after,
  };
}

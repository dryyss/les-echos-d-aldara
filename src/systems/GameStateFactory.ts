/**
 * Fabrique et valeurs par défaut de l'état du jeu (sans Phaser).
 * Utilisé par GameState pour créer une nouvelle partie et pour réparer
 * un état chargé auquel il manquerait des champs.
 */
import type {
  EquipSlot,
  GameOptions,
  GameStateData,
  HeroData,
  HeroState,
  Position,
  Stats,
} from '../data/types';
import { EQUIP_SLOTS, STAT_KEYS } from '../data/types';

export const DEFAULT_OPTIONS: GameOptions = {
  musicVolume: 0.7,
  sfxVolume: 0.8,
  textSpeed: 'normal',
  showHints: true,
};

/** Position de départ (sera ajustée quand la carte de la forge existera). */
export const START_POSITION: Position = { map: 'brumeval-forge', x: 4, y: 5, direction: 'down' };

export const STARTING_PARTY = ['kael'] as const;
export const STARTING_ITEMS: Readonly<Record<string, number>> = { 'herbe-soin': 3 };

/** Un PR est rendu à chaque héros tous les N pas. */
export const STEPS_PER_PR = 4;

/** Identifiant de la Lueur secrète, exclue du compte des 27. */
export const PRISME_LUEUR_ID = 'prisme';
export const LUEURS_27_FLAG = 'lueurs_27';
export const LUEURS_27_COUNT = 27;

/**
 * Valeur d'une statistique à un niveau donné : base + croissance par niveau,
 * arrondie. Même formule que src/battle (qui fait foi pour le combat).
 */
export function statAtLevel(base: number, growth: number, level: number): number {
  return Math.round(base + growth * Math.max(0, level - 1));
}

export function maxStatsAt(hero: HeroData, level: number): Stats {
  const stats = {} as Stats;
  for (const key of STAT_KEYS) {
    stats[key] = statAtLevel(hero.baseStats[key], hero.growth[key], level);
  }
  return stats;
}

function emptyEquipment(): Record<EquipSlot, string | null> {
  const equipment = {} as Record<EquipSlot, string | null>;
  for (const slot of EQUIP_SLOTS) equipment[slot] = null;
  return equipment;
}

/**
 * État d'un héros fraîchement recruté : PV et PR au maximum, équipement de
 * départ. `xp` compte les points accumulés depuis la dernière montée de niveau.
 */
export function createHeroState(hero: HeroData, level = 1): HeroState {
  const safeLevel = Math.max(1, Math.floor(level));
  const max = maxStatsAt(hero, safeLevel);
  const equipment = emptyEquipment();
  for (const slot of EQUIP_SLOTS) {
    const item = hero.startingEquipment[slot];
    if (item) equipment[slot] = item;
  }
  return {
    id: hero.id,
    level: safeLevel,
    xp: 0,
    hp: max.hp,
    pr: max.pr,
    equipment,
    permanentBonus: {},
  };
}

/** État vide : aucun héros, rien dans le sac. Base pour une partie ou une réparation. */
export function emptyStateData(options: Partial<GameOptions> = {}): GameStateData {
  return {
    party: [],
    heroes: {},
    lueurs: {},
    inventory: {},
    coins: 0,
    flags: {},
    quests: {},
    resonances: [],
    shortcuts: [null, null],
    position: { ...START_POSITION },
    steps: 0,
    stepsSinceEncounter: 0,
    repelSteps: 0,
    mapState: {},
    lore: [],
    act: 1,
    playTimeMs: 0,
    options: { ...DEFAULT_OPTIONS, ...options },
  };
}

/** Nouvelle partie : Kaël seul au niveau 1, 3 herbes de soin, acte 1. */
export function newGameData(heroes: HeroData[], options: Partial<GameOptions> = {}): GameStateData {
  const data = emptyStateData(options);
  for (const heroId of STARTING_PARTY) {
    const hero = heroes.find((h) => h.id === heroId);
    if (!hero) throw new Error(`Héros de départ introuvable : « ${heroId} »`);
    data.party.push(hero.id);
    data.heroes[hero.id] = createHeroState(hero, 1);
    if (hero.startingLueur) {
      data.lueurs[hero.startingLueur] = { found: true, hero: hero.id, state: 'liee' };
    }
  }
  data.inventory = { ...STARTING_ITEMS };
  return data;
}

/** Copie profonde d'une valeur sérialisable. */
export function deepClone<T>(value: T): T {
  return structuredClone(value);
}

/**
 * Complète un état chargé avec les valeurs par défaut des champs absents
 * (sauvegarde ancienne ou partielle) et renvoie une copie indépendante.
 */
export function normalizeStateData(data: Partial<GameStateData>): GameStateData {
  const base = emptyStateData();
  const merged: GameStateData = {
    ...base,
    ...deepClone(data),
    options: { ...base.options, ...(data.options ?? {}) },
    position: { ...base.position, ...(data.position ?? {}) },
  };
  if (!Array.isArray(merged.shortcuts) || merged.shortcuts.length !== 2) {
    merged.shortcuts = [null, null];
  }
  return merged;
}

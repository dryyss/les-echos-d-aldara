/** Construction des combattants depuis le BattleSetup et gestion des Lueurs d'un héros. */
import type { EnemyData, ItemData, LueurData, LueurState } from '../data/types';
import { clamp, sum } from './math';
import { computeHeroStats, equippedItems } from './stats';
import { KO_STATUSES } from './status';
import type {
  BattleContext,
  BattleEvent,
  BattleSetup,
  EnemyCombatant,
  HeroCombatant,
  HeroSetup,
  Rng,
} from './types';

export function buildHero(setup: HeroSetup, items: Record<string, ItemData>): HeroCombatant {
  const equipped = equippedItems(setup.state, items);
  const immunities = [...new Set(equipped.flatMap((item) => item.immunities ?? []))];
  const prRegen = sum(equipped.map((item) => item.prRegen ?? 0));
  const weaponId = setup.state.equipment.weapon;
  const weapon = weaponId ? (items[weaponId] ?? null) : null;
  const hp = clamp(setup.state.hp, 0, setup.stats.hp);
  const pr = clamp(setup.state.pr, 0, setup.stats.pr);
  return {
    id: setup.data.id,
    name: setup.data.name,
    side: 'hero',
    stats: setup.stats,
    hp,
    pr,
    statuses: hp <= 0 ? [...KO_STATUSES] : [],
    modifiers: [],
    defending: false,
    evasionTurns: 0,
    shield: null,
    element: setup.data.element,
    fled: false,
    data: setup.data,
    state: setup.state,
    spells: setup.spells,
    lueurs: setup.lueurs.map((lueur) => ({ ...lueur })),
    immunities,
    prRegen,
    weapon,
  };
}

/** Identifiants uniques par instance : « sbire-ordre#1 », « sbire-ordre#2 ». */
export function buildEnemies(enemies: readonly EnemyData[]): EnemyCombatant[] {
  const counters = new Map<string, number>();
  return enemies.map((data) => {
    const count = (counters.get(data.id) ?? 0) + 1;
    counters.set(data.id, count);
    const stats = { ...data.stats, power: { ...data.power }, resistance: { ...data.resistance } };
    return {
      id: `${data.id}#${count}`,
      name: data.name,
      side: 'enemy',
      stats,
      hp: stats.hp,
      pr: stats.pr,
      statuses: [],
      modifiers: [],
      defending: false,
      evasionTurns: 0,
      shield: null,
      element: data.element,
      fled: false,
      data,
      phase: 0,
      attackMultiplier: 1,
    };
  });
}

export function createContext(setup: BattleSetup, rng: Rng): BattleContext {
  return {
    heroes: setup.heroes.map((hero) => buildHero(hero, setup.items)),
    enemies: buildEnemies(setup.enemies),
    inventory: { ...setup.inventory },
    items: setup.items,
    summons: setup.summons,
    scripted: setup.scripted,
    canFlee: setup.canFlee,
    rng,
    turn: 1,
    fled: false,
  };
}

export function linkedLueurs(hero: HeroCombatant): LueurData[] {
  return hero.lueurs.filter((lueur) => lueur.state === 'liee').map((lueur) => lueur.data);
}

/** Recalcule les stats après un changement d'état de Lueur ; PV et PR courants bornés au max. */
export function recomputeHeroStats(ctx: BattleContext, hero: HeroCombatant): void {
  hero.stats = computeHeroStats(hero.data, hero.state, {
    items: ctx.items,
    linkedLueurs: linkedLueurs(hero),
  });
  hero.hp = Math.min(hero.hp, hero.stats.hp);
  hero.pr = Math.min(hero.pr, hero.stats.pr);
}

export function setLueurState(
  ctx: BattleContext,
  hero: HeroCombatant,
  lueurId: string,
  state: LueurState,
  events: BattleEvent[],
): boolean {
  const lueur = hero.lueurs.find((owned) => owned.data.id === lueurId);
  if (!lueur || lueur.state === state) return false;
  lueur.state = state;
  events.push({ type: 'lueur-state', hero: hero.id, lueurId, state });
  recomputeHeroStats(ctx, hero);
  return true;
}

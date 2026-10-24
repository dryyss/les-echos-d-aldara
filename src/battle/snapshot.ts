/** Instantané du combat pour l'interface et l'IA (copies, jamais de référence interne). */
import { effectiveStats } from './modifiers';
import { canAct } from './status';
import { canFleeNow, isAlive } from './targeting';
import type {
  BattleContext,
  BattleSnapshot,
  Combatant,
  CombatantSnapshot,
  EnemyCombatant,
  EnemySnapshot,
  HeroCombatant,
  HeroSnapshot,
} from './types';

function baseSnapshot(combatant: Combatant): CombatantSnapshot {
  const alive = isAlive(combatant);
  return {
    id: combatant.id,
    name: combatant.name,
    side: combatant.side,
    hp: combatant.hp,
    maxHp: combatant.stats.hp,
    pr: combatant.pr,
    maxPr: combatant.stats.pr,
    alive,
    fled: combatant.fled,
    canAct: alive && canAct(combatant.statuses),
    element: combatant.element,
    stats: effectiveStats(combatant),
    statuses: combatant.statuses.map((status) => ({ id: status.id, turns: status.turns })),
    modifiers: combatant.modifiers.map((modifier) => ({ ...modifier })),
    defending: combatant.defending,
    evasionTurns: combatant.evasionTurns,
    shield: combatant.shield ? { ...combatant.shield } : null,
  };
}

export function heroSnapshot(hero: HeroCombatant, heroIndex: number): HeroSnapshot {
  return {
    ...baseSnapshot(hero),
    side: 'hero',
    heroIndex,
    heroId: hero.data.id,
    level: hero.state.level,
    lueurs: hero.lueurs.map((lueur) => ({
      id: lueur.data.id,
      name: lueur.data.name,
      element: lueur.data.element,
      state: lueur.state,
    })),
  };
}

export function enemySnapshot(enemy: EnemyCombatant): EnemySnapshot {
  return {
    ...baseSnapshot(enemy),
    side: 'enemy',
    enemyId: enemy.data.id,
    phase: enemy.phase,
    boss: enemy.data.boss,
    noFlee: enemy.data.noFlee === true,
  };
}

export function buildSnapshot(ctx: BattleContext): BattleSnapshot {
  return {
    turn: ctx.turn,
    heroes: ctx.heroes.map((hero, index) => heroSnapshot(hero, index)),
    enemies: ctx.enemies.map(enemySnapshot),
    canFlee: canFleeNow(ctx),
  };
}

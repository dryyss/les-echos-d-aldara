/** Ciblage : vivants, camps, portées (TargetScope), re-ciblage et confusion. */
import type { TargetScope } from '../data/types';
import { pickOne } from './random';
import { isConfused } from './status';
import type { BattleContext, Combatant } from './types';

export function isAlive(combatant: Combatant): boolean {
  return combatant.hp > 0 && !combatant.fled;
}

/** K.O. mais toujours présent (ressuscitable). */
export function isDown(combatant: Combatant): boolean {
  return combatant.hp <= 0 && !combatant.fled;
}

export function allCombatants(ctx: BattleContext): Combatant[] {
  return [...ctx.heroes, ...ctx.enemies];
}

export function findCombatant(ctx: BattleContext, id: string): Combatant | undefined {
  return allCombatants(ctx).find((combatant) => combatant.id === id);
}

export function alliesOf(ctx: BattleContext, actor: Combatant): Combatant[] {
  return actor.side === 'hero' ? ctx.heroes : ctx.enemies;
}

export function opponentsOf(ctx: BattleContext, actor: Combatant): Combatant[] {
  return actor.side === 'hero' ? ctx.enemies : ctx.heroes;
}

export function aliveHeroes(ctx: BattleContext): Combatant[] {
  return ctx.heroes.filter(isAlive);
}

export function aliveEnemies(ctx: BattleContext): Combatant[] {
  return ctx.enemies.filter(isAlive);
}

/** Fuite possible : autorisée par le combat et aucun ennemi `noFlee` encore debout. */
export function canFleeNow(ctx: BattleContext): boolean {
  return ctx.canFlee && !ctx.enemies.some((enemy) => isAlive(enemy) && enemy.data.noFlee);
}

export function isSingleScope(scope: TargetScope): boolean {
  return scope === 'enemy' || scope === 'ally' || scope === 'self' || scope === 'any';
}

function scopePool(ctx: BattleContext, actor: Combatant, scope: TargetScope): Combatant[] {
  switch (scope) {
    case 'enemy':
    case 'enemies':
      return opponentsOf(ctx, actor);
    case 'ally':
    case 'allies':
    case 'self':
      return alliesOf(ctx, actor);
    case 'any':
      return allCombatants(ctx);
  }
}

export interface TargetOptions {
  /** Ne viser que les K.O. (résurrection). */
  koOnly?: boolean;
  /** Action offensive : la confusion redirige vers une cible au hasard parmi tous. */
  offensive?: boolean;
}

/** Cibles valides pour une portée donnée (pour la liste des commandes). */
export function scopeCandidates(
  ctx: BattleContext,
  actor: Combatant,
  scope: TargetScope,
  options: TargetOptions = {},
): Combatant[] {
  if (scope === 'self') return [actor];
  const pool = scopePool(ctx, actor, scope);
  return options.koOnly ? pool.filter(isDown) : pool.filter(isAlive);
}

/**
 * Cibles effectives au moment de l'exécution : si la cible choisie n'est plus valide,
 * une autre est tirée au hasard dans le même camp.
 */
export function resolveTargets(
  ctx: BattleContext,
  actor: Combatant,
  scope: TargetScope,
  chosenId: string | undefined,
  options: TargetOptions = {},
): Combatant[] {
  const candidates = scopeCandidates(ctx, actor, scope, options);
  if (!isSingleScope(scope)) return candidates;
  if (scope === 'self') return [actor];
  if (options.offensive && isConfused(actor.statuses)) {
    const anyone = allCombatants(ctx).filter(isAlive);
    const target = pickOne(anyone, ctx.rng);
    return target ? [target] : [];
  }
  const chosen = candidates.find((candidate) => candidate.id === chosenId);
  if (chosen) return [chosen];
  const fallback = pickOne(candidates, ctx.rng);
  return fallback ? [fallback] : [];
}

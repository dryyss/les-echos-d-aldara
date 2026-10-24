/** Effets de Lueur Libérée et d'invocation (UnleashEffect), lancés par un héros. */
import type { Element, UnleashEffect } from '../data/types';
import {
  applyModifier,
  cureStatuses,
  dealDamage,
  healHp,
  inflictStatus,
  reviveCombatant,
} from './effects';
import { healAmount, spellDamage } from './formulas';
import { pickMany } from './random';
import { alliesOf, isAlive, isDown, opponentsOf, resolveTargets } from './targeting';
import type { BattleContext, BattleEvent, Combatant, HeroCombatant, TargetChoice } from './types';

export type UnleashKind = 'lueur' | 'summon';

const ids = (combatants: readonly Combatant[]): string[] => combatants.map((c) => c.id);

/** Cibles proposées à l'interface pour un effet donné. */
export function unleashCandidates(
  ctx: BattleContext,
  actor: HeroCombatant,
  effect: UnleashEffect,
): TargetChoice {
  const enemies = ids(opponentsOf(ctx, actor).filter(isAlive));
  const allies = ids(alliesOf(ctx, actor).filter(isAlive));
  switch (effect.type) {
    case 'damage':
    case 'debuff':
    case 'status':
      return { targets: enemies, needsTarget: effect.targets !== 'all' };
    case 'first-strike':
      return { targets: enemies, needsTarget: true };
    case 'heal':
    case 'buff':
      return { targets: allies, needsTarget: effect.targets !== 'all' };
    case 'evasion':
    case 'shield':
      return { targets: allies, needsTarget: false };
    case 'revive':
      return { targets: ids(alliesOf(ctx, actor).filter(isDown)), needsTarget: true };
  }
}

function enemyTargets(
  ctx: BattleContext,
  actor: HeroCombatant,
  all: boolean,
  chosenId: string | undefined,
): Combatant[] {
  return resolveTargets(ctx, actor, all ? 'enemies' : 'enemy', chosenId, { offensive: true });
}

function allyTargets(
  ctx: BattleContext,
  actor: HeroCombatant,
  all: boolean,
  chosenId: string | undefined,
): Combatant[] {
  return resolveTargets(ctx, actor, all ? 'allies' : 'ally', chosenId);
}

/** Cible choisie puis `count − 1` autres ennemis tirés au hasard. */
function multiTargets(
  ctx: BattleContext,
  actor: HeroCombatant,
  count: number,
  chosenId: string | undefined,
): Combatant[] {
  const primary = enemyTargets(ctx, actor, false, chosenId)[0];
  if (!primary) return [];
  const others = opponentsOf(ctx, actor).filter((c) => isAlive(c) && c.id !== primary.id);
  return [primary, ...pickMany(others, count - 1, ctx.rng)];
}

function unleashDamage(
  ctx: BattleContext,
  actor: HeroCombatant,
  power: number,
  element: Element,
  count: number | 'all',
  chosenId: string | undefined,
  kind: UnleashKind,
  events: BattleEvent[],
): void {
  const targets =
    count === 'all' ? enemyTargets(ctx, actor, true, undefined) : multiTargets(ctx, actor, count, chosenId);
  for (const target of targets) {
    const amount = spellDamage(power, actor.stats.power[element], target.stats.resistance[element]);
    dealDamage(ctx, target, { amount, element, kind, crit: false }, events);
  }
}

export function applyUnleash(
  ctx: BattleContext,
  actor: HeroCombatant,
  effect: UnleashEffect,
  chosenId: string | undefined,
  kind: UnleashKind,
  events: BattleEvent[],
): void {
  switch (effect.type) {
    case 'damage':
      unleashDamage(ctx, actor, effect.power, effect.element, effect.targets, chosenId, kind, events);
      return;
    case 'first-strike':
      unleashDamage(ctx, actor, effect.power, effect.element, 1, chosenId, kind, events);
      return;
    case 'heal': {
      const amount = healAmount(effect.power, actor.stats.power.eau);
      for (const target of allyTargets(ctx, actor, effect.targets === 'all', chosenId)) {
        healHp(target, amount, events);
        if (effect.cures) cureStatuses(target, effect.cures, events);
      }
      return;
    }
    case 'buff':
      for (const target of allyTargets(ctx, actor, effect.targets === 'all', chosenId)) {
        applyModifier(target, 'buff', effect.stat, effect.amount, effect.turns, events);
      }
      return;
    case 'debuff':
      for (const target of enemyTargets(ctx, actor, effect.targets === 'all', chosenId)) {
        applyModifier(target, 'debuff', effect.stat, effect.amount, effect.turns, events);
      }
      return;
    case 'status':
      for (const target of enemyTargets(ctx, actor, effect.targets === 'all', chosenId)) {
        inflictStatus(ctx, target, effect.status, effect.chance, events);
      }
      return;
    case 'evasion':
      for (const target of alliesOf(ctx, actor).filter(isAlive)) {
        target.evasionTurns = Math.max(target.evasionTurns, effect.turns);
        events.push({ type: 'evasion', target: target.id, turns: effect.turns });
      }
      return;
    case 'shield':
      for (const target of alliesOf(ctx, actor).filter(isAlive)) {
        target.shield = { turns: effect.turns, amount: effect.amount };
        events.push({ type: 'shield', target: target.id, turns: effect.turns, amount: effect.amount });
      }
      return;
    case 'revive': {
      const target = resolveTargets(ctx, actor, 'ally', chosenId, { koOnly: true })[0];
      if (target) reviveCombatant(target, effect.power, events);
      return;
    }
  }
}

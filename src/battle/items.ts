/** Objets consommables utilisés en combat. */
import type { ConsumableEffect } from '../data/types';
import { cureStatuses, healHp, restorePr, reviveCombatant } from './effects';
import { alliesOf, isAlive, isDown, resolveTargets } from './targeting';
import type {
  BattleCommand,
  BattleContext,
  BattleEvent,
  Combatant,
  HeroCombatant,
  TargetChoice,
} from './types';

export type ItemCommand = Extract<BattleCommand, { kind: 'item' }>;

const ids = (combatants: readonly Combatant[]): string[] => combatants.map((c) => c.id);

/** Cibles proposées pour un consommable, null s'il est inutilisable en combat (Encens). */
export function itemCandidates(
  ctx: BattleContext,
  hero: HeroCombatant,
  effect: ConsumableEffect,
): TargetChoice | null {
  const allies = alliesOf(ctx, hero);
  switch (effect.type) {
    case 'heal':
    case 'restore-pr':
    case 'cure':
      return { targets: ids(allies.filter(isAlive)), needsTarget: effect.targets === 'ally' };
    case 'revive':
      return { targets: ids(allies.filter(isDown)), needsTarget: true };
    case 'full-heal':
      return { targets: ids(allies.filter((ally) => !ally.fled)), needsTarget: false };
    case 'repel':
      return null;
  }
}

function itemTargets(
  ctx: BattleContext,
  hero: HeroCombatant,
  effect: ConsumableEffect,
  chosenId: string | undefined,
): Combatant[] {
  switch (effect.type) {
    case 'heal':
    case 'restore-pr':
    case 'cure':
      return resolveTargets(ctx, hero, effect.targets === 'ally' ? 'ally' : 'allies', chosenId);
    case 'revive':
      return resolveTargets(ctx, hero, 'ally', chosenId, { koOnly: true });
    case 'full-heal':
      return alliesOf(ctx, hero).filter((ally) => !ally.fled);
    case 'repel':
      return [];
  }
}

/** Soin complet : PV, PR et statuts ; ramène aussi les K.O. */
function fullHeal(target: Combatant, events: BattleEvent[]): void {
  if (isDown(target)) {
    reviveCombatant(target, 100, events);
  } else {
    cureStatuses(
      target,
      target.statuses.map((status) => status.id),
      events,
    );
    healHp(target, target.stats.hp, events);
  }
  restorePr(target, target.stats.pr, events);
}

function applyConsumable(
  effect: ConsumableEffect,
  targets: readonly Combatant[],
  events: BattleEvent[],
): void {
  for (const target of targets) {
    switch (effect.type) {
      case 'heal':
        healHp(target, effect.amount, events);
        break;
      case 'restore-pr':
        restorePr(target, effect.amount, events);
        break;
      case 'cure':
        cureStatuses(target, effect.status, events);
        break;
      case 'revive':
        reviveCombatant(target, effect.percent, events);
        break;
      case 'full-heal':
        fullHeal(target, events);
        break;
      case 'repel':
        break;
    }
  }
}

export function useItem(
  ctx: BattleContext,
  hero: HeroCombatant,
  command: ItemCommand,
  events: BattleEvent[],
): void {
  const item = ctx.items[command.itemId];
  const quantity = ctx.inventory[command.itemId] ?? 0;
  if (!item?.effect || quantity <= 0 || item.effect.type === 'repel') {
    events.push({ type: 'action-failed', actor: hero.id, reason: 'item' });
    return;
  }
  const targets = itemTargets(ctx, hero, item.effect, command.target);
  ctx.inventory[command.itemId] = quantity - 1;
  events.push({ type: 'action-start', actor: hero.id, command, name: item.name, targets: ids(targets) });
  events.push({ type: 'item-used', actor: hero.id, itemId: command.itemId, name: item.name });
  applyConsumable(item.effect, targets, events);
}

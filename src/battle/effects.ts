/**
 * Effets élémentaires appliqués à un combattant : dégâts, soins, statuts, buffs,
 * résurrection, K.O. et changement de phase des boss. Chaque effet pousse ses événements.
 */
import type { ElementOrNeutral, StatKey, StatusId } from '../data/types';
import { defendedDamage } from './formulas';
import { addModifier } from './modifiers';
import { rollChance } from './random';
import { applyStatus, KO_STATUSES, removeStatus, wakeIfHit } from './status';
import { isAlive, isDown } from './targeting';
import type { BattleContext, BattleEvent, Combatant, DamageKind, EnemyCombatant } from './types';

/** Chance d'esquiver sous l'effet Évasion (Lueur Brume). */
export const EVASION_CHANCE = 0.5;

export interface DamageInput {
  amount: number;
  element: ElementOrNeutral;
  kind: DamageKind;
  crit: boolean;
}

/** Règle spéciale : Varn phase 2 est invulnérable tant qu'une Lueur volée est en vie. */
export function isProtected(ctx: BattleContext, target: Combatant): boolean {
  if (target.side !== 'enemy' || !target.data.id.startsWith('varn-2')) return false;
  return ctx.enemies.some((enemy) => enemy.data.id.startsWith('lueur-volee') && isAlive(enemy));
}

/** Défense, bouclier et esquive ; null si le coup est esquivé. */
function mitigate(ctx: BattleContext, target: Combatant, input: DamageInput): number | null {
  if (input.kind === 'poison') return input.amount;
  if (target.evasionTurns > 0 && rollChance(EVASION_CHANCE, ctx.rng)) return null;
  let amount = input.amount;
  if (target.defending) amount = defendedDamage(amount);
  if (target.shield) amount = Math.floor(amount * (1 - target.shield.amount / 100));
  return Math.max(1, amount);
}

export function knockOut(target: Combatant, events: BattleEvent[]): void {
  target.hp = 0;
  target.statuses = [...KO_STATUSES];
  target.modifiers = [];
  target.defending = false;
  target.evasionTurns = 0;
  target.shield = null;
  events.push({ type: 'ko', target: target.id });
}

export function checkPhaseChange(enemy: EnemyCombatant, events: BattleEvent[]): void {
  const phases = enemy.data.phases ?? [];
  const ratio = enemy.hp / enemy.stats.hp;
  let next = enemy.phase;
  phases.forEach((phase, index) => {
    if (ratio < phase.hpBelow) next = Math.max(next, index + 1);
  });
  const phase = phases[next - 1];
  if (next === enemy.phase || !phase) return;
  enemy.phase = next;
  if (phase.element) enemy.element = phase.element;
  enemy.attackMultiplier = phase.attackMultiplier ?? 1;
  events.push({ type: 'phase-change', enemy: enemy.id, phase: next, line: phase.line });
}

/** Inflige des dégâts et renvoie le montant réellement subi (0 si raté ou protégé). */
export function dealDamage(
  ctx: BattleContext,
  target: Combatant,
  input: DamageInput,
  events: BattleEvent[],
): number {
  if (!isAlive(target)) return 0;
  if (isProtected(ctx, target)) {
    events.push({ type: 'miss', target: target.id, reason: 'protege' });
    return 0;
  }
  const amount = mitigate(ctx, target, input);
  if (amount === null) {
    events.push({ type: 'miss', target: target.id, reason: 'esquive' });
    return 0;
  }
  target.hp = Math.max(0, target.hp - amount);
  events.push({
    type: 'damage',
    target: target.id,
    amount,
    crit: input.crit,
    element: input.element,
    kind: input.kind,
  });
  if (target.hp <= 0) {
    knockOut(target, events);
    return amount;
  }
  const woken = wakeIfHit(target.statuses);
  if (woken.woke) {
    target.statuses = woken.statuses;
    events.push({ type: 'status-removed', target: target.id, status: 'sommeil' });
  }
  if (target.side === 'enemy') checkPhaseChange(target, events);
  return amount;
}

export function healHp(target: Combatant, amount: number, events: BattleEvent[]): number {
  if (!isAlive(target)) return 0;
  const healed = Math.max(0, Math.min(amount, target.stats.hp - target.hp));
  target.hp += healed;
  events.push({ type: 'heal', target: target.id, amount: healed, resource: 'hp' });
  return healed;
}

export function restorePr(target: Combatant, amount: number, events: BattleEvent[]): number {
  if (!isAlive(target)) return 0;
  const restored = Math.max(0, Math.min(amount, target.stats.pr - target.pr));
  target.pr += restored;
  events.push({ type: 'heal', target: target.id, amount: restored, resource: 'pr' });
  return restored;
}

export function inflictStatus(
  ctx: BattleContext,
  target: Combatant,
  status: StatusId,
  chance: number,
  events: BattleEvent[],
): boolean {
  if (!isAlive(target)) return false;
  if (!rollChance(chance, ctx.rng)) {
    events.push({ type: 'miss', target: target.id, reason: 'resiste' });
    return false;
  }
  const immunities = target.side === 'hero' ? target.immunities : [];
  const result = applyStatus(target.statuses, status, ctx.rng, immunities);
  if (!result.applied) {
    if (result.reason === 'immunise') {
      events.push({ type: 'miss', target: target.id, reason: 'immunise' });
    }
    return false;
  }
  target.statuses = result.statuses;
  const instance = result.statuses[result.statuses.length - 1];
  events.push({
    type: 'status-applied',
    target: target.id,
    status,
    turns: instance?.turns ?? null,
  });
  return true;
}

export function cureStatuses(
  target: Combatant,
  statuses: readonly StatusId[],
  events: BattleEvent[],
): void {
  if (!isAlive(target)) return;
  for (const status of statuses) {
    if (!target.statuses.some((instance) => instance.id === status)) continue;
    target.statuses = removeStatus(target.statuses, status);
    events.push({ type: 'status-removed', target: target.id, status });
  }
}

export function applyModifier(
  target: Combatant,
  kind: 'buff' | 'debuff',
  stat: StatKey,
  amount: number,
  turns: number,
  events: BattleEvent[],
): void {
  if (!isAlive(target)) return;
  const signed = kind === 'buff' ? Math.abs(amount) : -Math.abs(amount);
  target.modifiers = addModifier(target.modifiers, { kind, stat, amount: signed, turns });
  events.push({ type: kind, target: target.id, stat, amount: signed, turns });
}

/** Ramène un K.O. avec `percent` % de ses PV max (1 minimum). */
export function reviveCombatant(target: Combatant, percent: number, events: BattleEvent[]): boolean {
  if (!isDown(target)) return false;
  target.hp = Math.max(1, Math.floor((target.stats.hp * percent) / 100));
  target.statuses = [];
  events.push({ type: 'revive', target: target.id, hp: target.hp });
  return true;
}

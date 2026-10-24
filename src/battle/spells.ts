/** Résonances de combat (sorts) lancées par un héros. */
import type { ElementOrNeutral, SpellData, StatusId } from '../data/types';
import {
  applyModifier,
  cureStatuses,
  dealDamage,
  healHp,
  inflictStatus,
  reviveCombatant,
} from './effects';
import { healAmount, spellDamage } from './formulas';
import { isSilenced } from './status';
import { resolveTargets } from './targeting';
import type { BattleCommand, BattleContext, BattleEvent, Combatant, HeroCombatant } from './types';

/** Durée par défaut d'un buff ou debuff sans `turns`. */
export const DEFAULT_MODIFIER_TURNS = 3;

export type SpellCommand = Extract<BattleCommand, { kind: 'spell' }>;

export function isOffensiveSpell(spell: SpellData): boolean {
  return spell.kind === 'damage' || spell.kind === 'debuff' || spell.kind === 'status';
}

export function casterPower(caster: Combatant, element: ElementOrNeutral): number {
  return element === 'neutre' ? 0 : caster.stats.power[element];
}

export function targetResistance(target: Combatant, element: ElementOrNeutral): number {
  return element === 'neutre' ? 0 : target.stats.resistance[element];
}

export function statusList(spell: SpellData): StatusId[] {
  if (spell.status === undefined) return [];
  return Array.isArray(spell.status) ? spell.status : [spell.status];
}

/** Règle spéciale : Varn phase 3 reçoit les dégâts des Accords × 2. */
function accordMultiplier(spell: SpellData, target: Combatant): number {
  const isVarn3 = target.side === 'enemy' && target.data.id.startsWith('varn-3');
  return spell.accord && isVarn3 ? 2 : 1;
}

function applySpellStatuses(
  ctx: BattleContext,
  target: Combatant,
  spell: SpellData,
  events: BattleEvent[],
): void {
  for (const status of statusList(spell)) {
    inflictStatus(ctx, target, status, spell.statusChance ?? 1, events);
  }
}

function applySpell(
  ctx: BattleContext,
  hero: HeroCombatant,
  spell: SpellData,
  target: Combatant,
  events: BattleEvent[],
): void {
  switch (spell.kind) {
    case 'damage': {
      const base = spellDamage(
        spell.power,
        casterPower(hero, spell.element),
        targetResistance(target, spell.element),
      );
      const amount = base * accordMultiplier(spell, target);
      const input = { amount, element: spell.element, kind: 'spell' as const, crit: false };
      const dealt = dealDamage(ctx, target, input, events);
      if (dealt > 0 && spell.status) applySpellStatuses(ctx, target, spell, events);
      return;
    }
    case 'heal':
      healHp(target, healAmount(spell.power, hero.stats.power.eau), events);
      return;
    case 'buff':
    case 'debuff':
      if (spell.stat) {
        const turns = spell.turns ?? DEFAULT_MODIFIER_TURNS;
        applyModifier(target, spell.kind, spell.stat, spell.amount ?? 0, turns, events);
      }
      return;
    case 'status':
      applySpellStatuses(ctx, target, spell, events);
      return;
    case 'cure':
      cureStatuses(target, statusList(spell), events);
      return;
    case 'revive':
      reviveCombatant(target, spell.power, events);
      return;
  }
}

export function castSpell(
  ctx: BattleContext,
  hero: HeroCombatant,
  command: SpellCommand,
  events: BattleEvent[],
): void {
  const spell = hero.spells.find((known) => known.id === command.spellId);
  if (!spell) throw new Error(`Sort inconnu : ${command.spellId}`);
  if (isSilenced(hero.statuses)) {
    events.push({ type: 'action-failed', actor: hero.id, reason: 'silence' });
    return;
  }
  if (hero.pr < spell.cost) {
    events.push({ type: 'action-failed', actor: hero.id, reason: 'pr' });
    return;
  }
  const targets = resolveTargets(ctx, hero, spell.targets, command.target, {
    koOnly: spell.kind === 'revive',
    offensive: isOffensiveSpell(spell),
  });
  hero.pr -= spell.cost;
  events.push({
    type: 'action-start',
    actor: hero.id,
    command,
    name: spell.name,
    targets: targets.map((target) => target.id),
  });
  if (targets.length === 0) {
    events.push({ type: 'action-failed', actor: hero.id, reason: 'no-target' });
    return;
  }
  for (const target of targets) applySpell(ctx, hero, spell, target, events);
}

/** Exécution d'une compétence d'ennemi choisie par l'IA. */
import type { EnemySkill } from '../data/types';
import { isOffensiveSkill } from './ai';
import { applyModifier, dealDamage, healHp, inflictStatus } from './effects';
import {
  applyCrit,
  elementalMultiplier,
  healAmount,
  physicalDamage,
  rollCrit,
  spellDamage,
} from './formulas';
import { floorSafe } from './math';
import { effectiveStats } from './modifiers';
import { casterPower, DEFAULT_MODIFIER_TURNS, targetResistance } from './spells';
import { resolveTargets } from './targeting';
import type {
  BattleContext,
  BattleEvent,
  Combatant,
  EnemyCombatant,
  EnemySkillCommand,
} from './types';

/** Compétence « attack » : dégâts physiques avec Attaque + power, critique possible, élément éventuel. */
function skillAttack(
  ctx: BattleContext,
  enemy: EnemyCombatant,
  skill: EnemySkill,
  target: Combatant,
  events: BattleEvent[],
): void {
  const attacker = effectiveStats(enemy);
  const defender = effectiveStats(target);
  let amount = physicalDamage(attacker.attack + skill.power, defender.defense, ctx.rng);
  const crit = rollCrit(attacker.luck, ctx.rng);
  if (crit) amount = applyCrit(amount);
  if (skill.element !== 'neutre') {
    const factor = elementalMultiplier(
      attacker.power[skill.element],
      defender.resistance[skill.element],
    );
    amount = Math.max(1, floorSafe(amount * factor));
  }
  const input = { amount, element: skill.element, kind: 'physical' as const, crit };
  const dealt = dealDamage(ctx, target, input, events);
  if (dealt > 0 && skill.status) {
    inflictStatus(ctx, target, skill.status, skill.statusChance ?? 1, events);
  }
}

function skillSpell(
  ctx: BattleContext,
  enemy: EnemyCombatant,
  skill: EnemySkill,
  target: Combatant,
  events: BattleEvent[],
): void {
  const amount = spellDamage(
    skill.power,
    casterPower(enemy, skill.element),
    targetResistance(target, skill.element),
  );
  const input = { amount, element: skill.element, kind: 'spell' as const, crit: false };
  const dealt = dealDamage(ctx, target, input, events);
  if (dealt > 0 && skill.status) {
    inflictStatus(ctx, target, skill.status, skill.statusChance ?? 1, events);
  }
}

function applySkill(
  ctx: BattleContext,
  enemy: EnemyCombatant,
  skill: EnemySkill,
  target: Combatant,
  events: BattleEvent[],
): void {
  switch (skill.kind) {
    case 'attack':
      skillAttack(ctx, enemy, skill, target, events);
      return;
    case 'spell':
      skillSpell(ctx, enemy, skill, target, events);
      return;
    case 'heal':
      healHp(target, healAmount(skill.power, enemy.stats.power.eau), events);
      return;
    case 'buff':
    case 'debuff':
      if (skill.stat) {
        const turns = skill.turns ?? DEFAULT_MODIFIER_TURNS;
        applyModifier(target, skill.kind, skill.stat, skill.amount ?? 0, turns, events);
      }
      return;
    case 'status':
      if (skill.status) inflictStatus(ctx, target, skill.status, skill.statusChance ?? 1, events);
      return;
    case 'flee':
      return;
  }
}

export function executeEnemyAction(
  ctx: BattleContext,
  enemy: EnemyCombatant,
  command: EnemySkillCommand,
  events: BattleEvent[],
): void {
  const { skill } = command;
  // Les cibles prévues par l'IA sont revalidées : une cible K.O. est remplacée au hasard.
  const targets = resolveTargets(ctx, enemy, skill.targets, command.targets[0], {
    offensive: isOffensiveSkill(skill),
  });
  const targetIds = targets.map((target) => target.id);
  events.push({
    type: 'action-start',
    actor: enemy.id,
    command: { ...command, targets: targetIds },
    name: skill.name,
    targets: targetIds,
  });
  if (skill.kind === 'flee') {
    enemy.fled = true;
    events.push({ type: 'flee-success', actor: enemy.id });
    return;
  }
  if (targets.length === 0) {
    events.push({ type: 'action-failed', actor: enemy.id, reason: 'no-target' });
    return;
  }
  for (const target of targets) applySkill(ctx, enemy, skill, target, events);
}

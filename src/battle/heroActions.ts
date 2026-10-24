/** Exécution des commandes d'un héros : attaque, sort, Lueur, invocation, objet, défense, fuite. */
import type { ElementOrNeutral } from '../data/types';
import { setLueurState } from './combatants';
import { dealDamage, inflictStatus } from './effects';
import {
  applyCrit,
  elementalMultiplier,
  fleeChance,
  physicalDamage,
  rollCrit,
} from './formulas';
import { useItem } from './items';
import { floorSafe } from './math';
import { effectiveStats } from './modifiers';
import { rollChance } from './random';
import { castSpell } from './spells';
import { pickLueursForSummon } from './summons';
import { aliveEnemies, aliveHeroes, canFleeNow, resolveTargets } from './targeting';
import type { BattleCommand, BattleContext, BattleEvent, HeroCombatant } from './types';
import { applyUnleash, unleashCandidates } from './unleash';

type Command<K extends BattleCommand['kind']> = Extract<BattleCommand, { kind: K }>;

/** Une Lueur « first-strike » agit avant tout le monde. */
export function isFirstStrike(hero: HeroCombatant, command: BattleCommand): boolean {
  if (command.kind !== 'lueur') return false;
  const lueur = hero.lueurs.find((owned) => owned.data.id === command.lueurId);
  return lueur?.data.unleash.type === 'first-strike';
}

function heroAttack(
  ctx: BattleContext,
  hero: HeroCombatant,
  command: Command<'attack'>,
  events: BattleEvent[],
): void {
  const target = resolveTargets(ctx, hero, 'enemy', command.target, { offensive: true })[0];
  const targets = target ? [target.id] : [];
  events.push({ type: 'action-start', actor: hero.id, command, name: 'Attaque', targets });
  if (!target) {
    events.push({ type: 'action-failed', actor: hero.id, reason: 'no-target' });
    return;
  }
  const attacker = effectiveStats(hero);
  const defender = effectiveStats(target);
  let amount = physicalDamage(attacker.attack, defender.defense, ctx.rng);
  const crit = rollCrit(attacker.luck, ctx.rng);
  if (crit) amount = applyCrit(amount);

  const effect = hero.weapon?.weaponEffect;
  const triggered = effect !== undefined && rollChance(effect.chance, ctx.rng);
  let element: ElementOrNeutral = 'neutre';
  if (effect && triggered && effect.element) {
    element = effect.element;
    const factor = elementalMultiplier(attacker.power[element], defender.resistance[element]);
    amount = Math.max(1, floorSafe(amount * factor));
  }
  const dealt = dealDamage(ctx, target, { amount, element, kind: 'physical', crit }, events);
  if (effect && triggered && effect.status && dealt > 0) {
    inflictStatus(ctx, target, effect.status, 1, events);
  }
}

function unleashLueur(
  ctx: BattleContext,
  hero: HeroCombatant,
  command: Command<'lueur'>,
  events: BattleEvent[],
): void {
  const lueur = hero.lueurs.find((owned) => owned.data.id === command.lueurId);
  if (!lueur || lueur.state !== 'liee') {
    events.push({ type: 'action-failed', actor: hero.id, reason: 'lueur' });
    return;
  }
  const choice = unleashCandidates(ctx, hero, lueur.data.unleash);
  const targets = command.target ? [command.target] : choice.targets;
  events.push({ type: 'action-start', actor: hero.id, command, name: lueur.data.name, targets });
  events.push({
    type: 'lueur-unleashed',
    actor: hero.id,
    lueurId: lueur.data.id,
    name: lueur.data.name,
  });
  events.push({ type: 'line', actor: lueur.data.id, text: lueur.data.cry });
  applyUnleash(ctx, hero, lueur.data.unleash, command.target, 'lueur', events);
  setLueurState(ctx, hero, lueur.data.id, 'liberee', events);
}

function invokeSummon(
  ctx: BattleContext,
  hero: HeroCombatant,
  command: Command<'summon'>,
  events: BattleEvent[],
): void {
  const summon = ctx.summons.find((candidate) => candidate.id === command.summonId);
  // Les Lueurs de l'invocateur sont consommées en priorité.
  const owned = [...ctx.heroes]
    .sort((a, b) => Number(b === hero) - Number(a === hero))
    .flatMap((owner) =>
      owner.lueurs.map((lueur) => ({ owner, data: lueur.data, state: lueur.state })),
    );
  const consumed = summon ? pickLueursForSummon(summon, owned) : null;
  if (!summon || !consumed) {
    events.push({ type: 'action-failed', actor: hero.id, reason: 'summon' });
    return;
  }
  const choice = unleashCandidates(ctx, hero, summon.effect);
  const targets = command.target ? [command.target] : choice.targets;
  events.push({ type: 'action-start', actor: hero.id, command, name: summon.name, targets });
  events.push({
    type: 'summon',
    actor: hero.id,
    summonId: summon.id,
    name: summon.name,
    consumed: consumed.map((entry) => entry.data.id),
  });
  applyUnleash(ctx, hero, summon.effect, command.target, 'summon', events);
  // Après une invocation, les Lueurs consommées redeviennent Liées (règle du GDD).
  for (const entry of consumed) setLueurState(ctx, entry.owner, entry.data.id, 'liee', events);
}

function defend(hero: HeroCombatant, command: Command<'defend'>, events: BattleEvent[]): void {
  events.push({ type: 'action-start', actor: hero.id, command, name: 'Défense', targets: [hero.id] });
  hero.defending = true;
  events.push({ type: 'defend', actor: hero.id });
}

function attemptFlee(
  ctx: BattleContext,
  hero: HeroCombatant,
  command: Command<'flee'>,
  events: BattleEvent[],
): void {
  events.push({ type: 'action-start', actor: hero.id, command, name: 'Fuite', targets: [] });
  if (!canFleeNow(ctx)) {
    events.push({ type: 'flee-failed', actor: hero.id });
    return;
  }
  const chance = fleeChance(
    aliveHeroes(ctx).map((ally) => effectiveStats(ally).speed),
    aliveEnemies(ctx).map((enemy) => effectiveStats(enemy).speed),
  );
  if (rollChance(chance, ctx.rng)) {
    ctx.fled = true;
    events.push({ type: 'flee-success', actor: hero.id });
  } else {
    events.push({ type: 'flee-failed', actor: hero.id });
  }
}

export function executeHeroCommand(
  ctx: BattleContext,
  hero: HeroCombatant,
  command: BattleCommand,
  events: BattleEvent[],
): void {
  switch (command.kind) {
    case 'attack':
      heroAttack(ctx, hero, command, events);
      return;
    case 'spell':
      castSpell(ctx, hero, command, events);
      return;
    case 'lueur':
      unleashLueur(ctx, hero, command, events);
      return;
    case 'summon':
      invokeSummon(ctx, hero, command, events);
      return;
    case 'item':
      useItem(ctx, hero, command, events);
      return;
    case 'defend':
      defend(hero, command, events);
      return;
    case 'flee':
      attemptFlee(ctx, hero, command, events);
      return;
  }
}

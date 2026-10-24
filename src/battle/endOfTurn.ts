/**
 * Fin de tour : poison et durées des statuts, buffs, évasion et bouclier,
 * cycle des Lueurs (Libérée → Repos → Liée) et régénération de PR des accessoires.
 */
import { setLueurState } from './combatants';
import { dealDamage, restorePr } from './effects';
import { tickModifiers } from './modifiers';
import { tickStatuses } from './status';
import { allCombatants, isAlive } from './targeting';
import type { BattleContext, BattleEvent, Combatant, HeroCombatant } from './types';

function tickCombatant(ctx: BattleContext, combatant: Combatant, events: BattleEvent[]): void {
  const tick = tickStatuses(combatant.statuses, combatant.stats.hp);
  combatant.statuses = tick.statuses;
  if (tick.poisonDamage > 0) {
    const input = { amount: tick.poisonDamage, element: 'neutre' as const, kind: 'poison' as const };
    dealDamage(ctx, combatant, { ...input, crit: false }, events);
  }
  if (!isAlive(combatant)) return;
  for (const status of tick.expired) {
    events.push({ type: 'status-removed', target: combatant.id, status });
  }
  const modifiers = tickModifiers(combatant.modifiers);
  combatant.modifiers = modifiers.modifiers;
  for (const expired of modifiers.expired) {
    events.push({
      type: 'modifier-expired',
      target: combatant.id,
      stat: expired.stat,
      kind: expired.kind,
    });
  }
  if (combatant.evasionTurns > 0) combatant.evasionTurns -= 1;
  if (combatant.shield) {
    const turns = combatant.shield.turns - 1;
    combatant.shield = turns > 0 ? { ...combatant.shield, turns } : null;
  }
}

/** Libérée → Repos, Repos → Liée (une transition par Lueur et par tour). */
function cycleLueurs(ctx: BattleContext, hero: HeroCombatant, events: BattleEvent[]): void {
  const before = hero.lueurs.map((lueur) => lueur.state);
  hero.lueurs.forEach((lueur, index) => {
    if (before[index] === 'liberee') setLueurState(ctx, hero, lueur.data.id, 'repos', events);
    else if (before[index] === 'repos') setLueurState(ctx, hero, lueur.data.id, 'liee', events);
  });
}

function regeneratePr(hero: HeroCombatant, events: BattleEvent[]): void {
  if (hero.prRegen > 0 && hero.pr < hero.stats.pr) restorePr(hero, hero.prRegen, events);
}

export function runEndOfTurn(ctx: BattleContext, events: BattleEvent[]): void {
  for (const combatant of allCombatants(ctx)) {
    if (isAlive(combatant)) tickCombatant(ctx, combatant, events);
  }
  for (const hero of ctx.heroes) {
    if (!isAlive(hero)) continue;
    cycleLueurs(ctx, hero, events);
    regeneratePr(hero, events);
  }
}

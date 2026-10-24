/** Buffs et debuffs temporaires (en pourcentage) et stats effectives d'un combattant. */
import type { FullStats, StatKey } from '../data/types';
import { floorSafe } from './math';
import type { Combatant, Modifier } from './types';

/** Les PV et PR max ne sont pas modifiables en combat. */
export const MODIFIABLE_STATS: readonly StatKey[] = ['attack', 'defense', 'speed', 'luck'];

/** Un buff ou debuff sur la même stat remplace le précédent du même type. */
export function addModifier(modifiers: readonly Modifier[], modifier: Modifier): Modifier[] {
  const kept = modifiers.filter(
    (existing) => !(existing.stat === modifier.stat && existing.kind === modifier.kind),
  );
  return [...kept, modifier];
}

export function tickModifiers(modifiers: readonly Modifier[]): {
  modifiers: Modifier[];
  expired: Modifier[];
} {
  const kept: Modifier[] = [];
  const expired: Modifier[] = [];
  for (const modifier of modifiers) {
    const turns = modifier.turns - 1;
    if (turns <= 0) expired.push(modifier);
    else kept.push({ ...modifier, turns });
  }
  return { modifiers: kept, expired };
}

export function modifierPercent(modifiers: readonly Modifier[], stat: StatKey): number {
  return modifiers
    .filter((modifier) => modifier.stat === stat)
    .reduce((total, modifier) => total + modifier.amount, 0);
}

/** Stats avec buffs, debuffs et multiplicateur de phase (boss). */
export function effectiveStats(combatant: Combatant): FullStats {
  const result: FullStats = {
    ...combatant.stats,
    power: { ...combatant.stats.power },
    resistance: { ...combatant.stats.resistance },
  };
  for (const stat of MODIFIABLE_STATS) {
    const percent = modifierPercent(combatant.modifiers, stat);
    result[stat] = Math.max(0, floorSafe(combatant.stats[stat] * (1 + percent / 100)));
  }
  if (combatant.side === 'enemy' && combatant.attackMultiplier !== 1) {
    result.attack = floorSafe(result.attack * combatant.attackMultiplier);
  }
  return result;
}

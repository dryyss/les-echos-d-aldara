/** Ordre des tours : Vitesse × aléa(0,9 à 1,1), décroissant, tri stable ; first-strike en tête. */
import { randomFactor } from './formulas';
import type { Rng } from './types';

export interface SpeedEntry {
  speed: number;
  firstStrike?: boolean;
}

export function orderBySpeed<T extends SpeedEntry>(combatants: readonly T[], rng: Rng): T[] {
  const rolled = combatants.map((combatant, index) => ({
    combatant,
    index,
    roll: combatant.speed * randomFactor(rng),
  }));
  rolled.sort((a, b) => {
    const strikeA = a.combatant.firstStrike ? 1 : 0;
    const strikeB = b.combatant.firstStrike ? 1 : 0;
    if (strikeA !== strikeB) return strikeB - strikeA;
    if (a.roll !== b.roll) return b.roll - a.roll;
    return a.index - b.index;
  });
  return rolled.map((entry) => entry.combatant);
}

/** Courbe d'expérience : XP totale pour atteindre le niveau n = 20 × n², niveau max 50. */

export const MAX_LEVEL = 50;

export function xpForLevel(level: number): number {
  return 20 * level * level;
}

/** Niveau atteint avec une XP totale donnée (1 au minimum, 50 au maximum). */
export function levelFromXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level += 1;
  return level;
}

/** XP manquante pour le niveau suivant, 0 au niveau maximum. */
export function xpToNextLevel(state: { level: number; xp: number }): number {
  if (state.level >= MAX_LEVEL) return 0;
  return Math.max(0, xpForLevel(state.level + 1) - state.xp);
}

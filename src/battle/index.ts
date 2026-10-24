/** Point d'entrée du moteur de combat et de progression (TypeScript pur, sans Phaser). */
export * from './types';
export { MAX_LEVEL, levelFromXp, xpForLevel, xpToNextLevel } from './xp';
export {
  PRISME_ID,
  RANK_THRESHOLDS,
  classRank,
  computeClass,
  countLinkedByElement,
  isPrisme,
} from './classes';
export type { ClassArchetype, HeroClass } from './classes';
export {
  LUEUR_ELEMENT_BONUS,
  baseStatsAtLevel,
  computeHeroStats,
  equippedItems,
  gainXp,
} from './stats';
export type { StatsContext, XpGain } from './stats';
export {
  CRIT_MULTIPLIER,
  POISON_RATIO,
  RANDOM_MAX,
  RANDOM_MIN,
  applyCrit,
  critChance,
  defendedDamage,
  elementalMultiplier,
  fleeChance,
  healAmount,
  physicalDamage,
  poisonDamage,
  randomFactor,
  rollCrit,
  spellDamage,
} from './formulas';
export { orderBySpeed } from './turnOrder';
export type { SpeedEntry } from './turnOrder';
export {
  KO_STATUSES,
  applyStatus,
  canAct,
  hasStatus,
  isConfused,
  isKo,
  isSilenced,
  removeStatus,
  statusDuration,
  tickStatuses,
  wakeIfHit,
} from './status';
export type { StatusApplication, StatusTick } from './status';
export { MODIFIABLE_STATS, addModifier, effectiveStats, modifierPercent, tickModifiers } from './modifiers';
export { BASIC_ATTACK, chooseEnemyAction, isOffensiveSkill, usableSkills } from './ai';
export type { EnemyAiActor } from './ai';
export { availableSummons, canAffordSummon, perElementCost, pickLueursForSummon } from './summons';
export type { OwnedLueur } from './summons';
export { BattleEngine } from './engine';
export { pickIndex, pickMany, pickOne, rangeInt, rollChance, weightedPick } from './random';
export { clamp, floorSafe } from './math';

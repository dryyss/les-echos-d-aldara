/** Formules de combat (docs/technique/equilibrage.md, section Formules). */
import { average, clamp, floorSafe } from './math';
import type { Rng } from './types';

export const RANDOM_MIN = 0.9;
export const RANDOM_MAX = 1.1;
export const CRIT_MULTIPLIER = 1.5;
export const POISON_RATIO = 0.1;

/** Aléa de 0,9 à 1,1. */
export function randomFactor(rng: Rng): number {
  return RANDOM_MIN + rng() * (RANDOM_MAX - RANDOM_MIN);
}

/** 1 + (Puissance du lanceur − Résistance de la cible) ÷ 200. */
export function elementalMultiplier(casterPower: number, targetResistance: number): number {
  return 1 + (casterPower - targetResistance) / 200;
}

/** (Attaque − Défense) ÷ 2 × aléa, minimum 1. */
export function physicalDamage(attack: number, defense: number, rng: Rng): number {
  return Math.max(1, floorSafe(((attack - defense) / 2) * randomFactor(rng)));
}

/** Puissance × (1 + (Puissance élémentaire − Résistance élémentaire) ÷ 200), minimum 1. */
export function spellDamage(power: number, casterPower: number, targetResistance: number): number {
  return Math.max(1, floorSafe(power * elementalMultiplier(casterPower, targetResistance)));
}

/** Puissance × (1 + Puissance d'Eau du lanceur ÷ 200). */
export function healAmount(power: number, casterWaterPower: number): number {
  return Math.max(0, floorSafe(power * (1 + casterWaterPower / 200)));
}

/** 5 % + Chance ÷ 4 (en %), renvoyé entre 0 et 1. */
export function critChance(luck: number): number {
  return clamp((5 + luck / 4) / 100, 0, 1);
}

export function rollCrit(luck: number, rng: Rng): boolean {
  return rng() < critChance(luck);
}

export function applyCrit(damage: number): number {
  return Math.max(1, floorSafe(damage * CRIT_MULTIPLIER));
}

/** 50 % + (Vitesse moyenne des héros − Vitesse moyenne des ennemis) × 2 %, bornée 10 % à 90 %. */
export function fleeChance(heroSpeeds: readonly number[], enemySpeeds: readonly number[]): number {
  return clamp(0.5 + (average(heroSpeeds) - average(enemySpeeds)) * 0.02, 0.1, 0.9);
}

/** Dégâts reçus en Défense : ÷ 2, minimum 1. */
export function defendedDamage(amount: number): number {
  return Math.max(1, Math.floor(amount / 2));
}

/** Poison : 10 % des PV max, arrondi inférieur, minimum 1. */
export function poisonDamage(maxHp: number): number {
  return Math.max(1, Math.floor(maxHp * POISON_RATIO));
}

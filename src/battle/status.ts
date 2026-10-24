/**
 * Statuts : durées, application, tick de fin de tour, réveil, immunités.
 * Un statut posé pendant un tour porte `fresh` : le tick de ce même tour ne le décrémente pas,
 * si bien qu'un étourdissement de 1 tour fait bien perdre le tour suivant.
 */
import type { StatusId } from '../data/types';
import { poisonDamage } from './formulas';
import { rangeInt } from './random';
import type { Rng, StatusInstance } from './types';

export const KO_STATUSES: readonly StatusInstance[] = [{ id: 'ko', turns: null }];

/** Durée en tours, null pour une durée illimitée. */
export function statusDuration(id: StatusId, rng: Rng): number | null {
  switch (id) {
    case 'poison':
    case 'ko':
      return null;
    case 'sommeil':
      return rangeInt(1, 3, rng);
    case 'etourdi':
      return 1;
    case 'silence':
      return 3;
    case 'confusion':
      return rangeInt(2, 4, rng);
  }
}

export function hasStatus(statuses: readonly StatusInstance[], id: StatusId): boolean {
  return statuses.some((status) => status.id === id);
}

export interface StatusApplication {
  statuses: StatusInstance[];
  applied: boolean;
  reason?: 'immunise' | 'deja' | 'ko';
}

export function applyStatus(
  statuses: readonly StatusInstance[],
  id: StatusId,
  rng: Rng,
  immunities: readonly StatusId[] = [],
): StatusApplication {
  if (hasStatus(statuses, 'ko')) return { statuses: [...statuses], applied: false, reason: 'ko' };
  if (immunities.includes(id)) {
    return { statuses: [...statuses], applied: false, reason: 'immunise' };
  }
  if (hasStatus(statuses, id)) return { statuses: [...statuses], applied: false, reason: 'deja' };
  const instance: StatusInstance = { id, turns: statusDuration(id, rng), fresh: true };
  return { statuses: [...statuses, instance], applied: true };
}

export function removeStatus(statuses: readonly StatusInstance[], id: StatusId): StatusInstance[] {
  return statuses.filter((status) => status.id !== id);
}

export interface StatusTick {
  statuses: StatusInstance[];
  poisonDamage: number;
  expired: StatusId[];
}

/** Fin de tour : dégâts de poison et décompte des durées. */
export function tickStatuses(statuses: readonly StatusInstance[], maxHp: number): StatusTick {
  const next: StatusInstance[] = [];
  const expired: StatusId[] = [];
  let damage = 0;
  for (const status of statuses) {
    if (status.id === 'poison') damage = poisonDamage(maxHp);
    if (status.fresh) {
      next.push({ id: status.id, turns: status.turns });
      continue;
    }
    if (status.turns === null) {
      next.push(status);
      continue;
    }
    const remaining = status.turns - 1;
    if (remaining <= 0) expired.push(status.id);
    else next.push({ id: status.id, turns: remaining });
  }
  return { statuses: next, poisonDamage: damage, expired };
}

/** Un combattant touché se réveille. */
export function wakeIfHit(statuses: readonly StatusInstance[]): {
  statuses: StatusInstance[];
  woke: boolean;
} {
  if (!hasStatus(statuses, 'sommeil')) return { statuses: [...statuses], woke: false };
  return { statuses: removeStatus(statuses, 'sommeil'), woke: true };
}

export function isKo(statuses: readonly StatusInstance[]): boolean {
  return hasStatus(statuses, 'ko');
}

export function isSilenced(statuses: readonly StatusInstance[]): boolean {
  return hasStatus(statuses, 'silence');
}

export function isConfused(statuses: readonly StatusInstance[]): boolean {
  return hasStatus(statuses, 'confusion');
}

/** Peut agir : ni K.O., ni endormi, ni étourdi. */
export function canAct(statuses: readonly StatusInstance[]): boolean {
  return !isKo(statuses) && !hasStatus(statuses, 'sommeil') && !hasStatus(statuses, 'etourdi');
}

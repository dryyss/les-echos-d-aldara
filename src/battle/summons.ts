/** Invocations : disponibilité selon les Lueurs en Repos de toute l'équipe. */
import { ELEMENTS } from '../data/types';
import type { Element, LueurData, LueurState, SummonData } from '../data/types';

export interface OwnedLueur {
  data: LueurData;
  state: LueurState;
}

function reposOf<T extends OwnedLueur>(lueurs: readonly T[], element: Element): T[] {
  return lueurs.filter((lueur) => lueur.state === 'repos' && lueur.data.element === element);
}

/** Gardien d'Aldara (« tous ») : une Lueur en Repos de chaque élément par tranche de 4. */
export function perElementCost(summon: SummonData): number {
  return Math.max(1, Math.ceil(summon.cost / ELEMENTS.length));
}

/** Lueurs qui seraient consommées, dans l'ordre fourni, ou null si l'invocation est impossible. */
export function pickLueursForSummon<T extends OwnedLueur>(
  summon: SummonData,
  lueurs: readonly T[],
): T[] | null {
  if (summon.element === 'tous') {
    const need = perElementCost(summon);
    const picked: T[] = [];
    for (const element of ELEMENTS) {
      const available = reposOf(lueurs, element);
      if (available.length < need) return null;
      picked.push(...available.slice(0, need));
    }
    return picked;
  }
  const available = reposOf(lueurs, summon.element);
  return available.length >= summon.cost ? available.slice(0, summon.cost) : null;
}

export function canAffordSummon(summon: SummonData, lueurs: readonly OwnedLueur[]): boolean {
  return pickLueursForSummon(summon, lueurs) !== null;
}

export function availableSummons(
  summons: readonly SummonData[],
  teamLueurs: readonly OwnedLueur[],
): SummonData[] {
  return summons.filter((summon) => canAffordSummon(summon, teamLueurs));
}

/**
 * Évaluation des conditions d'événements (`EventCondition` de types.ts)
 * sur l'état du jeu. Fonction pure, sans Phaser.
 */
import type { EventCondition } from '../data/types';
import type { GameState } from './GameState';

/**
 * Clé d'état de carte : `cle` vise la carte courante, `carte:cle` une carte précise.
 */
function splitMapStateKey(raw: string, currentMap: string): { map: string; key: string } {
  const index = raw.indexOf(':');
  if (index === -1) return { map: currentMap, key: raw };
  return { map: raw.slice(0, index), key: raw.slice(index + 1) };
}

export function evaluateCondition(state: GameState, condition: EventCondition): boolean {
  if ('not' in condition) return !evaluateCondition(state, condition.not);
  if ('all' in condition) return condition.all.every((c) => evaluateCondition(state, c));
  if ('any' in condition) return condition.any.some((c) => evaluateCondition(state, c));
  if ('flag' in condition) return state.hasFlag(condition.flag) === (condition.is ?? true);
  if ('item' in condition) return state.countItem(condition.item) >= (condition.min ?? 1);
  if ('hero' in condition) return state.isInParty(condition.hero);
  if ('resonance' in condition) return state.hasResonance(condition.resonance);
  if ('quest' in condition) {
    const progress = state.getQuestProgress(condition.quest);
    return (progress?.status ?? 'none') === condition.status;
  }
  if ('questTask' in condition) {
    const progress = state.getQuestProgress(condition.questTask);
    return progress?.status === 'active' && progress.task === condition.task;
  }
  if ('lueur' in condition) return state.isLueurFound(condition.lueur);
  if ('coins' in condition) return state.coins >= condition.coins;
  if ('mapState' in condition) {
    const { map, key } = splitMapStateKey(condition.mapState, state.position.map);
    return state.getMapState(map, key) === condition.is;
  }
  return false;
}

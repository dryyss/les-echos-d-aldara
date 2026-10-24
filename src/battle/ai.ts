/** IA des ennemis : choix d'une compétence et de ses cibles à partir d'un instantané. */
import type { EnemyAi, EnemyData, EnemySkill } from '../data/types';
import { pickOne, weightedPick } from './random';
import type { BattleSnapshot, CombatantSnapshot, EnemySkillCommand, Rng } from './types';

export interface EnemyAiActor {
  id: string;
  data: EnemyData;
  phase: number;
}

/** Attaque de base quand l'ennemi n'a aucune compétence utilisable. */
export const BASIC_ATTACK: EnemySkill = {
  name: 'Attaque',
  kind: 'attack',
  element: 'neutre',
  power: 0,
  targets: 'enemy',
  weight: 1,
  animation: 'attack',
};

const OFFENSIVE_KINDS: ReadonlySet<EnemySkill['kind']> = new Set(['attack', 'spell', 'status', 'debuff']);

export function isOffensiveSkill(skill: EnemySkill): boolean {
  return OFFENSIVE_KINDS.has(skill.kind);
}

/** Compétences utilisables dans la phase courante (toutes si `phases` est absent). */
export function usableSkills(enemy: EnemyAiActor): EnemySkill[] {
  return enemy.data.skills.filter((skill) => !skill.phases || skill.phases.includes(enemy.phase));
}

function lowestBy(
  list: readonly CombatantSnapshot[],
  value: (c: CombatantSnapshot) => number,
): CombatantSnapshot | undefined {
  let best: CombatantSnapshot | undefined;
  for (const combatant of list) {
    if (!best || value(combatant) < value(best)) best = combatant;
  }
  return best;
}

const lowestHp = (list: readonly CombatantSnapshot[]) => lowestBy(list, (c) => c.hp);
const lowestRatio = (list: readonly CombatantSnapshot[]) => lowestBy(list, (c) => c.hp / c.maxHp);
const wounded = (list: readonly CombatantSnapshot[]) => list.filter((c) => c.hp / c.maxHp < 0.5);

interface AiContext {
  self: CombatantSnapshot | undefined;
  heroes: CombatantSnapshot[];
  allies: CombatantSnapshot[];
  turn: number;
  rng: Rng;
}

interface AiChoice {
  skill: EnemySkill;
  /** Héros visé pour une compétence à cible unique. */
  preferred: CombatantSnapshot | undefined;
}

function weightedOffensive(skills: readonly EnemySkill[], rng: Rng): EnemySkill {
  return weightedPick(skills.filter(isOffensiveSkill), (skill) => skill.weight, rng) ?? BASIC_ATTACK;
}

function chooseByAi(ai: EnemyAi, skills: readonly EnemySkill[], ctx: AiContext): AiChoice {
  switch (ai) {
    case 'aggressive':
      return { skill: weightedOffensive(skills, ctx.rng), preferred: lowestHp(ctx.heroes) };
    case 'random':
      return {
        skill: pickOne(skills, ctx.rng) ?? BASIC_ATTACK,
        preferred: pickOne(ctx.heroes, ctx.rng),
      };
    case 'support': {
      const heal = skills.find((skill) => skill.kind === 'heal');
      const hurt = lowestRatio(wounded(ctx.allies));
      if (heal && hurt) return { skill: heal, preferred: hurt };
      return { skill: weightedOffensive(skills, ctx.rng), preferred: pickOne(ctx.heroes, ctx.rng) };
    }
    case 'defensive': {
      const buff = skills.find((skill) => skill.kind === 'buff');
      if (buff && ctx.turn === 1) return { skill: buff, preferred: undefined };
      return { skill: weightedOffensive(skills, ctx.rng), preferred: pickOne(ctx.heroes, ctx.rng) };
    }
    case 'boss': {
      const skill = weightedPick(skills, (s) => s.weight, ctx.rng) ?? BASIC_ATTACK;
      const preferred = isOffensiveSkill(skill) ? pickOne(ctx.heroes, ctx.rng) : undefined;
      return { skill, preferred };
    }
  }
}

function resolveAiTargets(skill: EnemySkill, ctx: AiContext, choice: AiChoice): string[] {
  const self = ctx.self ? [ctx.self.id] : [];
  const preferred = choice.preferred ? [choice.preferred.id] : [];
  switch (skill.targets) {
    case 'enemy':
      return preferred;
    case 'enemies':
      return ctx.heroes.map((hero) => hero.id);
    case 'self':
      return self;
    case 'ally': {
      if (skill.kind !== 'heal') return self;
      const target = choice.preferred ?? lowestRatio(ctx.allies);
      return target ? [target.id] : self;
    }
    case 'allies':
      return ctx.allies.map((ally) => ally.id);
    case 'any':
      return isOffensiveSkill(skill) ? preferred : self;
  }
}

/** Choisit l'action d'un ennemi. Les cibles K.O. ou enfuies ne sont jamais retenues. */
export function chooseEnemyAction(
  enemy: EnemyAiActor,
  snapshot: BattleSnapshot,
  rng: Rng,
): EnemySkillCommand {
  const ctx: AiContext = {
    self: snapshot.enemies.find((candidate) => candidate.id === enemy.id),
    heroes: snapshot.heroes.filter((hero) => hero.alive),
    allies: snapshot.enemies.filter((ally) => ally.alive),
    turn: snapshot.turn,
    rng,
  };
  const choice = chooseByAi(enemy.data.ai, usableSkills(enemy), ctx);
  return { kind: 'skill', skill: choice.skill, targets: resolveAiTargets(choice.skill, ctx, choice) };
}

/**
 * Contrat du moteur de combat : entrées (BattleSetup), état interne (combattants),
 * commandes, événements rendus à l'interface et instantanés.
 * Aucune dépendance à Phaser : tout est pilotable depuis les tests.
 */
import type {
  Element,
  ElementOrNeutral,
  EnemyData,
  EnemySkill,
  FullStats,
  HeroData,
  HeroId,
  HeroState,
  ItemData,
  LueurData,
  LueurState,
  ScriptedBattle,
  SpellData,
  StatKey,
  Stats,
  StatusId,
  SummonData,
} from '../data/types';

/** Générateur aléatoire injecté : renvoie une valeur dans [0, 1). */
export type Rng = () => number;

export type Side = 'hero' | 'enemy';

// ---------------------------------------------------------------------------
// Entrées du moteur
// ---------------------------------------------------------------------------

export interface HeroLueur {
  data: LueurData;
  state: LueurState;
}

export interface HeroSetup {
  data: HeroData;
  state: HeroState;
  /** Stats complètes au début du combat (résultat de computeHeroStats). */
  stats: FullStats;
  /** Sorts connus au niveau courant. */
  spells: SpellData[];
  lueurs: HeroLueur[];
}

export interface BattleSetup {
  heroes: HeroSetup[];
  enemies: EnemyData[];
  inventory: Record<string, number>;
  items: Record<string, ItemData>;
  summons: SummonData[];
  scripted?: ScriptedBattle;
  canFlee: boolean;
}

// ---------------------------------------------------------------------------
// État interne des combattants
// ---------------------------------------------------------------------------

export interface StatusInstance {
  id: StatusId;
  /** Tours restants, null pour une durée illimitée (poison, K.O.). */
  turns: number | null;
  /** Posé pendant le tour courant : le premier tick de fin de tour ne le décrémente pas. */
  fresh?: boolean;
}

export interface Modifier {
  kind: 'buff' | 'debuff';
  stat: StatKey;
  /** Pourcentage signé : +25 pour un buff de 25 %, −25 pour un debuff de 25 %. */
  amount: number;
  turns: number;
}

export interface Shield {
  turns: number;
  /** Réduction des dégâts en pourcentage. */
  amount: number;
}

interface CombatantBase {
  /** Identifiant unique de l'instance (ex. « kael », « sbire-ordre#2 »). */
  id: string;
  name: string;
  side: Side;
  /** Stats de référence (maximums), hors buffs temporaires. */
  stats: FullStats;
  hp: number;
  pr: number;
  statuses: StatusInstance[];
  modifiers: Modifier[];
  defending: boolean;
  evasionTurns: number;
  shield: Shield | null;
  element: ElementOrNeutral;
  fled: boolean;
}

export interface HeroCombatant extends CombatantBase {
  side: 'hero';
  data: HeroData;
  state: HeroState;
  spells: SpellData[];
  lueurs: HeroLueur[];
  immunities: StatusId[];
  prRegen: number;
  weapon: ItemData | null;
}

export interface EnemyCombatant extends CombatantBase {
  side: 'enemy';
  data: EnemyData;
  /** 0 avant le premier changement de phase. */
  phase: number;
  attackMultiplier: number;
}

export type Combatant = HeroCombatant | EnemyCombatant;

export interface BattleContext {
  heroes: HeroCombatant[];
  enemies: EnemyCombatant[];
  inventory: Record<string, number>;
  items: Record<string, ItemData>;
  summons: SummonData[];
  scripted: ScriptedBattle | undefined;
  canFlee: boolean;
  rng: Rng;
  /** Numéro du tour courant, à partir de 1. */
  turn: number;
  fled: boolean;
}

// ---------------------------------------------------------------------------
// Commandes
// ---------------------------------------------------------------------------

export type BattleCommand =
  | { kind: 'attack'; target: string }
  | { kind: 'spell'; spellId: string; target?: string }
  | { kind: 'lueur'; lueurId: string; target?: string }
  | { kind: 'summon'; summonId: string; target?: string }
  | { kind: 'item'; itemId: string; target?: string }
  | { kind: 'defend' }
  | { kind: 'flee' };

export interface EnemySkillCommand {
  kind: 'skill';
  skill: EnemySkill;
  targets: string[];
}

export type ActionCommand = BattleCommand | EnemySkillCommand;

export interface TargetChoice {
  /** Cibles valides. Si needsTarget est faux, ce sont les cibles affectées d'office. */
  targets: string[];
  needsTarget: boolean;
}

export type AvailableCommand =
  | ({ kind: 'attack' } & TargetChoice)
  | ({ kind: 'spell'; spellId: string; name: string; cost: number } & TargetChoice)
  | ({ kind: 'lueur'; lueurId: string; name: string } & TargetChoice)
  | ({ kind: 'summon'; summonId: string; name: string } & TargetChoice)
  | ({ kind: 'item'; itemId: string; name: string; quantity: number } & TargetChoice)
  | { kind: 'defend' }
  | { kind: 'flee' };

// ---------------------------------------------------------------------------
// Événements rendus à l'interface
// ---------------------------------------------------------------------------

export type DamageKind = 'physical' | 'spell' | 'lueur' | 'summon' | 'poison';

export type MissReason = 'protege' | 'esquive' | 'resiste' | 'immunise';

export type ActionFailure = 'silence' | 'pr' | 'lueur' | 'summon' | 'item' | 'no-target';

export interface Drop {
  item: string;
  quantity: number;
}

export interface LevelUp {
  hero: HeroId;
  from: number;
  to: number;
  /** Stats de base au nouveau niveau. */
  stats: Stats;
}

export interface BattleRewards {
  xp: number;
  coins: number;
  drops: Drop[];
  lueur?: string;
  levelUps: LevelUp[];
}

export type BattleEvent =
  | { type: 'turn-start'; turn: number }
  | { type: 'action-start'; actor: string; command: ActionCommand; name: string; targets: string[] }
  | { type: 'action-failed'; actor: string; reason: ActionFailure }
  | {
      type: 'damage';
      target: string;
      amount: number;
      crit: boolean;
      element: ElementOrNeutral;
      kind: DamageKind;
    }
  | { type: 'heal'; target: string; amount: number; resource: 'hp' | 'pr' }
  | { type: 'miss'; target: string; reason: MissReason }
  | { type: 'status-applied'; target: string; status: StatusId; turns: number | null }
  | { type: 'status-removed'; target: string; status: StatusId }
  | { type: 'buff'; target: string; stat: StatKey; amount: number; turns: number }
  | { type: 'debuff'; target: string; stat: StatKey; amount: number; turns: number }
  | { type: 'modifier-expired'; target: string; stat: StatKey; kind: 'buff' | 'debuff' }
  | { type: 'evasion'; target: string; turns: number }
  | { type: 'shield'; target: string; turns: number; amount: number }
  | { type: 'ko'; target: string }
  | { type: 'revive'; target: string; hp: number }
  | { type: 'lueur-unleashed'; actor: string; lueurId: string; name: string }
  | { type: 'lueur-state'; hero: string; lueurId: string; state: LueurState }
  | { type: 'summon'; actor: string; summonId: string; name: string; consumed: string[] }
  | { type: 'item-used'; actor: string; itemId: string; name: string }
  | { type: 'defend'; actor: string }
  | { type: 'flee-failed'; actor: string }
  | { type: 'flee-success'; actor: string }
  | { type: 'phase-change'; enemy: string; phase: number; line?: string }
  | { type: 'line'; actor: string; text: string }
  | { type: 'turn-end'; turn: number }
  | ({ type: 'victory' } & BattleRewards)
  | { type: 'defeat'; continues: boolean }
  | { type: 'scripted-end'; reason: 'loseAfterTurns' };

// ---------------------------------------------------------------------------
// Instantanés
// ---------------------------------------------------------------------------

export interface CombatantSnapshot {
  id: string;
  name: string;
  side: Side;
  hp: number;
  maxHp: number;
  pr: number;
  maxPr: number;
  alive: boolean;
  fled: boolean;
  canAct: boolean;
  element: ElementOrNeutral;
  /** Stats effectives (buffs, debuffs et phase compris). */
  stats: FullStats;
  statuses: { id: StatusId; turns: number | null }[];
  modifiers: Modifier[];
  defending: boolean;
  evasionTurns: number;
  shield: Shield | null;
}

export interface HeroSnapshot extends CombatantSnapshot {
  side: 'hero';
  heroIndex: number;
  heroId: HeroId;
  level: number;
  lueurs: { id: string; name: string; element: Element | 'prisme'; state: LueurState }[];
}

export interface EnemySnapshot extends CombatantSnapshot {
  side: 'enemy';
  enemyId: string;
  phase: number;
  boss: boolean;
  noFlee: boolean;
}

export interface BattleSnapshot {
  turn: number;
  heroes: HeroSnapshot[];
  enemies: EnemySnapshot[];
  canFlee: boolean;
}

// ---------------------------------------------------------------------------
// Issue du combat
// ---------------------------------------------------------------------------

export type BattleOutcome = 'victory' | 'defeat' | 'fled' | 'scripted';

export interface BattleStatus {
  over: boolean;
  outcome?: BattleOutcome;
  /** Défaite scénarisée : la scène continue au lieu du Game Over. */
  continues?: boolean;
}

export interface HeroResult {
  id: HeroId;
  /** État à persister dans GameState (PV, PR, XP, niveau). */
  state: HeroState;
  lueurs: { id: string; state: LueurState }[];
}

export interface BattleResult {
  outcome: BattleOutcome | null;
  heroes: HeroResult[];
  inventory: Record<string, number>;
  rewards: BattleRewards | null;
}

/**
 * Types de toutes les données JSON du jeu (dossier data/).
 * Ce fichier est le contrat entre le contenu et le code : toute donnée chargée
 * doit respecter ces types, vérifiés par les tests de validation.
 *
 * Conventions :
 * - Les identifiants sont en kebab-case, sans accent (ex. "cerf-de-mousse").
 * - Les clés sont en anglais, sauf dans les missions et les dialogues où l'on
 *   suit le format des documents de référence (titre, taches, perso, texte...).
 * - Les textes affichés sont en français avec l'apostrophe ’ et les guillemets « ».
 */

// ---------------------------------------------------------------------------
// Éléments et statistiques
// ---------------------------------------------------------------------------

export type Element = 'terre' | 'feu' | 'eau' | 'vent';
export type ElementOrNeutral = Element | 'neutre';
export const ELEMENTS: readonly Element[] = ['terre', 'feu', 'eau', 'vent'];

/** Une valeur par élément (Puissance ou Résistance élémentaire). */
export type ElementalValues = Record<Element, number>;

/** Statistiques de base d'un combattant. */
export interface Stats {
  hp: number;
  pr: number;
  attack: number;
  defense: number;
  speed: number;
  luck: number;
}

export type StatKey = keyof Stats;
export const STAT_KEYS: readonly StatKey[] = ['hp', 'pr', 'attack', 'defense', 'speed', 'luck'];

/** Statistiques complètes : stats de base + affinités élémentaires. */
export interface FullStats extends Stats {
  power: ElementalValues;
  resistance: ElementalValues;
}

export type Act = 1 | 2 | 3 | 4;

// ---------------------------------------------------------------------------
// Héros (data/heroes.json)
// ---------------------------------------------------------------------------

export type HeroId = 'kael' | 'nyra' | 'oren' | 'sefa';
export const HERO_IDS: readonly HeroId[] = ['kael', 'nyra', 'oren', 'sefa'];

export type WeaponType = 'epee' | 'hache' | 'marteau' | 'arc' | 'dague' | 'baton' | 'fleau';

export type EquipSlot = 'weapon' | 'armor' | 'shield' | 'helmet' | 'accessory';
export const EQUIP_SLOTS: readonly EquipSlot[] = [
  'weapon',
  'armor',
  'shield',
  'helmet',
  'accessory',
];

/** Expressions disponibles pour les portraits. */
export type Expression = 'neutre' | 'sourire' | 'colere' | 'triste' | 'surpris' | 'fatigue';

/** Paramètres du « bip » de voix d'un personnage dans les dialogues. */
export interface VoiceData {
  /** Fréquence de base en Hz. */
  pitch: number;
  wave: 'square' | 'triangle' | 'sawtooth' | 'sine';
  /** Durée d'un bip en ms. */
  length: number;
}

/** Noms de classes d'un héros selon la répartition de ses Lueurs Liées. */
export interface ClassNames {
  /** Sans Lueur Liée. */
  base: string;
  /** Uniquement des Lueurs de l'élément natif : [rangs 1 et 2, rangs 3 à 5]. */
  pure: [string, string];
  /** Élément natif + un autre élément dominant (clé = l'autre élément). */
  hybrid: Record<Element, string>;
  /** Les 4 éléments avec la Lueur Prisme. */
  accordeur: string;
}

export interface HeroSpellUnlock {
  spell: string;
  level: number;
}

export interface HeroData {
  id: HeroId;
  name: string;
  element: Element;
  age: number;
  description: string;
  /** Statistiques au niveau 1. */
  baseStats: Stats;
  /** Gain par niveau (valeurs décimales acceptées, arrondies au calcul). */
  growth: Stats;
  basePower: ElementalValues;
  baseResistance: ElementalValues;
  weaponTypes: WeaponType[];
  spells: HeroSpellUnlock[];
  classes: ClassNames;
  startingLueur: string | null;
  startingEquipment: Partial<Record<EquipSlot, string>>;
  sprite: string;
  battleSprite: string;
  portrait: string;
  voice: VoiceData;
}

// ---------------------------------------------------------------------------
// Sorts de combat (data/spells.json)
// ---------------------------------------------------------------------------

export type TargetScope = 'self' | 'ally' | 'allies' | 'enemy' | 'enemies' | 'any';

export type StatusId = 'poison' | 'sommeil' | 'etourdi' | 'silence' | 'confusion' | 'ko';
export const STATUS_IDS: readonly StatusId[] = [
  'poison',
  'sommeil',
  'etourdi',
  'silence',
  'confusion',
  'ko',
];

export type SpellKind = 'damage' | 'heal' | 'buff' | 'debuff' | 'status' | 'cure' | 'revive';

export interface SpellData {
  id: string;
  name: string;
  description: string;
  element: ElementOrNeutral;
  cost: number;
  kind: SpellKind;
  /** Puissance du sort (dégâts ou soin), 0 pour les sorts d'état purs. */
  power: number;
  targets: TargetScope;
  /** Statut appliqué (kind status) ou retiré (kind cure). */
  status?: StatusId | StatusId[];
  /** Chance d'appliquer le statut, de 0 à 1. */
  statusChance?: number;
  /** Stat modifiée pour buff et debuff, en pourcentage (ex. 25 = +25 %). */
  stat?: StatKey;
  amount?: number;
  turns?: number;
  /** Identifiant d'animation de combat. */
  animation: string;
  /** Accord à deux héros (Acte 4) : les deux éléments requis. */
  accord?: [Element, Element];
}

// ---------------------------------------------------------------------------
// Lueurs (data/lueurs.json)
// ---------------------------------------------------------------------------

export type LueurState = 'liee' | 'liberee' | 'repos';

export interface LueurBonus extends Partial<Stats> {
  power?: Partial<ElementalValues>;
  resistance?: Partial<ElementalValues>;
}

export type UnleashEffect =
  | { type: 'damage'; power: number; targets: number | 'all'; element: Element }
  | { type: 'heal'; power: number; targets: 'ally' | 'all'; cures?: StatusId[] }
  | { type: 'buff'; stat: StatKey; amount: number; targets: 'ally' | 'all'; turns: number }
  | { type: 'debuff'; stat: StatKey; amount: number; targets: 'enemy' | 'all'; turns: number }
  | { type: 'status'; status: StatusId; targets: 'enemy' | 'all'; chance: number }
  | { type: 'evasion'; turns: number }
  | { type: 'first-strike'; power: number; element: Element }
  | { type: 'revive'; power: number }
  | { type: 'shield'; turns: number; amount: number };

export interface LueurData {
  id: string;
  name: string;
  /** Élément, ou « prisme » pour la Lueur secrète des 4 éléments. */
  element: Element | 'prisme';
  description: string;
  /** Cri de la Lueur, affiché quand on la trouve (ex. « Grrr-ès ! »). */
  cry: string;
  bonus: LueurBonus;
  unleash: UnleashEffect;
  /** Identifiant de lieu ou de mission où on la trouve. */
  location: string;
  /** Indice affiché dans l'écran Lueurs tant qu'elle n'est pas trouvée. */
  hint: string;
  /** Acte où elle devient accessible. */
  act: Act;
  sprite: string;
  secret?: boolean;
}

// ---------------------------------------------------------------------------
// Invocations (data/summons.json)
// ---------------------------------------------------------------------------

export interface SummonData {
  id: string;
  name: string;
  /** Élément requis, ou "tous" pour le Gardien d'Aldara. */
  element: Element | 'tous';
  /** Nombre de Lueurs en Repos nécessaires (1 à 3, ou 4 pour le Gardien). */
  cost: number;
  effect: UnleashEffect;
  description: string;
  sprite: string;
  animation: string;
}

// ---------------------------------------------------------------------------
// Ennemis (data/enemies.json)
// ---------------------------------------------------------------------------

export type EnemyAi = 'aggressive' | 'random' | 'support' | 'defensive' | 'boss';

export type EnemySize = 'small' | 'medium' | 'large' | 'boss';

export interface EnemySkill {
  /** Nom affiché (« Coup de gantelet »). */
  name: string;
  kind: 'attack' | 'spell' | 'heal' | 'buff' | 'debuff' | 'status' | 'flee';
  element: ElementOrNeutral;
  power: number;
  targets: TargetScope;
  status?: StatusId;
  statusChance?: number;
  stat?: StatKey;
  amount?: number;
  turns?: number;
  /** Poids relatif dans le choix de l'IA. */
  weight: number;
  animation: string;
  /** Dans quelles phases le boss peut l'utiliser (toutes si absent). Phase 0 = début. */
  phases?: number[];
}

export interface EnemyPhase {
  /** Déclenchée quand les PV passent sous ce pourcentage (0 à 1). */
  hpBelow: number;
  /** Réplique prononcée au changement de phase. */
  line?: string;
  /** Élément forcé pendant la phase (Varn change d'élément). */
  element?: Element;
  /** Multiplicateur d'attaque pendant la phase. */
  attackMultiplier?: number;
}

export interface DropData {
  item: string;
  chance: number;
}

export interface EnemyData {
  id: string;
  name: string;
  description: string;
  element: ElementOrNeutral;
  level: number;
  stats: Stats;
  power: ElementalValues;
  resistance: ElementalValues;
  xp: number;
  coins: number;
  drops: DropData[];
  skills: EnemySkill[];
  ai: EnemyAi;
  boss: boolean;
  size: EnemySize;
  sprite: string;
  /** Lueur offerte après la victoire (boss). */
  lueurReward?: string;
  phases?: EnemyPhase[];
  /** Impossible de fuir ce combat. */
  noFlee?: boolean;
  act: Act;
}

/** Groupe d'ennemis rencontré en combat (data/encounters.json). */
export interface EncounterGroup {
  id: string;
  enemies: string[];
  /** Musique spécifique (boss). */
  music?: string;
  /** Fond de combat (identifiant d'image générée). */
  background: string;
}

// ---------------------------------------------------------------------------
// Objets (data/items.json)
// ---------------------------------------------------------------------------

export type ItemKind =
  'consumable' | 'weapon' | 'armor' | 'shield' | 'helmet' | 'accessory' | 'material' | 'key';

export type ConsumableEffect =
  | { type: 'heal'; amount: number; targets: 'ally' | 'all' }
  | { type: 'restore-pr'; amount: number; targets: 'ally' | 'all' }
  | { type: 'cure'; status: StatusId[]; targets: 'ally' | 'all' }
  | { type: 'revive'; percent: number }
  | { type: 'repel'; steps: number }
  | { type: 'full-heal'; targets: 'all' };

export interface WeaponEffect {
  /** Chance de déclenchement, de 0 à 1. */
  chance: number;
  status?: StatusId;
  element?: Element;
  description: string;
}

export interface ItemData {
  id: string;
  name: string;
  kind: ItemKind;
  description: string;
  price: number;
  sellable: boolean;
  /** Pour les consommables. */
  effect?: ConsumableEffect;
  /** Bonus de stats pour l'équipement. */
  stats?: Partial<Stats>;
  resistance?: Partial<ElementalValues>;
  weaponType?: WeaponType;
  weaponEffect?: WeaponEffect;
  /** Héros autorisés à l'équiper (tous si absent, filtré par weaponType pour les armes). */
  allowedHeroes?: HeroId[];
  /** Immunités de statut pour les accessoires et casques. */
  immunities?: StatusId[];
  /** Régénération de PR par tour (accessoires). */
  prRegen?: number;
  icon: string;
  act: Act;
}

/** Recette de la forge de Kaël (data/recipes.json). */
export interface RecipeData {
  id: string;
  result: string;
  materials: { item: string; quantity: number }[];
  coins: number;
  /** Drapeau requis pour voir la recette. */
  requiresFlag?: string;
}

/** Inventaire d'une boutique (data/shops.json). */
export interface ShopData {
  id: string;
  name: string;
  /** Identifiant de personnage (data/characters.json) du marchand. */
  merchant: string;
  items: string[];
  lines: { hello: string; buy: string; bye: string };
}

// ---------------------------------------------------------------------------
// Résonances d'exploration (data/resonances.json)
// ---------------------------------------------------------------------------

export type ResonanceId =
  | 'poussee'
  | 'racine'
  | 'braise'
  | 'ecoute'
  | 'givre'
  | 'averse'
  | 'prise'
  | 'bourrasque'
  | 'envol'
  | 'revelation'
  | 'vapeur'
  | 'magma'
  | 'maree-verte'
  | 'tempete'
  | 'sable-vif'
  | 'brasier';

export interface ResonanceData {
  id: ResonanceId;
  name: string;
  element: ElementOrNeutral;
  cost: number;
  description: string;
  /** Texte de l'écran de tutoriel quand on l'apprend. */
  tutorial: string;
  /** Héros qui la lance (celui qui paie les PR). Null pour les Accords. */
  owner: HeroId | null;
  /** Portée en cases devant le héros (1 par défaut, Poussée agit en ligne). */
  range: number;
  /** Accord : les deux éléments requis dans l'équipe. */
  accord?: [Element, Element];
  icon: string;
  sound: string;
  act: Act;
}

// ---------------------------------------------------------------------------
// Missions (data/quests.json), format du document Scénario
// ---------------------------------------------------------------------------

export type QuestType = 'principale' | 'annexe' | 'lueur';

export type QuestTaskType =
  | 'aller'
  | 'parler'
  | 'ecouter'
  | 'resoudre'
  | 'vaincre'
  | 'trouver'
  | 'livrer'
  | 'choisir'
  | 'cinematique';

export interface QuestTask {
  type: QuestTaskType;
  /** Identifiant de carte, de PNJ, de puzzle, de groupe d'ennemis ou d'objet. */
  cible: string;
  texte: string;
  /** Pour trouver et livrer : nombre d'objets. */
  quantite?: number;
}

export interface QuestRewards {
  xp?: number;
  pieces?: number;
  objets?: { id: string; quantite: number }[];
  resonance?: ResonanceId;
  lueur?: string;
  /** Héros qui rejoint l'équipe. */
  equipe?: HeroId;
}

export interface QuestData {
  id: string;
  type: QuestType;
  acte: Act;
  titre: string;
  resume: string;
  taches: QuestTask[];
  recompenses?: QuestRewards;
  suivante?: string;
  /** Drapeaux requis pour que la mission devienne disponible. */
  prerequis?: string[];
  /** Drapeau posé quand la mission est terminée. */
  drapeauFin?: string;
  /** Zone affichée sur la carte du monde. */
  zone?: string;
}

// ---------------------------------------------------------------------------
// Dialogues et événements (data/dialogues/*.json)
// ---------------------------------------------------------------------------

export type Direction = 'up' | 'down' | 'left' | 'right';

/** Condition évaluée par EventRunner. */
export type EventCondition =
  | { flag: string; is?: boolean }
  | { item: string; min?: number }
  | { hero: HeroId }
  | { resonance: ResonanceId }
  | { quest: string; status: 'active' | 'done' | 'none' }
  | { questTask: string; task: number }
  | { lueur: string }
  | { coins: number }
  | { mapState: string; is: string | number | boolean }
  | { not: EventCondition }
  | { all: EventCondition[] }
  | { any: EventCondition[] };

export interface DialogueChoice {
  texte: string;
  /** Actions jouées si ce choix est pris, ou identifiant d'étiquette vers laquelle sauter. */
  suite: EventAction[] | string;
  /** Drapeau posé quand ce choix est pris. */
  drapeau?: string;
  /** Condition pour afficher ce choix. */
  si?: EventCondition;
}

/** Une réplique (format du document Dialogues). */
export interface SayAction {
  perso: string;
  expr?: Expression;
  texte: string;
  /** Position du portrait, gauche par défaut. */
  cote?: 'gauche' | 'droite';
}

/** Une pensée lue avec Écoute, affichée en italique entre crochets. */
export interface ThoughtAction {
  pensee: string;
  perso?: string;
}

/** Un écran d'information (« Kaël a appris la Résonance Écoute. »). */
export interface ScreenAction {
  ecran: string;
}

export interface ChoiceAction {
  choix: DialogueChoice[];
}

export type MoveTarget = 'player' | string;

export type EmoteId = 'exclamation' | 'question' | 'coeur' | 'colere' | 'sueur' | 'musique';

export type TypedEventAction =
  | { type: 'label'; id: string }
  | { type: 'goto'; label: string }
  | { type: 'move'; cible: MoveTarget; direction: Direction; pas: number; vitesse?: number }
  | { type: 'moveTo'; cible: MoveTarget; x: number; y: number; vitesse?: number }
  | { type: 'face'; cible: MoveTarget; direction: Direction }
  | {
      type: 'teleport';
      cible?: MoveTarget;
      carte?: string;
      x: number;
      y: number;
      direction?: Direction;
    }
  | { type: 'spawn'; pnj: string; sprite: string; x: number; y: number; direction?: Direction }
  | { type: 'despawn'; pnj: string }
  | { type: 'anim'; cible: MoveTarget; animation: string }
  | { type: 'emote'; cible: MoveTarget; emote: EmoteId }
  | {
      type: 'give';
      objet?: string;
      quantite?: number;
      pieces?: number;
      lueur?: string;
      resonance?: ResonanceId;
    }
  | { type: 'take'; objet?: string; quantite?: number; pieces?: number }
  | { type: 'setFlag'; drapeau: string; valeur?: boolean }
  | { type: 'if'; condition: EventCondition; alors: EventAction[]; sinon?: EventAction[] }
  | { type: 'startBattle'; groupe: string; scripted?: ScriptedBattle }
  | { type: 'fade'; vers: 'noir' | 'blanc' | 'visible'; duree?: number }
  | { type: 'wait'; duree: number }
  | { type: 'playSound'; son: string }
  | { type: 'playMusic'; musique: string | null; fondu?: number }
  | { type: 'shake'; duree?: number; intensite?: number }
  | { type: 'flash'; couleur?: string; duree?: number }
  | { type: 'recruit'; heros: HeroId }
  | { type: 'heal' }
  | { type: 'quest'; action: 'start' | 'task' | 'complete'; mission: string; tache?: number }
  | { type: 'title'; texte: string; sousTitre?: string; duree?: number }
  | { type: 'save' }
  | { type: 'setMapState'; cle: string; valeur: string | number | boolean }
  | { type: 'openShop'; boutique: string }
  | { type: 'inn'; prix: number }
  | { type: 'forge' }
  | { type: 'gameOver' }
  | { type: 'credits' }
  | { type: 'end' };

export type EventAction =
  SayAction | ThoughtAction | ScreenAction | ChoiceAction | TypedEventAction;

export interface ScriptedBattle {
  /** Le combat se termine (défaite scénarisée) après ce nombre de tours. */
  loseAfterTurns?: number;
  /** La défaite ne déclenche pas de Game Over, la scène continue. */
  defeatContinues?: boolean;
  /** Drapeau posé selon l'issue : « _victoire » ou « _defaite » est ajouté. */
  outcomeFlag?: string;
}

/** Une scène de dialogue ou une cinématique. */
export interface DialogueScene {
  id: string;
  /** Titre lisible, pour le débogage et l'onglet Souvenirs. */
  titre?: string;
  lignes: EventAction[];
}

/** Personnage référencé dans les dialogues (data/characters.json). */
export interface CharacterData {
  id: string;
  name: string;
  /** Portrait : identifiant, ou null pour les PNJ sans portrait (nom seul). */
  portrait: string | null;
  voice: VoiceData;
  /** Couleur du nom dans la boîte de dialogue. */
  color: string;
}

// ---------------------------------------------------------------------------
// PNJ et cartes
// ---------------------------------------------------------------------------

/** Variante de réplique d'un PNJ selon l'avancée de l'histoire. */
export interface NpcLine {
  /** Condition pour utiliser cette variante (la première qui passe est choisie). */
  si?: EventCondition;
  /** Scène de dialogue complète, ou simple texte. */
  scene?: string;
  texte?: string;
  /** Pensée lue avec Écoute. */
  pensee?: string;
}

/** Définition d'un PNJ (data/npcs.json), référencée par les cartes. */
export interface NpcData {
  id: string;
  name: string;
  sprite: string;
  /** Identifiant de personnage (data/characters.json) pour le portrait et la voix. */
  character: string;
  lines: NpcLine[];
  /** Déplacement aléatoire autour de sa position. */
  wander?: boolean;
}

/** Réplique d'un membre de l'équipe quand on « parle » dans le vide (data/banter/*.json). */
export interface BanterData {
  /** Identifiant de carte ou de zone. */
  zone: string;
  si?: EventCondition;
  lignes: Partial<Record<HeroId, string>>;
}

/** Entrée du journal « Souvenirs » et fragments d'histoire (data/lore.json). */
export interface LoreData {
  id: string;
  title: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Sauvegarde et état du jeu
// ---------------------------------------------------------------------------

export interface HeroState {
  id: HeroId;
  level: number;
  xp: number;
  hp: number;
  pr: number;
  equipment: Record<EquipSlot, string | null>;
  /** Bonus permanents (ex. confiance de Sefa). */
  permanentBonus: Partial<Stats>;
}

export interface LueurOwnership {
  found: boolean;
  hero: HeroId | null;
  state: LueurState;
}

export interface QuestProgress {
  status: 'active' | 'done';
  /** Index de la tâche en cours (0 = première). */
  task: number;
  /** Compteurs pour les tâches trouver et vaincre. */
  counts: Record<string, number>;
}

export interface Position {
  map: string;
  x: number;
  y: number;
  direction: Direction;
}

export interface GameOptions {
  musicVolume: number;
  sfxVolume: number;
  textSpeed: 'lent' | 'normal' | 'rapide';
  /** Affichage des touches à l'écran. */
  showHints: boolean;
}

export type MapStateValue = string | number | boolean;

export interface GameStateData {
  party: HeroId[];
  heroes: Partial<Record<HeroId, HeroState>>;
  lueurs: Record<string, LueurOwnership>;
  inventory: Record<string, number>;
  coins: number;
  flags: Record<string, boolean>;
  quests: Record<string, QuestProgress>;
  resonances: ResonanceId[];
  shortcuts: [ResonanceId | null, ResonanceId | null];
  position: Position;
  /** Pas depuis la dernière recharge de PR. */
  steps: number;
  stepsSinceEncounter: number;
  /** Pas restants d'Encens de calme. */
  repelSteps: number;
  /** État persistant des cartes (coffres ouverts, puzzles résolus, portes). */
  mapState: Record<string, Record<string, MapStateValue>>;
  /** Fragments d'histoire collectés. */
  lore: string[];
  act: Act | 5;
  playTimeMs: number;
  options: GameOptions;
}

export interface SaveSummary {
  slot: number;
  act: number;
  locationName: string;
  partyLevel: number;
  playTimeMs: number;
  updatedAt: string;
  heroes: HeroId[];
}

export interface SaveFile {
  saveVersion: number;
  slot: number;
  createdAt: string;
  updatedAt: string;
  summary: SaveSummary;
  state: GameStateData;
}

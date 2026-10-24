/**
 * Schémas zod de toutes les données JSON du jeu (dossier data/).
 * Ils reflètent les types de ./types.ts : tout changement de type doit être
 * répercuté ici. Les objets sont stricts pour détecter les fautes de frappe
 * dans les clés.
 */
import { z } from 'zod';
import type {
  BanterData,
  CharacterData,
  DialogueChoice,
  DialogueScene,
  EncounterGroup,
  EnemyData,
  EventAction,
  EventCondition,
  HeroData,
  ItemData,
  LoreData,
  LueurData,
  NpcData,
  QuestData,
  RecipeData,
  ResonanceData,
  SaveFile,
  ShopData,
  SpellData,
  SummonData,
} from './types';

// ---------------------------------------------------------------------------
// Briques communes
// ---------------------------------------------------------------------------

/** Identifiant en kebab-case, sans accent ni majuscule. */
export const idSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'identifiant attendu en kebab-case sans accent');

const text = z.string().min(1);

export const elementSchema = z.enum(['terre', 'feu', 'eau', 'vent']);
export const elementOrNeutralSchema = z.enum(['terre', 'feu', 'eau', 'vent', 'neutre']);
export const actSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
export const heroIdSchema = z.enum(['kael', 'nyra', 'oren', 'sefa']);
export const weaponTypeSchema = z.enum([
  'epee',
  'hache',
  'marteau',
  'arc',
  'dague',
  'baton',
  'fleau',
]);
export const equipSlotSchema = z.enum(['weapon', 'armor', 'shield', 'helmet', 'accessory']);
export const expressionSchema = z.enum([
  'neutre',
  'sourire',
  'colere',
  'triste',
  'surpris',
  'fatigue',
]);
export const statusIdSchema = z.enum([
  'poison',
  'sommeil',
  'etourdi',
  'silence',
  'confusion',
  'ko',
]);
export const statKeySchema = z.enum(['hp', 'pr', 'attack', 'defense', 'speed', 'luck']);
export const targetScopeSchema = z.enum(['self', 'ally', 'allies', 'enemy', 'enemies', 'any']);
export const directionSchema = z.enum(['up', 'down', 'left', 'right']);
export const resonanceIdSchema = z.enum([
  'poussee',
  'racine',
  'braise',
  'ecoute',
  'givre',
  'averse',
  'prise',
  'bourrasque',
  'envol',
  'revelation',
  'vapeur',
  'magma',
  'maree-verte',
  'tempete',
  'sable-vif',
  'brasier',
]);

export const statsSchema = z.strictObject({
  hp: z.number(),
  pr: z.number(),
  attack: z.number(),
  defense: z.number(),
  speed: z.number(),
  luck: z.number(),
});

export const partialStatsSchema = statsSchema.partial();

export const elementalValuesSchema = z.strictObject({
  terre: z.number(),
  feu: z.number(),
  eau: z.number(),
  vent: z.number(),
});

export const partialElementalValuesSchema = elementalValuesSchema.partial();

const chance = z.number().min(0).max(1);
const positiveInt = z.number().int().positive();
const nonNegativeInt = z.number().int().min(0);

export const voiceSchema = z.strictObject({
  pitch: z.number().positive(),
  wave: z.enum(['square', 'triangle', 'sawtooth', 'sine']),
  length: z.number().positive(),
});

// ---------------------------------------------------------------------------
// Héros
// ---------------------------------------------------------------------------

export const classNamesSchema = z.strictObject({
  base: text,
  pure: z.tuple([text, text]),
  hybrid: z.strictObject({ terre: text, feu: text, eau: text, vent: text }),
  accordeur: text,
});

export const heroSpellUnlockSchema = z.strictObject({
  spell: idSchema,
  level: z.number().int().min(1).max(50),
});

export const heroSchema = z.strictObject({
  id: heroIdSchema,
  name: text,
  element: elementSchema,
  age: positiveInt,
  description: text,
  baseStats: statsSchema,
  growth: statsSchema,
  basePower: elementalValuesSchema,
  baseResistance: elementalValuesSchema,
  weaponTypes: z.array(weaponTypeSchema).min(1),
  spells: z.array(heroSpellUnlockSchema),
  classes: classNamesSchema,
  startingLueur: idSchema.nullable(),
  startingEquipment: z.strictObject({
    weapon: idSchema.optional(),
    armor: idSchema.optional(),
    shield: idSchema.optional(),
    helmet: idSchema.optional(),
    accessory: idSchema.optional(),
  }),
  sprite: idSchema,
  battleSprite: idSchema,
  portrait: idSchema,
  voice: voiceSchema,
}) satisfies z.ZodType<HeroData>;

// ---------------------------------------------------------------------------
// Sorts
// ---------------------------------------------------------------------------

export const spellSchema = z.strictObject({
  id: idSchema,
  name: text,
  description: text,
  element: elementOrNeutralSchema,
  cost: nonNegativeInt,
  kind: z.enum(['damage', 'heal', 'buff', 'debuff', 'status', 'cure', 'revive']),
  power: z.number().min(0),
  targets: targetScopeSchema,
  status: z.union([statusIdSchema, z.array(statusIdSchema)]).optional(),
  statusChance: chance.optional(),
  stat: statKeySchema.optional(),
  amount: z.number().optional(),
  turns: positiveInt.optional(),
  animation: idSchema,
  accord: z.tuple([elementSchema, elementSchema]).optional(),
}) satisfies z.ZodType<SpellData>;

// ---------------------------------------------------------------------------
// Lueurs et invocations
// ---------------------------------------------------------------------------

export const lueurBonusSchema = partialStatsSchema.extend({
  power: partialElementalValuesSchema.optional(),
  resistance: partialElementalValuesSchema.optional(),
});

export const unleashEffectSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('damage'),
    power: z.number().positive(),
    targets: z.union([positiveInt, z.literal('all')]),
    element: elementSchema,
  }),
  z.strictObject({
    type: z.literal('heal'),
    power: z.number().positive(),
    targets: z.enum(['ally', 'all']),
    cures: z.array(statusIdSchema).optional(),
  }),
  z.strictObject({
    type: z.literal('buff'),
    stat: statKeySchema,
    amount: z.number(),
    targets: z.enum(['ally', 'all']),
    turns: positiveInt,
  }),
  z.strictObject({
    type: z.literal('debuff'),
    stat: statKeySchema,
    amount: z.number(),
    targets: z.enum(['enemy', 'all']),
    turns: positiveInt,
  }),
  z.strictObject({
    type: z.literal('status'),
    status: statusIdSchema,
    targets: z.enum(['enemy', 'all']),
    chance,
  }),
  z.strictObject({ type: z.literal('evasion'), turns: positiveInt }),
  z.strictObject({
    type: z.literal('first-strike'),
    power: z.number().positive(),
    element: elementSchema,
  }),
  z.strictObject({ type: z.literal('revive'), power: z.number().positive() }),
  z.strictObject({ type: z.literal('shield'), turns: positiveInt, amount: z.number() }),
]);

export const lueurSchema = z.strictObject({
  id: idSchema,
  name: text,
  element: z.union([elementSchema, z.literal('prisme')]),
  description: text,
  cry: text,
  bonus: lueurBonusSchema,
  unleash: unleashEffectSchema,
  location: idSchema,
  hint: text,
  act: actSchema,
  sprite: idSchema,
  secret: z.boolean().optional(),
}) satisfies z.ZodType<LueurData>;

export const summonSchema = z.strictObject({
  id: idSchema,
  name: text,
  element: z.union([elementSchema, z.literal('tous')]),
  cost: z.number().int().min(1).max(4),
  effect: unleashEffectSchema,
  description: text,
  sprite: idSchema,
  animation: idSchema,
}) satisfies z.ZodType<SummonData>;

// ---------------------------------------------------------------------------
// Ennemis et groupes
// ---------------------------------------------------------------------------

export const enemySkillSchema = z.strictObject({
  name: text,
  kind: z.enum(['attack', 'spell', 'heal', 'buff', 'debuff', 'status', 'flee']),
  element: elementOrNeutralSchema,
  power: z.number().min(0),
  targets: targetScopeSchema,
  status: statusIdSchema.optional(),
  statusChance: chance.optional(),
  stat: statKeySchema.optional(),
  amount: z.number().optional(),
  turns: positiveInt.optional(),
  weight: z.number().positive(),
  animation: idSchema,
  phases: z.array(nonNegativeInt).optional(),
});

export const enemyPhaseSchema = z.strictObject({
  hpBelow: chance,
  line: z.string().optional(),
  element: elementSchema.optional(),
  attackMultiplier: z.number().positive().optional(),
});

export const dropSchema = z.strictObject({ item: idSchema, chance });

export const enemySchema = z.strictObject({
  id: idSchema,
  name: text,
  description: text,
  element: elementOrNeutralSchema,
  level: positiveInt,
  stats: statsSchema,
  power: elementalValuesSchema,
  resistance: elementalValuesSchema,
  xp: nonNegativeInt,
  coins: nonNegativeInt,
  drops: z.array(dropSchema),
  skills: z.array(enemySkillSchema),
  ai: z.enum(['aggressive', 'random', 'support', 'defensive', 'boss']),
  boss: z.boolean(),
  size: z.enum(['small', 'medium', 'large', 'boss']),
  sprite: idSchema,
  lueurReward: idSchema.optional(),
  phases: z.array(enemyPhaseSchema).optional(),
  noFlee: z.boolean().optional(),
  act: actSchema,
}) satisfies z.ZodType<EnemyData>;

export const encounterGroupSchema = z.strictObject({
  id: idSchema,
  enemies: z.array(idSchema).min(1),
  music: idSchema.optional(),
  background: idSchema,
}) satisfies z.ZodType<EncounterGroup>;

// ---------------------------------------------------------------------------
// Objets, recettes, boutiques
// ---------------------------------------------------------------------------

export const consumableEffectSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('heal'),
    amount: z.number().positive(),
    targets: z.enum(['ally', 'all']),
  }),
  z.strictObject({
    type: z.literal('restore-pr'),
    amount: z.number().positive(),
    targets: z.enum(['ally', 'all']),
  }),
  z.strictObject({
    type: z.literal('cure'),
    status: z.array(statusIdSchema).min(1),
    targets: z.enum(['ally', 'all']),
  }),
  z.strictObject({ type: z.literal('revive'), percent: z.number().min(1).max(100) }),
  z.strictObject({ type: z.literal('repel'), steps: positiveInt }),
  z.strictObject({ type: z.literal('full-heal'), targets: z.literal('all') }),
]);

export const weaponEffectSchema = z.strictObject({
  chance,
  status: statusIdSchema.optional(),
  element: elementSchema.optional(),
  description: text,
});

export const itemSchema = z.strictObject({
  id: idSchema,
  name: text,
  kind: z.enum([
    'consumable',
    'weapon',
    'armor',
    'shield',
    'helmet',
    'accessory',
    'material',
    'key',
  ]),
  description: text,
  price: nonNegativeInt,
  sellable: z.boolean(),
  effect: consumableEffectSchema.optional(),
  stats: partialStatsSchema.optional(),
  resistance: partialElementalValuesSchema.optional(),
  weaponType: weaponTypeSchema.optional(),
  weaponEffect: weaponEffectSchema.optional(),
  allowedHeroes: z.array(heroIdSchema).min(1).optional(),
  immunities: z.array(statusIdSchema).min(1).optional(),
  prRegen: z.number().positive().optional(),
  icon: idSchema,
  act: actSchema,
}) satisfies z.ZodType<ItemData>;

export const recipeSchema = z.strictObject({
  id: idSchema,
  result: idSchema,
  materials: z.array(z.strictObject({ item: idSchema, quantity: positiveInt })).min(1),
  coins: nonNegativeInt,
  requiresFlag: z.string().min(1).optional(),
}) satisfies z.ZodType<RecipeData>;

export const shopSchema = z.strictObject({
  id: idSchema,
  name: text,
  merchant: idSchema,
  items: z.array(idSchema).min(1),
  lines: z.strictObject({ hello: text, buy: text, bye: text }),
}) satisfies z.ZodType<ShopData>;

// ---------------------------------------------------------------------------
// Résonances
// ---------------------------------------------------------------------------

export const resonanceSchema = z.strictObject({
  id: resonanceIdSchema,
  name: text,
  element: elementOrNeutralSchema,
  cost: nonNegativeInt,
  description: text,
  tutorial: text,
  owner: heroIdSchema.nullable(),
  range: positiveInt,
  accord: z.tuple([elementSchema, elementSchema]).optional(),
  icon: idSchema,
  sound: idSchema,
  act: actSchema,
}) satisfies z.ZodType<ResonanceData>;

// ---------------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------------

export const questTaskSchema = z.strictObject({
  type: z.enum([
    'aller',
    'parler',
    'ecouter',
    'resoudre',
    'vaincre',
    'trouver',
    'livrer',
    'choisir',
    'cinematique',
  ]),
  cible: z.string().min(1),
  texte: text,
  quantite: positiveInt.optional(),
});

export const questRewardsSchema = z.strictObject({
  xp: nonNegativeInt.optional(),
  pieces: nonNegativeInt.optional(),
  objets: z.array(z.strictObject({ id: idSchema, quantite: positiveInt })).optional(),
  resonance: resonanceIdSchema.optional(),
  lueur: idSchema.optional(),
  equipe: heroIdSchema.optional(),
});

export const questSchema = z.strictObject({
  id: idSchema,
  type: z.enum(['principale', 'annexe', 'lueur']),
  acte: actSchema,
  titre: text,
  resume: text,
  taches: z.array(questTaskSchema).min(1),
  recompenses: questRewardsSchema.optional(),
  suivante: idSchema.optional(),
  prerequis: z.array(z.string().min(1)).optional(),
  drapeauFin: z.string().min(1).optional(),
  zone: idSchema.optional(),
}) satisfies z.ZodType<QuestData>;

// ---------------------------------------------------------------------------
// Dialogues et événements (récursifs)
// ---------------------------------------------------------------------------

const flag = z.string().min(1);

export const eventConditionSchema: z.ZodType<EventCondition> = z.lazy(() =>
  z.union([
    z.strictObject({ flag, is: z.boolean().optional() }),
    z.strictObject({ item: idSchema, min: positiveInt.optional() }),
    z.strictObject({ hero: heroIdSchema }),
    z.strictObject({ resonance: resonanceIdSchema }),
    z.strictObject({ quest: idSchema, status: z.enum(['active', 'done', 'none']) }),
    z.strictObject({ questTask: idSchema, task: nonNegativeInt }),
    z.strictObject({ lueur: idSchema }),
    z.strictObject({ coins: nonNegativeInt }),
    z.strictObject({
      mapState: z.string().min(1),
      is: z.union([z.string(), z.number(), z.boolean()]),
    }),
    z.strictObject({ not: eventConditionSchema }),
    z.strictObject({ all: z.array(eventConditionSchema) }),
    z.strictObject({ any: z.array(eventConditionSchema) }),
  ]),
);

const moveTarget = z.string().min(1);

export const scriptedBattleSchema = z.strictObject({
  loseAfterTurns: positiveInt.optional(),
  defeatContinues: z.boolean().optional(),
  outcomeFlag: flag.optional(),
});

export const sayActionSchema = z.strictObject({
  perso: z.string().min(1),
  expr: expressionSchema.optional(),
  texte: z.string(),
  cote: z.enum(['gauche', 'droite']).optional(),
});

export const thoughtActionSchema = z.strictObject({
  pensee: z.string(),
  perso: z.string().min(1).optional(),
});

export const screenActionSchema = z.strictObject({ ecran: z.string() });

export const dialogueChoiceSchema: z.ZodType<DialogueChoice> = z.lazy(() =>
  z.strictObject({
    texte: z.string(),
    suite: z.union([z.array(eventActionSchema), z.string().min(1)]),
    drapeau: flag.optional(),
    si: eventConditionSchema.optional(),
  }),
);

export const choiceActionSchema = z.strictObject({
  choix: z.array(dialogueChoiceSchema).min(1),
});

export const typedEventActionSchema = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.strictObject({ type: z.literal('label'), id: z.string().min(1) }),
    z.strictObject({ type: z.literal('goto'), label: z.string().min(1) }),
    z.strictObject({
      type: z.literal('move'),
      cible: moveTarget,
      direction: directionSchema,
      pas: positiveInt,
      vitesse: z.number().positive().optional(),
    }),
    z.strictObject({
      type: z.literal('moveTo'),
      cible: moveTarget,
      x: z.number().int(),
      y: z.number().int(),
      vitesse: z.number().positive().optional(),
    }),
    z.strictObject({ type: z.literal('face'), cible: moveTarget, direction: directionSchema }),
    z.strictObject({
      type: z.literal('teleport'),
      cible: moveTarget.optional(),
      carte: idSchema.optional(),
      x: z.number().int(),
      y: z.number().int(),
      direction: directionSchema.optional(),
    }),
    z.strictObject({
      type: z.literal('spawn'),
      pnj: z.string().min(1),
      sprite: idSchema,
      x: z.number().int(),
      y: z.number().int(),
      direction: directionSchema.optional(),
    }),
    z.strictObject({ type: z.literal('despawn'), pnj: z.string().min(1) }),
    z.strictObject({ type: z.literal('anim'), cible: moveTarget, animation: z.string().min(1) }),
    z.strictObject({
      type: z.literal('emote'),
      cible: moveTarget,
      emote: z.enum(['exclamation', 'question', 'coeur', 'colere', 'sueur', 'musique']),
    }),
    z.strictObject({
      type: z.literal('give'),
      objet: idSchema.optional(),
      quantite: positiveInt.optional(),
      pieces: positiveInt.optional(),
      lueur: idSchema.optional(),
      resonance: resonanceIdSchema.optional(),
    }),
    z.strictObject({
      type: z.literal('take'),
      objet: idSchema.optional(),
      quantite: positiveInt.optional(),
      pieces: positiveInt.optional(),
    }),
    z.strictObject({ type: z.literal('setFlag'), drapeau: flag, valeur: z.boolean().optional() }),
    z.strictObject({
      type: z.literal('if'),
      condition: eventConditionSchema,
      alors: z.array(eventActionSchema),
      sinon: z.array(eventActionSchema).optional(),
    }),
    z.strictObject({
      type: z.literal('startBattle'),
      groupe: idSchema,
      scripted: scriptedBattleSchema.optional(),
    }),
    z.strictObject({
      type: z.literal('fade'),
      vers: z.enum(['noir', 'blanc', 'visible']),
      duree: nonNegativeInt.optional(),
    }),
    z.strictObject({ type: z.literal('wait'), duree: nonNegativeInt }),
    z.strictObject({ type: z.literal('playSound'), son: idSchema }),
    z.strictObject({
      type: z.literal('playMusic'),
      musique: idSchema.nullable(),
      fondu: nonNegativeInt.optional(),
    }),
    z.strictObject({
      type: z.literal('shake'),
      duree: nonNegativeInt.optional(),
      intensite: z.number().positive().optional(),
    }),
    z.strictObject({
      type: z.literal('flash'),
      couleur: z.string().min(1).optional(),
      duree: nonNegativeInt.optional(),
    }),
    z.strictObject({ type: z.literal('recruit'), heros: heroIdSchema }),
    z.strictObject({ type: z.literal('heal') }),
    z.strictObject({
      type: z.literal('quest'),
      action: z.enum(['start', 'task', 'complete']),
      mission: idSchema,
      tache: nonNegativeInt.optional(),
    }),
    z.strictObject({
      type: z.literal('title'),
      texte: z.string(),
      sousTitre: z.string().optional(),
      duree: nonNegativeInt.optional(),
    }),
    z.strictObject({ type: z.literal('save') }),
    z.strictObject({
      type: z.literal('setMapState'),
      cle: z.string().min(1),
      valeur: z.union([z.string(), z.number(), z.boolean()]),
    }),
    z.strictObject({ type: z.literal('openShop'), boutique: idSchema }),
    z.strictObject({ type: z.literal('inn'), prix: nonNegativeInt }),
    z.strictObject({ type: z.literal('forge') }),
    z.strictObject({ type: z.literal('gameOver') }),
    z.strictObject({ type: z.literal('credits') }),
    z.strictObject({ type: z.literal('end') }),
  ]),
);

export const eventActionSchema: z.ZodType<EventAction> = z.lazy(() =>
  z.union([
    sayActionSchema,
    thoughtActionSchema,
    screenActionSchema,
    choiceActionSchema,
    typedEventActionSchema,
  ]),
);

export const dialogueSceneSchema = z.strictObject({
  id: idSchema,
  titre: z.string().optional(),
  lignes: z.array(eventActionSchema),
}) satisfies z.ZodType<DialogueScene>;

// ---------------------------------------------------------------------------
// Personnages, PNJ, répliques d'équipe, fragments d'histoire
// ---------------------------------------------------------------------------

export const characterSchema = z.strictObject({
  id: idSchema,
  name: text,
  portrait: idSchema.nullable(),
  voice: voiceSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'couleur hexadécimale attendue (#rrggbb)'),
}) satisfies z.ZodType<CharacterData>;

export const npcLineSchema = z.strictObject({
  si: eventConditionSchema.optional(),
  scene: idSchema.optional(),
  texte: z.string().optional(),
  pensee: z.string().optional(),
});

export const npcSchema = z.strictObject({
  id: idSchema,
  name: text,
  sprite: idSchema,
  character: idSchema,
  lines: z.array(npcLineSchema),
  wander: z.boolean().optional(),
}) satisfies z.ZodType<NpcData>;

export const banterSchema = z.strictObject({
  zone: idSchema,
  si: eventConditionSchema.optional(),
  lignes: z.strictObject({
    kael: z.string().optional(),
    nyra: z.string().optional(),
    oren: z.string().optional(),
    sefa: z.string().optional(),
  }),
}) satisfies z.ZodType<BanterData>;

export const loreSchema = z.strictObject({
  id: idSchema,
  title: text,
  text: text,
}) satisfies z.ZodType<LoreData>;

// ---------------------------------------------------------------------------
// Sauvegarde
// ---------------------------------------------------------------------------

export const heroStateSchema = z.strictObject({
  id: heroIdSchema,
  level: z.number().int().min(1).max(50),
  xp: nonNegativeInt,
  hp: nonNegativeInt,
  pr: nonNegativeInt,
  equipment: z.strictObject({
    weapon: idSchema.nullable(),
    armor: idSchema.nullable(),
    shield: idSchema.nullable(),
    helmet: idSchema.nullable(),
    accessory: idSchema.nullable(),
  }),
  permanentBonus: partialStatsSchema,
});

export const lueurOwnershipSchema = z.strictObject({
  found: z.boolean(),
  hero: heroIdSchema.nullable(),
  state: z.enum(['liee', 'liberee', 'repos']),
});

export const questProgressSchema = z.strictObject({
  status: z.enum(['active', 'done']),
  task: nonNegativeInt,
  counts: z.record(z.string(), z.number()),
});

export const positionSchema = z.strictObject({
  map: idSchema,
  x: z.number().int(),
  y: z.number().int(),
  direction: directionSchema,
});

export const gameOptionsSchema = z.strictObject({
  musicVolume: chance,
  sfxVolume: chance,
  textSpeed: z.enum(['lent', 'normal', 'rapide']),
  showHints: z.boolean(),
});

const mapStateValue = z.union([z.string(), z.number(), z.boolean()]);

export const gameStateSchema = z.strictObject({
  party: z.array(heroIdSchema),
  heroes: z.strictObject({
    kael: heroStateSchema.optional(),
    nyra: heroStateSchema.optional(),
    oren: heroStateSchema.optional(),
    sefa: heroStateSchema.optional(),
  }),
  lueurs: z.record(z.string(), lueurOwnershipSchema),
  inventory: z.record(z.string(), nonNegativeInt),
  coins: nonNegativeInt,
  flags: z.record(z.string(), z.boolean()),
  quests: z.record(z.string(), questProgressSchema),
  resonances: z.array(resonanceIdSchema),
  shortcuts: z.tuple([resonanceIdSchema.nullable(), resonanceIdSchema.nullable()]),
  position: positionSchema,
  steps: nonNegativeInt,
  stepsSinceEncounter: nonNegativeInt,
  repelSteps: nonNegativeInt,
  mapState: z.record(z.string(), z.record(z.string(), mapStateValue)),
  lore: z.array(idSchema),
  act: z.union([actSchema, z.literal(5)]),
  playTimeMs: nonNegativeInt,
  options: gameOptionsSchema,
});

export const saveSummarySchema = z.strictObject({
  slot: nonNegativeInt,
  act: z.number().int(),
  locationName: z.string(),
  partyLevel: positiveInt,
  playTimeMs: nonNegativeInt,
  updatedAt: z.string(),
  heroes: z.array(heroIdSchema),
});

export const saveFileSchema = z.strictObject({
  saveVersion: positiveInt,
  slot: nonNegativeInt,
  createdAt: z.string(),
  updatedAt: z.string(),
  summary: saveSummarySchema,
  state: gameStateSchema,
}) satisfies z.ZodType<SaveFile>;

// ---------------------------------------------------------------------------
// Correspondance fichier → schéma et validation
// ---------------------------------------------------------------------------

/** Fichiers uniques à la racine de data/. */
export const DATA_SCHEMAS = {
  'heroes.json': z.array(heroSchema),
  'spells.json': z.array(spellSchema),
  'lueurs.json': z.array(lueurSchema),
  'summons.json': z.array(summonSchema),
  'enemies.json': z.array(enemySchema),
  'encounters.json': z.array(encounterGroupSchema),
  'items.json': z.array(itemSchema),
  'recipes.json': z.array(recipeSchema),
  'shops.json': z.array(shopSchema),
  'resonances.json': z.array(resonanceSchema),
  'quests.json': z.array(questSchema),
  'lore.json': z.array(loreSchema),
  'characters.json': z.array(characterSchema),
  'npcs.json': z.array(npcSchema),
} as const satisfies Record<string, z.ZodType>;

export type DataFileName = keyof typeof DATA_SCHEMAS;

/**
 * Dossiers de data/ contenant plusieurs fichiers du même type
 * (ex. `dialogues/a1-s01-matin-brumeval.json`, `characters/acte1.json`).
 */
export const DIRECTORY_SCHEMAS = {
  dialogues: z.union([dialogueSceneSchema, z.array(dialogueSceneSchema)]),
  banter: z.union([banterSchema, z.array(banterSchema)]),
  characters: z.union([characterSchema, z.array(characterSchema)]),
  npcs: z.union([npcSchema, z.array(npcSchema)]),
} as const satisfies Record<string, z.ZodType>;

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

/** Trouve le schéma d'un fichier à partir de son chemin relatif à data/. */
export function schemaFor(fileName: string): z.ZodType | undefined {
  const normalized = fileName.replace(/\\/g, '/').replace(/^(\.\/)?(data\/)?/, '');
  const segments = normalized.split('/');
  const directory = segments.length > 1 ? segments[0] : undefined;
  if (directory !== undefined && directory in DIRECTORY_SCHEMAS) {
    return DIRECTORY_SCHEMAS[directory as keyof typeof DIRECTORY_SCHEMAS];
  }
  const base = segments[segments.length - 1];
  if (base !== undefined && base in DATA_SCHEMAS) {
    return DATA_SCHEMAS[base as DataFileName];
  }
  return undefined;
}

function formatPath(path: PropertyKey[]): string {
  if (path.length === 0) return '(racine)';
  return path
    .map((key) => (typeof key === 'number' ? `[${key}]` : `.${String(key)}`))
    .join('')
    .replace(/^\./, '');
}

/** Aplatit les erreurs d'union : on garde la branche qui a le moins d'erreurs. */
function flattenIssues(issues: z.core.$ZodIssue[], prefix: PropertyKey[] = []): string[] {
  const lines: string[] = [];
  for (const issue of issues) {
    const path = [...prefix, ...issue.path];
    if (issue.code === 'invalid_union' && issue.errors.length > 0) {
      const best = [...issue.errors].sort((a, b) => a.length - b.length)[0] ?? [];
      lines.push(...flattenIssues(best, path));
      continue;
    }
    lines.push(`${formatPath(path)} : ${issue.message}`);
  }
  return lines;
}

/**
 * Valide le contenu d'un fichier de data/ et renvoie des messages lisibles
 * (chemin dans le JSON + problème).
 */
export function validateData(fileName: string, json: unknown): ValidationResult {
  const schema = schemaFor(fileName);
  if (!schema) {
    return { ok: false, errors: [`${fileName} : aucun schéma connu pour ce fichier`] };
  }
  const result = schema.safeParse(json);
  if (result.success) return { ok: true };
  const errors = [...new Set(flattenIssues(result.error.issues))];
  return { ok: false, errors: errors.map((e) => `${fileName} ${e}`) };
}

/**
 * Chargement de toutes les données JSON de data/ via import.meta.glob (Vite).
 * Les fichiers absents donnent des collections vides : le jeu démarre même
 * quand une partie du contenu n'existe pas encore.
 */
import type {
  BanterData,
  CharacterData,
  DialogueScene,
  EncounterGroup,
  EnemyData,
  HeroData,
  HeroId,
  ItemData,
  LoreData,
  LueurData,
  NpcData,
  RecipeData,
  ResonanceData,
  ResonanceId,
  ShopData,
  SpellData,
  SummonData,
  QuestData,
} from './types';

/** Morceau chiptune (data/audio/music/<id>.json, voir docs/technique/format-audio.md). */
export interface MusicTrackData {
  id: string;
  title?: string;
  bpm?: number;
  stepsPerBeat?: number;
  loop?: boolean;
  tracks?: unknown[];
}

export interface RawGameData {
  heroes: HeroData[];
  spells: SpellData[];
  lueurs: LueurData[];
  summons: SummonData[];
  enemies: EnemyData[];
  encounters: EncounterGroup[];
  items: ItemData[];
  recipes: RecipeData[];
  shops: ShopData[];
  resonances: ResonanceData[];
  quests: QuestData[];
  lore: LoreData[];
  characters: CharacterData[];
  npcs: NpcData[];
  banters: BanterData[];
  scenes: DialogueScene[];
  music: MusicTrackData[];
}

type Glob<T> = Record<string, T>;

/** Un fichier unique : son contenu, ou un tableau vide s'il n'existe pas. */
function single<T>(glob: Glob<T[]>): T[] {
  const first = Object.values(glob)[0];
  return Array.isArray(first) ? first : [];
}

/** Plusieurs fichiers, chacun contenant un objet ou un tableau : tout est fusionné. */
function merged<T>(glob: Glob<T | T[]>): T[] {
  const result: T[] = [];
  for (const path of Object.keys(glob).sort()) {
    const value = glob[path];
    if (Array.isArray(value)) result.push(...value);
    else if (value !== undefined && value !== null) result.push(value);
  }
  return result;
}

const options = { eager: true, import: 'default' } as const;

export function loadRawGameData(): RawGameData {
  return {
    heroes: single(import.meta.glob<HeroData[]>('/data/heroes.json', options)),
    spells: single(import.meta.glob<SpellData[]>('/data/spells.json', options)),
    lueurs: single(import.meta.glob<LueurData[]>('/data/lueurs.json', options)),
    summons: single(import.meta.glob<SummonData[]>('/data/summons.json', options)),
    enemies: single(import.meta.glob<EnemyData[]>('/data/enemies.json', options)),
    encounters: single(import.meta.glob<EncounterGroup[]>('/data/encounters.json', options)),
    items: single(import.meta.glob<ItemData[]>('/data/items.json', options)),
    recipes: single(import.meta.glob<RecipeData[]>('/data/recipes.json', options)),
    shops: single(import.meta.glob<ShopData[]>('/data/shops.json', options)),
    resonances: single(import.meta.glob<ResonanceData[]>('/data/resonances.json', options)),
    quests: single(import.meta.glob<QuestData[]>('/data/quests.json', options)),
    lore: single(import.meta.glob<LoreData[]>('/data/lore.json', options)),
    characters: merged(
      import.meta.glob<CharacterData | CharacterData[]>('/data/characters/*.json', options),
    ),
    npcs: merged(import.meta.glob<NpcData | NpcData[]>('/data/npcs/*.json', options)),
    banters: merged(import.meta.glob<BanterData | BanterData[]>('/data/banter/*.json', options)),
    scenes: merged(
      import.meta.glob<DialogueScene | DialogueScene[]>('/data/dialogues/*.json', options),
    ),
    music: merged(
      import.meta.glob<MusicTrackData | MusicTrackData[]>('/data/audio/music/*.json', options),
    ),
  };
}

function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item);
  return map;
}

function pick<T>(map: Map<string, T>, id: string, label: string): T {
  const value = map.get(id);
  if (value === undefined) throw new Error(`${label} inconnu : « ${id} »`);
  return value;
}

export class DataRegistry {
  readonly heroes: Map<string, HeroData>;
  readonly spells: Map<string, SpellData>;
  readonly lueurs: Map<string, LueurData>;
  readonly summons: Map<string, SummonData>;
  readonly enemies: Map<string, EnemyData>;
  readonly encounters: Map<string, EncounterGroup>;
  readonly items: Map<string, ItemData>;
  readonly recipes: Map<string, RecipeData>;
  readonly shops: Map<string, ShopData>;
  readonly resonances: Map<string, ResonanceData>;
  readonly quests: Map<string, QuestData>;
  readonly lore: Map<string, LoreData>;
  readonly characters: Map<string, CharacterData>;
  readonly npcs: Map<string, NpcData>;
  readonly scenes: Map<string, DialogueScene>;
  readonly music: Map<string, MusicTrackData>;
  readonly banters: readonly BanterData[];

  constructor(raw: Partial<RawGameData>) {
    this.heroes = indexById(raw.heroes ?? []);
    this.spells = indexById(raw.spells ?? []);
    this.lueurs = indexById(raw.lueurs ?? []);
    this.summons = indexById(raw.summons ?? []);
    this.enemies = indexById(raw.enemies ?? []);
    this.encounters = indexById(raw.encounters ?? []);
    this.items = indexById(raw.items ?? []);
    this.recipes = indexById(raw.recipes ?? []);
    this.shops = indexById(raw.shops ?? []);
    this.resonances = indexById(raw.resonances ?? []);
    this.quests = indexById(raw.quests ?? []);
    this.lore = indexById(raw.lore ?? []);
    this.characters = indexById(raw.characters ?? []);
    this.npcs = indexById(raw.npcs ?? []);
    this.scenes = indexById(raw.scenes ?? []);
    this.music = indexById(raw.music ?? []);
    this.banters = raw.banters ?? [];
  }

  getHero(id: HeroId | string): HeroData {
    return pick(this.heroes, id, 'Héros');
  }
  getSpell(id: string): SpellData {
    return pick(this.spells, id, 'Sort');
  }
  getLueur(id: string): LueurData {
    return pick(this.lueurs, id, 'Lueur');
  }
  getSummon(id: string): SummonData {
    return pick(this.summons, id, 'Invocation');
  }
  getEnemy(id: string): EnemyData {
    return pick(this.enemies, id, 'Ennemi');
  }
  getEncounter(id: string): EncounterGroup {
    return pick(this.encounters, id, 'Groupe d’ennemis');
  }
  getItem(id: string): ItemData {
    return pick(this.items, id, 'Objet');
  }
  getRecipe(id: string): RecipeData {
    return pick(this.recipes, id, 'Recette');
  }
  getShop(id: string): ShopData {
    return pick(this.shops, id, 'Boutique');
  }
  getResonance(id: ResonanceId | string): ResonanceData {
    return pick(this.resonances, id, 'Résonance');
  }
  getQuest(id: string): QuestData {
    return pick(this.quests, id, 'Mission');
  }
  getLore(id: string): LoreData {
    return pick(this.lore, id, 'Fragment d’histoire');
  }
  getCharacter(id: string): CharacterData {
    return pick(this.characters, id, 'Personnage');
  }
  getNpc(id: string): NpcData {
    return pick(this.npcs, id, 'PNJ');
  }
  getScene(id: string): DialogueScene {
    return pick(this.scenes, id, 'Scène');
  }
  getMusic(id: string): MusicTrackData {
    return pick(this.music, id, 'Musique');
  }

  /** Répliques d'équipe d'une zone ou d'une carte (la condition `si` est évaluée par l'appelant). */
  bantersFor(zone: string): BanterData[] {
    return this.banters.filter((b) => b.zone === zone);
  }

  /** Tous les héros, dans l'ordre du fichier. */
  allHeroes(): HeroData[] {
    return [...this.heroes.values()];
  }

  allQuests(): QuestData[] {
    return [...this.quests.values()];
  }
}

let cached: DataRegistry | null = null;

/** Registre unique du jeu, chargé au premier appel. */
export function getRegistry(): DataRegistry {
  if (!cached) cached = new DataRegistry(loadRawGameData());
  return cached;
}

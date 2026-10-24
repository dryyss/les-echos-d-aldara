import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateData } from '../../src/data/schemas';
import type { DataFileName } from '../../src/data/schemas';
import type {
  HeroData,
  ItemData,
  LoreData,
  LueurData,
  RecipeData,
  ResonanceData,
  ShopData,
  SpellData,
  SummonData,
} from '../../src/data/types';

const DATA_DIR = join(__dirname, '..', '..', 'data');

/** Fichiers du périmètre « données de base ». */
const BASE_FILES = [
  'heroes.json',
  'spells.json',
  'lueurs.json',
  'summons.json',
  'items.json',
  'recipes.json',
  'shops.json',
  'resonances.json',
  'lore.json',
] as const satisfies readonly DataFileName[];

/** Icônes d'objets de docs/technique/format-art.md (section Interface). */
const ITEM_ICONS = new Set([
  'herbe',
  'fiole',
  'plume',
  'encens',
  'epee',
  'hache',
  'marteau',
  'arc',
  'dague',
  'baton',
  'fleau',
  'armure',
  'bouclier',
  'casque',
  'anneau',
  'amulette',
  'minerai',
  'cle',
  'livre',
  'coquillage',
]);

const SPELL_ANIMATIONS = new Set([
  'frappe-terre',
  'pierres',
  'seisme',
  'bouclier-terre',
  'flamme',
  'boule-feu',
  'brasier',
  'mur-feu',
  'vague',
  'pluie-soin',
  'bulle',
  'givre',
  'lame-vent',
  'tornade',
  'brume',
  'eclair',
  'soin',
  'soin-zone',
  'resurrection',
  'buff',
  'debuff',
  'statut',
]);

const SUMMON_IDS = [
  'golem-pierre',
  'titan-argile',
  'colosse-basalte',
  'salamandre-invoc',
  'phenix-rouge',
  'dragon-braise-invoc',
  'ondine',
  'serpent-marees',
  'leviathan-invoc',
  'faucon',
  'griffon',
  'roc-tempete-invoc',
  'gardien-aldara',
];

const LUEUR_IDS: Record<string, string[]> = {
  terre: ['gres', 'mousse', 'ardoise', 'lichen', 'silex', 'argile', 'humus'],
  feu: ['tison', 'cendre', 'magma', 'etincelle', 'suie', 'fumerolle', 'salpetre'],
  eau: ['goutte', 'brume', 'ressac', 'perle', 'ecume', 'rosee', 'embrun'],
  vent: ['zephyr', 'rafale', 'bise', 'alize', 'grain', 'mistral'],
  prisme: ['prisme'],
};

const RESONANCE_IDS = [
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
];

const ACCORD_SPELLS = [
  'accord-vapeur',
  'accord-magma',
  'accord-maree-verte',
  'accord-tempete',
  'accord-sable-vif',
  'accord-brasier',
];

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function load<T>(file: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8')) as T;
}

const heroes = load<HeroData[]>('heroes.json');
const spells = load<SpellData[]>('spells.json');
const lueurs = load<LueurData[]>('lueurs.json');
const summons = load<SummonData[]>('summons.json');
const items = load<ItemData[]>('items.json');
const recipes = load<RecipeData[]>('recipes.json');
const shops = load<ShopData[]>('shops.json');
const resonances = load<ResonanceData[]>('resonances.json');
const lore = load<LoreData[]>('lore.json');

const spellIds = new Set(spells.map((s) => s.id));
const lueurIds = new Set(lueurs.map((l) => l.id));
const itemIds = new Set(items.map((i) => i.id));
const itemsById = new Map(items.map((i) => [i.id, i]));

/** Parcourt toutes les chaînes d'un JSON avec leur chemin. */
function collectStrings(value: unknown, path: string, out: { path: string; text: string }[]): void {
  if (typeof value === 'string') out.push({ path, text: value });
  else if (Array.isArray(value)) value.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
  else if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) collectStrings(v, `${path}.${k}`, out);
  }
}

describe('validation par schéma', () => {
  it.each(BASE_FILES)('%s respecte son schéma', (file) => {
    const result = validateData(file, load(file));
    expect(result.ok ? [] : result.errors).toEqual([]);
  });

  it('refuse une clé inconnue (schémas stricts)', () => {
    const [hero] = heroes;
    const broken = [{ ...hero, growht: hero?.growth }];
    const result = validateData('heroes.json', broken);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toMatch(/growht/);
  });

  it('refuse une valeur hors type avec un chemin lisible', () => {
    const [lueur] = lueurs;
    const broken = [{ ...lueur, bonus: { hp: 'beaucoup' } }];
    const result = validateData('lueurs.json', broken);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toMatch(/\[0\]\.bonus\.hp/);
  });

  it('signale un fichier sans schéma', () => {
    const result = validateData('inconnu.json', []);
    expect(result.ok).toBe(false);
  });
});

describe('identifiants et textes', () => {
  it.each(BASE_FILES)('%s : ids uniques et en kebab-case', (file) => {
    const list = load<{ id: string }[]>(file);
    const ids = list.map((e) => e.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
    expect(ids.filter((id) => !KEBAB.test(id))).toEqual([]);
  });

  it.each(BASE_FILES)('%s : ni tiret cadratin, ni apostrophe droite, ni « ... »', (file) => {
    const strings: { path: string; text: string }[] = [];
    collectStrings(load(file), file, strings);
    const errors = strings
      .filter(({ text }) => /[—–']/.test(text) || text.includes('...'))
      .map(({ path, text }) => `${path} : « ${text} »`);
    expect(errors).toEqual([]);
  });
});

describe('héros', () => {
  it('sont les quatre héros dans l’ordre du recrutement', () => {
    expect(heroes.map((h) => h.id)).toEqual(['kael', 'nyra', 'oren', 'sefa']);
  });

  it.each(heroes.map((h) => [h.id, h] as const))('%s a 7 à 8 sorts existants', (_id, hero) => {
    expect(hero.spells.length).toBeGreaterThanOrEqual(7);
    expect(hero.spells.length).toBeLessThanOrEqual(8);
    const missing = hero.spells.filter((s) => !spellIds.has(s.spell)).map((s) => s.spell);
    expect(missing).toEqual([]);
    const levels = hero.spells.map((s) => s.level);
    expect(levels[0]).toBe(1);
    expect([...levels].sort((a, b) => a - b)).toEqual(levels);
    expect(Math.max(...levels)).toBeLessThanOrEqual(40);
  });

  it.each(heroes.map((h) => [h.id, h] as const))(
    '%s a une Lueur de départ et un équipement existants',
    (_id, hero) => {
      expect(hero.startingLueur).not.toBeNull();
      expect(lueurIds.has(hero.startingLueur ?? '')).toBe(true);
      const starting = lueurs.find((l) => l.id === hero.startingLueur);
      expect(starting?.element).toBe(hero.element);
      for (const [slot, itemId] of Object.entries(hero.startingEquipment)) {
        const item = itemsById.get(itemId);
        expect(item, `${slot} : ${itemId}`).toBeDefined();
        if (slot === 'weapon') {
          expect(item?.kind).toBe('weapon');
          expect(hero.weaponTypes).toContain(item?.weaponType);
        } else {
          expect(item?.kind).toBe(slot);
        }
      }
    },
  );

  it('ont les Lueurs de départ du scénario', () => {
    const starting = Object.fromEntries(heroes.map((h) => [h.id, h.startingLueur]));
    expect(starting).toEqual({ kael: 'gres', nyra: 'tison', oren: 'goutte', sefa: 'rafale' });
  });

  it('ont les bonnes bases élémentaires (10 dans l’élément natif, 0 ailleurs)', () => {
    for (const hero of heroes) {
      for (const el of ['terre', 'feu', 'eau', 'vent'] as const) {
        const expected = el === hero.element ? 10 : 0;
        expect(hero.basePower[el]).toBe(expected);
        expect(hero.baseResistance[el]).toBe(expected);
      }
    }
  });

  it('les sorts de chaque héros sont de son élément ou neutres', () => {
    for (const hero of heroes) {
      for (const unlock of hero.spells) {
        const spell = spells.find((s) => s.id === unlock.spell);
        expect(spell?.element === hero.element || spell?.element === 'neutre').toBe(true);
      }
    }
  });
});

describe('sorts', () => {
  it('utilisent une animation connue', () => {
    const bad = spells.filter((s) => !SPELL_ANIMATIONS.has(s.animation)).map((s) => s.id);
    expect(bad).toEqual([]);
  });

  it('ont des coûts entre 3 et 25 PR', () => {
    const bad = spells.filter((s) => s.cost < 3 || s.cost > 25).map((s) => s.id);
    expect(bad).toEqual([]);
  });

  it('contiennent les 6 Accords avec deux éléments différents', () => {
    const accords = spells.filter((s) => s.accord !== undefined);
    expect(accords.map((s) => s.id).sort()).toEqual([...ACCORD_SPELLS].sort());
    for (const accord of accords) {
      expect(accord.accord?.[0]).not.toBe(accord.accord?.[1]);
    }
  });

  it('les sorts hors Accords appartiennent tous à un héros', () => {
    const owned = new Set(heroes.flatMap((h) => h.spells.map((s) => s.spell)));
    const orphans = spells
      .filter((s) => s.accord === undefined && !owned.has(s.id))
      .map((s) => s.id);
    expect(orphans).toEqual([]);
  });

  it('les buffs et malus ont une stat, un montant et une durée', () => {
    for (const spell of spells) {
      if (spell.kind === 'buff' || spell.kind === 'debuff') {
        expect(spell.stat, spell.id).toBeDefined();
        expect(spell.amount, spell.id).toBeGreaterThan(0);
        expect(spell.turns, spell.id).toBeGreaterThan(0);
      }
      if (spell.kind === 'status') {
        expect(spell.status, spell.id).toBeDefined();
        expect(spell.statusChance, spell.id).toBeGreaterThan(0);
      }
      if (spell.kind === 'cure') expect(spell.status, spell.id).toBeDefined();
      if (spell.kind === 'damage' || spell.kind === 'heal' || spell.kind === 'revive') {
        expect(spell.power, spell.id).toBeGreaterThan(0);
      }
    }
  });
});

describe('Lueurs', () => {
  it('sont exactement 28 avec la répartition 7 / 7 / 7 / 6 + Prisme', () => {
    expect(lueurs).toHaveLength(28);
    for (const [element, ids] of Object.entries(LUEUR_IDS)) {
      const found = lueurs.filter((l) => l.element === element).map((l) => l.id);
      expect(found.sort()).toEqual([...ids].sort());
    }
  });

  it('Prisme est la seule Lueur secrète', () => {
    expect(lueurs.filter((l) => l.secret).map((l) => l.id)).toEqual(['prisme']);
  });

  it('utilisent chaque type d’effet de libération au moins une fois', () => {
    const used = new Set(lueurs.map((l) => l.unleash.type));
    const expected = [
      'damage',
      'heal',
      'buff',
      'debuff',
      'status',
      'evasion',
      'first-strike',
      'revive',
      'shield',
    ];
    expect(expected.filter((t) => !used.has(t as LueurData['unleash']['type']))).toEqual([]);
  });

  it('les effets de dégâts et de première frappe sont de l’élément de la Lueur', () => {
    for (const lueur of lueurs) {
      if (lueur.element === 'prisme') continue;
      if (lueur.unleash.type === 'damage' || lueur.unleash.type === 'first-strike') {
        expect(lueur.unleash.element, lueur.id).toBe(lueur.element);
      }
    }
  });

  it('reprennent les 8 exemples du GDD', () => {
    const byId = new Map(lueurs.map((l) => [l.id, l]));
    expect(byId.get('gres')?.bonus).toEqual({ hp: 8, defense: 2 });
    expect(byId.get('gres')?.unleash).toEqual({
      type: 'damage',
      power: 30,
      targets: 1,
      element: 'terre',
    });
    expect(byId.get('mousse')?.bonus).toEqual({ pr: 3 });
    expect(byId.get('tison')?.unleash).toEqual({
      type: 'damage',
      power: 25,
      targets: 3,
      element: 'feu',
    });
    expect(byId.get('cendre')?.unleash.type).toBe('debuff');
    expect(byId.get('goutte')?.bonus).toEqual({ hp: 6, pr: 2 });
    expect(byId.get('brume')?.unleash).toEqual({ type: 'evasion', turns: 2 });
    expect(byId.get('zephyr')?.unleash.type).toBe('first-strike');
    expect(byId.get('rafale')?.unleash).toMatchObject({ type: 'status', status: 'etourdi' });
  });

  it('ont un lieu, un indice et un sprite égal à leur id', () => {
    for (const lueur of lueurs) {
      expect(lueur.location.length, lueur.id).toBeGreaterThan(0);
      expect(lueur.hint.length, lueur.id).toBeGreaterThan(10);
      expect(lueur.sprite).toBe(lueur.id);
    }
  });
});

describe('invocations', () => {
  it('sont les 13 invocations du GDD', () => {
    expect(summons.map((s) => s.id).sort()).toEqual([...SUMMON_IDS].sort());
  });

  it('coûtent 1 à 3 Lueurs par élément, 4 pour le Gardien', () => {
    for (const element of ['terre', 'feu', 'eau', 'vent']) {
      const costs = summons
        .filter((s) => s.element === element)
        .map((s) => s.cost)
        .sort();
      expect(costs, element).toEqual([1, 2, 3]);
    }
    const gardien = summons.find((s) => s.id === 'gardien-aldara');
    expect(gardien?.element).toBe('tous');
    expect(gardien?.cost).toBe(4);
  });

  it('ont un sprite égal à leur id', () => {
    for (const summon of summons) expect(summon.sprite).toBe(summon.id);
  });
});

describe('objets', () => {
  it('utilisent une icône connue', () => {
    const bad = items.filter((i) => !ITEM_ICONS.has(i.icon)).map((i) => `${i.id} (${i.icon})`);
    expect(bad).toEqual([]);
  });

  it('les consommables ont un effet, les autres non', () => {
    for (const item of items) {
      if (item.kind === 'consumable') expect(item.effect, item.id).toBeDefined();
      else expect(item.effect, item.id).toBeUndefined();
    }
  });

  it('les armes ont un type et une attaque, les protections une défense', () => {
    for (const item of items) {
      if (item.kind === 'weapon') {
        expect(item.weaponType, item.id).toBeDefined();
        expect(item.stats?.attack, item.id).toBeGreaterThan(0);
      }
      if (item.kind === 'armor' || item.kind === 'shield' || item.kind === 'helmet') {
        expect(item.stats?.defense, item.id).toBeGreaterThan(0);
      }
      if (item.kind !== 'weapon') expect(item.weaponType, item.id).toBeUndefined();
    }
  });

  it('les objets clés sont gratuits et invendables', () => {
    for (const item of items.filter((i) => i.kind === 'key')) {
      expect(item.price, item.id).toBe(0);
      expect(item.sellable, item.id).toBe(false);
    }
  });

  it('les armes réservées le sont à des héros qui peuvent les porter', () => {
    for (const item of items) {
      if (item.kind !== 'weapon' || !item.allowedHeroes) continue;
      for (const heroId of item.allowedHeroes) {
        const hero = heroes.find((h) => h.id === heroId);
        expect(hero?.weaponTypes, `${item.id} pour ${heroId}`).toContain(item.weaponType);
      }
    }
  });

  it('couvrent les 6 paliers pour chaque type d’arme', () => {
    const tiers = [4, 8, 14, 22, 30, 40];
    for (const type of ['epee', 'hache', 'marteau', 'arc', 'dague', 'baton', 'fleau']) {
      const attacks = items
        .filter((i) => i.kind === 'weapon' && i.weaponType === type)
        .map((i) => i.stats?.attack ?? 0);
      for (const tier of tiers) expect(attacks, `${type} palier ${tier}`).toContain(tier);
    }
  });

  it('contiennent les consommables et les matériaux de l’équilibrage', () => {
    const expected = [
      'herbe-soin',
      'grande-herbe',
      'baume',
      'eau-claire',
      'eau-vive',
      'antidote',
      'reveil',
      'plume-vie',
      'encens-calme',
      'elixir',
      'tourte-bertrand',
      'minerai-ocre',
      'minerai-rouge',
      'ecaille-salamandre',
      'plume-griffon',
      'cristal-givre',
      'soie-vent',
      'cendre-sacree',
      'perle-noire',
      'metal-legendaire',
      'fragment-accordeur',
      'marteau-aubin',
      'cle-terre',
      'cle-eau',
      'cle-vent',
      'cle-feu',
      'gant-accordeur',
      'monocle-accordeur',
      'carnet-marelle',
      'carte-epaves',
      'coquillage-mila',
      'pain-fete',
      'registre-cuivres',
      'sac-grain',
      'page-oren',
      'relique-copie',
    ];
    expect(expected.filter((id) => !itemIds.has(id))).toEqual([]);
  });

  it('contiennent les récompenses de quêtes et les armes ultimes', () => {
    const expected = [
      'anneau-vitalite',
      'arc-frene',
      'epee-ocre',
      'bottes-marines',
      'baton-savant',
      'amulette-calme',
      'bracelet-argent',
      'armure-nomades',
      'marteau-accordeurs',
      'arc-foyer',
      'baton-savants',
      'dagues-vent',
    ];
    expect(expected.filter((id) => !itemIds.has(id))).toEqual([]);
    for (const id of ['marteau-accordeurs', 'arc-foyer', 'baton-savants', 'dagues-vent']) {
      expect(itemsById.get(id)?.stats?.attack, id).toBe(55);
      expect(itemsById.get(id)?.allowedHeroes, id).toHaveLength(1);
    }
  });

  it('le Marteau d’Aubin est un marteau de palier 0 à +1, réservé à Kaël', () => {
    const marteau = itemsById.get('marteau-aubin');
    expect(marteau?.kind).toBe('weapon');
    expect(marteau?.weaponType).toBe('marteau');
    expect(marteau?.stats?.attack).toBe(5);
    expect(marteau?.allowedHeroes).toEqual(['kael']);
  });
});

describe('recettes', () => {
  it('produisent un objet existant à partir de matériaux existants', () => {
    for (const recipe of recipes) {
      expect(itemIds.has(recipe.result), recipe.id).toBe(true);
      for (const { item } of recipe.materials) {
        expect(itemsById.get(item)?.kind, `${recipe.id} : ${item}`).toBe('material');
      }
    }
  });

  it('sont entre 10 et 14 et ne produisent jamais deux fois le même objet', () => {
    expect(recipes.length).toBeGreaterThanOrEqual(10);
    expect(recipes.length).toBeLessThanOrEqual(14);
    const results = recipes.map((r) => r.result);
    expect(new Set(results).size).toBe(results.length);
  });

  it('les recettes avancées exigent un drapeau de fin d’acte', () => {
    const flags = new Set(recipes.map((r) => r.requiresFlag).filter(Boolean));
    expect(flags.has('m1_08_fini')).toBe(true);
    expect(flags.has('m2_07_fini')).toBe(true);
    expect(flags.has('m3_08_fini')).toBe(true);
  });
});

describe('boutiques', () => {
  it('vendent des objets existants, vendables et non clés', () => {
    for (const shop of shops) {
      for (const id of shop.items) {
        const item = itemsById.get(id);
        expect(item, `${shop.id} : ${id}`).toBeDefined();
        expect(item?.kind, `${shop.id} : ${id}`).not.toBe('key');
        expect(item?.price ?? 0, `${shop.id} : ${id}`).toBeGreaterThan(0);
      }
    }
  });

  it('comprennent les boutiques attendues avec leurs marchands', () => {
    const merchants = Object.fromEntries(shops.map((s) => [s.id, s.merchant]));
    expect(merchants).toMatchObject({
      'hautegrange-armurerie': 'gaspard',
      'hautegrange-epicerie': 'rosa',
      'port-lazuli-guilde': 'ottavio',
    });
    for (const id of [
      'port-lazuli-armurerie',
      'port-lazuli-epicerie',
      'valcourt-armurerie',
      'valcourt-epicerie',
      'ventelune-atelier',
      'oasis-marche',
    ]) {
      expect(merchants[id], id).toBeDefined();
    }
  });

  it('reprennent les répliques de Gaspard et Rosa du script', () => {
    const gaspard = shops.find((s) => s.id === 'hautegrange-armurerie');
    expect(gaspard?.lines.hello).toBe('Des lames, des boucliers, et du sérieux.');
    const rosa = shops.find((s) => s.id === 'hautegrange-epicerie');
    expect(rosa?.lines.bye).toBe('Prends soin de toi, mon grand !');
  });
});

describe('Résonances', () => {
  it('sont les 10 Résonances et les 6 Accords', () => {
    expect(resonances.map((r) => r.id).sort()).toEqual([...RESONANCE_IDS].sort());
  });

  it('ont le bon lanceur et les coûts du GDD', () => {
    const byId = new Map<string, ResonanceData>(resonances.map((r) => [r.id, r]));
    const expected: Record<string, [string | null, number]> = {
      poussee: ['kael', 1],
      racine: ['kael', 2],
      braise: ['nyra', 1],
      ecoute: ['kael', 1],
      givre: ['oren', 2],
      averse: ['oren', 3],
      prise: ['kael', 2],
      bourrasque: ['sefa', 2],
      envol: ['sefa', 3],
      revelation: ['kael', 1],
    };
    for (const [id, [owner, cost]] of Object.entries(expected)) {
      expect(byId.get(id)?.owner, id).toBe(owner);
      expect(byId.get(id)?.cost, id).toBe(cost);
    }
    for (const r of resonances) {
      if (r.accord) {
        expect(r.owner, r.id).toBeNull();
        expect(r.act, r.id).toBe(4);
      } else {
        expect(r.owner, r.id).not.toBeNull();
      }
      expect(r.icon).toBe(r.id);
    }
    expect(byId.get('poussee')?.range).toBe(6);
  });
});

describe('fragments d’histoire', () => {
  it('sont entre 12 et 16, avec titre et texte', () => {
    expect(lore.length).toBeGreaterThanOrEqual(12);
    expect(lore.length).toBeLessThanOrEqual(16);
    for (const entry of lore) {
      expect(entry.title.length).toBeGreaterThan(3);
      expect(entry.text.length).toBeGreaterThan(40);
    }
  });
});

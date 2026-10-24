import { describe, expect, it } from 'vitest';
import type { BanterData, DialogueScene, ItemData } from '../../src/data/types';
import { DataRegistry, getRegistry, loadRawGameData } from '../../src/data/registry';
import { HEROES, QUESTS } from './fixtures';

const HERBE: ItemData = {
  id: 'herbe-soin',
  name: 'Herbe de soin',
  kind: 'consumable',
  description: 'Soigne 50 PV.',
  price: 10,
  sellable: true,
  effect: { type: 'heal', amount: 50, targets: 'ally' },
  icon: 'herbe-soin',
  act: 1,
};

const SCENE: DialogueScene = {
  id: 'a1-s01-matin-brumeval',
  titre: 'Le matin à Brumeval',
  lignes: [{ perso: 'aubin', texte: 'Debout, l’apprenti !' }],
};

const BANTERS: BanterData[] = [
  { zone: 'brumeval', lignes: { kael: '…' } },
  { zone: 'bois', lignes: { kael: 'Ces racines ne sont pas normales.' } },
];

describe('DataRegistry', () => {
  const registry = new DataRegistry({
    heroes: HEROES,
    quests: QUESTS,
    items: [HERBE],
    scenes: [SCENE],
    banters: BANTERS,
  });

  it('indexe par identifiant', () => {
    expect(registry.getHero('kael').name).toBe('Kaël');
    expect(registry.getItem('herbe-soin').price).toBe(10);
    expect(registry.getQuest('m1-01').titre).toBe('Une matinée ordinaire');
    expect(registry.getScene('a1-s01-matin-brumeval').lignes).toHaveLength(1);
    expect(registry.allHeroes().map((h) => h.id)).toEqual(['kael', 'nyra']);
    expect(registry.allQuests()).toHaveLength(QUESTS.length);
  });

  it('lance une erreur claire pour un identifiant inconnu', () => {
    expect(() => registry.getHero('sefa')).toThrow('Héros inconnu : « sefa »');
    expect(() => registry.getEnemy('dragon')).toThrow(/Ennemi inconnu/);
    expect(() => registry.getLueur('gres')).toThrow(/Lueur inconnue|Lueur inconnu/);
    expect(() => registry.getMusic('titre')).toThrow(/Musique/);
    expect(() => registry.getNpc('aubin')).toThrow(/PNJ/);
    expect(() => registry.getCharacter('aubin')).toThrow(/Personnage/);
    expect(() => registry.getShop('x')).toThrow(/Boutique/);
    expect(() => registry.getRecipe('x')).toThrow(/Recette/);
    expect(() => registry.getSpell('x')).toThrow(/Sort/);
    expect(() => registry.getSummon('x')).toThrow(/Invocation/);
    expect(() => registry.getEncounter('x')).toThrow(/Groupe/);
    expect(() => registry.getResonance('poussee')).toThrow(/Résonance/);
    expect(() => registry.getLore('x')).toThrow(/Fragment/);
  });

  it('filtre les répliques d’équipe par zone', () => {
    expect(registry.bantersFor('bois')).toHaveLength(1);
    expect(registry.bantersFor('mine')).toEqual([]);
  });

  it('tolère les collections absentes', () => {
    const empty = new DataRegistry({});
    expect(empty.heroes.size).toBe(0);
    expect(empty.banters).toEqual([]);
    expect(() => empty.getHero('kael')).toThrow();
  });
});

describe('chargement réel via import.meta.glob', () => {
  it('renvoie des tableaux pour chaque collection, même si les fichiers manquent', () => {
    const raw = loadRawGameData();
    for (const value of Object.values(raw)) expect(Array.isArray(value)).toBe(true);
    const registry = getRegistry();
    expect(registry).toBe(getRegistry());
    expect(registry.heroes).toBeInstanceOf(Map);
  });
});

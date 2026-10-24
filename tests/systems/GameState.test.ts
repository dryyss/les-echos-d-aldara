import { describe, expect, it, vi } from 'vitest';
import type { GameStateData } from '../../src/data/types';
import { GameState } from '../../src/systems/GameState';
import { HEROES, KAEL, NYRA, newState } from './fixtures';

describe('GameState.newGame', () => {
  it('crée Kaël seul au niveau 1 avec son équipement de départ', () => {
    const state = newState();
    expect(state.partyIds()).toEqual(['kael']);
    const kael = state.getHero('kael');
    expect(kael).toMatchObject({ id: 'kael', level: 1, xp: 0, hp: 40, pr: 6 });
    expect(kael?.equipment).toEqual({
      weapon: 'marteau-apprenti',
      armor: 'tunique-cuir',
      shield: null,
      helmet: null,
      accessory: null,
    });
    expect(state.getHero('nyra')).toBeUndefined();
  });

  it('démarre avec 0 pièce, 3 herbes de soin, à la forge, acte 1, options par défaut', () => {
    const state = newState();
    expect(state.coins).toBe(0);
    expect(state.inventory).toEqual({ 'herbe-soin': 3 });
    expect(state.position).toEqual({ map: 'brumeval-forge', x: 4, y: 5, direction: 'down' });
    expect(state.act).toBe(1);
    expect(state.options).toEqual({
      musicVolume: 0.7,
      sfxVolume: 0.8,
      textSpeed: 'normal',
      showHints: true,
    });
    expect(state.resonances).toEqual([]);
    expect(state.shortcuts).toEqual([null, null]);
  });

  it('accepte des options partielles', () => {
    const state = GameState.newGame(HEROES, { textSpeed: 'rapide' });
    expect(state.options.textSpeed).toBe('rapide');
    expect(state.options.musicVolume).toBe(0.7);
  });

  it('refuse une liste de héros sans Kaël', () => {
    expect(() => GameState.newGame([NYRA])).toThrow(/kael/);
  });
});

describe('drapeaux', () => {
  it('pose, lit et retire un drapeau en émettant un événement', () => {
    const state = newState();
    const listener = vi.fn();
    state.events.on('flag', listener);
    state.setFlag('nyra_recrutee');
    expect(state.hasFlag('nyra_recrutee')).toBe(true);
    state.clearFlag('nyra_recrutee');
    expect(state.hasFlag('nyra_recrutee')).toBe(false);
    expect(listener).toHaveBeenNthCalledWith(1, { flag: 'nyra_recrutee', value: true });
    expect(listener).toHaveBeenNthCalledWith(2, { flag: 'nyra_recrutee', value: false });
    state.clearFlag('inconnu');
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('objets et pièces', () => {
  it('ajoute et retire des objets', () => {
    const state = newState();
    const listener = vi.fn();
    state.events.on('item', listener);
    state.addItem('minerai-rouge', 2);
    expect(state.countItem('minerai-rouge')).toBe(2);
    expect(state.hasItem('minerai-rouge', 2)).toBe(true);
    expect(state.removeItem('minerai-rouge', 3)).toBe(false);
    expect(state.removeItem('minerai-rouge', 2)).toBe(true);
    expect(state.countItem('minerai-rouge')).toBe(0);
    expect(state.inventory).not.toHaveProperty('minerai-rouge');
    expect(listener).toHaveBeenLastCalledWith({ item: 'minerai-rouge', count: 0, delta: -2 });
  });

  it('gère les pièces', () => {
    const state = newState();
    state.addCoins(25);
    expect(state.spendCoins(30)).toBe(false);
    expect(state.spendCoins(10)).toBe(true);
    expect(state.coins).toBe(15);
    expect(state.loseHalfCoins()).toBe(8);
    expect(state.coins).toBe(7);
    state.spendCoins(7);
    expect(state.loseHalfCoins()).toBe(0);
  });
});

describe('équipe', () => {
  it('recrute Nyra au niveau moyen de l’équipe avec sa Lueur de départ', () => {
    const state = newState();
    state.updateHero('kael', { level: 5 });
    const party = vi.fn();
    state.events.on('party', party);
    state.recruit('nyra', NYRA);
    const nyra = state.getHero('nyra');
    expect(nyra).toMatchObject({ level: 5, hp: 46, pr: 10 });
    expect(nyra?.equipment.weapon).toBe('arc-court');
    expect(state.partyIds()).toEqual(['kael', 'nyra']);
    expect(state.isInParty('nyra')).toBe(true);
    expect(state.lueurs.tison).toEqual({ found: true, hero: 'nyra', state: 'liee' });
    expect(party).toHaveBeenCalledWith({ party: ['kael', 'nyra'], added: 'nyra', removed: null });
    state.recruit('nyra', NYRA);
    expect(state.partyIds()).toEqual(['kael', 'nyra']);
  });

  it('un héros qui quitte l’équipe garde sa progression', () => {
    const state = newState();
    state.recruit('nyra', NYRA);
    state.updateHero('nyra', { level: 7 });
    state.leaveParty('nyra');
    expect(state.isInParty('nyra')).toBe(false);
    expect(state.getHero('nyra')?.level).toBe(7);
    state.recruit('nyra', NYRA);
    expect(state.getHero('nyra')?.level).toBe(7);
  });

  it('healAll remet PV et PR au maximum (calculé ou fourni)', () => {
    const state = newState();
    state.updateHero('kael', { hp: 3, pr: 0, level: 3, permanentBonus: { hp: 5 } });
    state.healAll();
    // 40 + 4 × 2 = 48, plus 5 de bonus permanent ; PR 6 + 0,5 × 2 = 7.
    expect(state.getHero('kael')).toMatchObject({ hp: 53, pr: 7 });
    state.updateHero('kael', { hp: 1, pr: 1 });
    state.healAll({ kael: { hp: 99, pr: 12 } });
    expect(state.getHero('kael')).toMatchObject({ hp: 99, pr: 12 });
  });

  it('updateHero ignore un héros inconnu', () => {
    const state = newState();
    expect(state.updateHero('sefa', { level: 2 })).toBeUndefined();
  });
});

describe('Lueurs', () => {
  it('trouve, assigne et change l’état d’une Lueur', () => {
    const state = newState();
    const listener = vi.fn();
    state.events.on('lueur', listener);
    state.findLueur('gres');
    state.findLueur('gres');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(state.isLueurFound('gres')).toBe(true);
    expect(state.lueurs.gres).toEqual({ found: true, hero: null, state: 'liee' });
    expect(state.assignLueur('gres', 'nyra')).toBe(false);
    expect(state.assignLueur('inconnue', 'kael')).toBe(false);
    expect(state.assignLueur('gres', 'kael')).toBe(true);
    expect(state.lueursOf('kael')).toEqual(['gres']);
    expect(state.linkedLueurIds('kael')).toEqual(['gres']);
    expect(state.setLueurState('gres', 'repos')).toBe(true);
    expect(state.linkedLueurIds('kael')).toEqual([]);
    expect(state.lueursOf('kael')).toEqual(['gres']);
    expect(state.assignLueur('gres', null)).toBe(true);
    expect(state.lueursOf('kael')).toEqual([]);
  });

  it('pose lueurs_27 à la 27e Lueur trouvée, Prisme non comptée', () => {
    const state = newState();
    state.findLueur('prisme');
    for (let i = 1; i <= 26; i += 1) state.findLueur(`lueur-${i}`);
    expect(state.foundLueurCount()).toBe(26);
    expect(state.hasFlag('lueurs_27')).toBe(false);
    state.findLueur('lueur-27');
    expect(state.foundLueurCount()).toBe(27);
    expect(state.hasFlag('lueurs_27')).toBe(true);
  });
});

describe('Résonances', () => {
  it('apprend une Résonance et gère les raccourcis', () => {
    const state = newState();
    const listener = vi.fn();
    state.events.on('resonance', listener);
    expect(state.learnResonance('poussee')).toBe(true);
    expect(state.learnResonance('poussee')).toBe(false);
    expect(state.hasResonance('poussee')).toBe(true);
    expect(state.setShortcut(0, 'ecoute')).toBe(false);
    expect(state.setShortcut(1, 'poussee')).toBe(true);
    expect(state.shortcuts).toEqual([null, 'poussee']);
    expect(state.setShortcut(1, null)).toBe(true);
    expect(listener).toHaveBeenNthCalledWith(1, {
      resonances: ['poussee'],
      learned: 'poussee',
      shortcuts: [null, null],
    });
  });
});

describe('pas, PR et rencontres', () => {
  const maxPr = { kael: 6, nyra: 8 };

  it('rend 1 PR tous les 4 pas aux héros sous leur maximum', () => {
    const state = newState();
    state.recruit('nyra', NYRA);
    state.updateHero('kael', { pr: 2 });
    const results = [1, 2, 3].map(() => state.addStep({ maxPr, encounter: null }));
    expect(results.every((r) => r.prRecharged.length === 0)).toBe(true);
    const fourth = state.addStep({ maxPr, encounter: null });
    expect(fourth.prRecharged).toEqual(['kael']);
    expect(state.getHero('kael')?.pr).toBe(3);
    expect(state.getHero('nyra')?.pr).toBe(8);
  });

  it('tire une rencontre quand le seuil est atteint, selon le rng', () => {
    const state = newState();
    const walk = (rng: () => number) => {
      let steps = 0;
      for (;;) {
        steps += 1;
        if (state.addStep({ maxPr, encounter: { min: 3, max: 5 }, rng }).encounter) return steps;
        if (steps > 50) throw new Error('aucune rencontre');
      }
    };
    expect(walk(() => 0)).toBe(3);
    expect(walk(() => 0.999)).toBe(5);
    expect(walk(() => 0)).toBe(3);
  });

  it('l’Encens de calme bloque les rencontres et décroît', () => {
    const state = newState();
    state.addRepelSteps(2);
    const rng = () => 0;
    const range = { min: 1, max: 1 };
    expect(state.addStep({ maxPr, encounter: range, rng }).encounter).toBe(false);
    expect(state.repelSteps).toBe(1);
    expect(state.addStep({ maxPr, encounter: range, rng }).encounter).toBe(false);
    expect(state.repelSteps).toBe(0);
    expect(state.addStep({ maxPr, encounter: range, rng }).encounter).toBe(true);
  });

  it('ne tire jamais de rencontre sans bornes', () => {
    const state = newState();
    for (let i = 0; i < 100; i += 1) {
      expect(state.addStep({ maxPr }).encounter).toBe(false);
    }
  });

  it('dépense des PR pour une Résonance', () => {
    const state = newState();
    expect(state.useResonancePr('kael', 7)).toBe(false);
    expect(state.useResonancePr('kael', 2)).toBe(true);
    expect(state.getHero('kael')?.pr).toBe(4);
    expect(state.useResonancePr('nyra', 1)).toBe(false);
  });
});

describe('cartes, lore, temps, missions', () => {
  it('mémorise l’état des cartes', () => {
    const state = newState();
    const listener = vi.fn();
    state.events.on('mapState', listener);
    expect(state.getMapState('brumeval', 'coffre-1')).toBeUndefined();
    state.setMapState('brumeval', 'coffre-1', true);
    state.setMapState('brumeval', 'porte', 'ouverte');
    expect(state.getMapState('brumeval', 'coffre-1')).toBe(true);
    expect(state.getMapState('brumeval', 'porte')).toBe('ouverte');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('collecte le lore une seule fois et cumule le temps de jeu', () => {
    const state = newState();
    expect(state.addLore('accordeurs-1')).toBe(true);
    expect(state.addLore('accordeurs-1')).toBe(false);
    expect(state.lore).toEqual(['accordeurs-1']);
    state.addPlayTime(1500);
    state.addPlayTime(-10);
    expect(state.playTimeMs).toBe(1500);
    state.setAct(2);
    expect(state.act).toBe(2);
    state.setPosition({ map: 'brumeval', x: 1, y: 2, direction: 'up' });
    expect(state.position).toEqual({ map: 'brumeval', x: 1, y: 2, direction: 'up' });
  });

  it('écrit la progression des missions et émet quest', () => {
    const state = newState();
    const listener = vi.fn();
    state.events.on('quest', listener);
    state.setQuestProgress('m1-01', { status: 'active', task: 0, counts: {} });
    expect(state.getQuestProgress('m1-01')).toEqual({ status: 'active', task: 0, counts: {} });
    state.setQuestProgress('m1-01', null);
    expect(state.getQuestProgress('m1-01')).toBeUndefined();
    expect(listener).toHaveBeenLastCalledWith({ quest: 'm1-01', progress: null });
  });
});

describe('conditions', () => {
  function richState(): GameState {
    const state = newState();
    state.setFlag('attaque_brumeval');
    state.addItem('minerai-ocre', 2);
    state.addCoins(50);
    state.learnResonance('poussee');
    state.findLueur('gres');
    state.setQuestProgress('m1-01', { status: 'active', task: 2, counts: {} });
    state.setQuestProgress('annexe-chat-lila', { status: 'done', task: 2, counts: {} });
    state.setMapState('brumeval-forge', 'coffre', true);
    state.setMapState('brumeval', 'porte', 'ouverte');
    return state;
  }

  it('évalue chaque forme de condition', () => {
    const state = richState();
    expect(state.evaluate({ flag: 'attaque_brumeval' })).toBe(true);
    expect(state.evaluate({ flag: 'attaque_brumeval', is: false })).toBe(false);
    expect(state.evaluate({ flag: 'inconnu', is: false })).toBe(true);
    expect(state.evaluate({ item: 'minerai-ocre' })).toBe(true);
    expect(state.evaluate({ item: 'minerai-ocre', min: 3 })).toBe(false);
    expect(state.evaluate({ hero: 'kael' })).toBe(true);
    expect(state.evaluate({ hero: 'nyra' })).toBe(false);
    expect(state.evaluate({ resonance: 'poussee' })).toBe(true);
    expect(state.evaluate({ resonance: 'ecoute' })).toBe(false);
    expect(state.evaluate({ quest: 'm1-01', status: 'active' })).toBe(true);
    expect(state.evaluate({ quest: 'annexe-chat-lila', status: 'done' })).toBe(true);
    expect(state.evaluate({ quest: 'm1-02', status: 'none' })).toBe(true);
    expect(state.evaluate({ questTask: 'm1-01', task: 2 })).toBe(true);
    expect(state.evaluate({ questTask: 'm1-01', task: 1 })).toBe(false);
    expect(state.evaluate({ questTask: 'annexe-chat-lila', task: 2 })).toBe(false);
    expect(state.evaluate({ lueur: 'gres' })).toBe(true);
    expect(state.evaluate({ lueur: 'tison' })).toBe(false);
    expect(state.evaluate({ coins: 50 })).toBe(true);
    expect(state.evaluate({ coins: 51 })).toBe(false);
    expect(state.evaluate({ mapState: 'coffre', is: true })).toBe(true);
    expect(state.evaluate({ mapState: 'brumeval:porte', is: 'ouverte' })).toBe(true);
    expect(state.evaluate({ mapState: 'brumeval:porte', is: 'fermee' })).toBe(false);
  });

  it('combine not, all et any', () => {
    const state = richState();
    expect(state.evaluate({ not: { hero: 'nyra' } })).toBe(true);
    expect(state.evaluate({ all: [{ flag: 'attaque_brumeval' }, { coins: 10 }] })).toBe(true);
    expect(state.evaluate({ all: [{ flag: 'attaque_brumeval' }, { coins: 999 }] })).toBe(false);
    expect(state.evaluate({ any: [{ hero: 'nyra' }, { lueur: 'gres' }] })).toBe(true);
    expect(state.evaluate({ any: [] })).toBe(false);
    expect(state.evaluate({ all: [] })).toBe(true);
  });
});

describe('sérialisation', () => {
  it('toData renvoie une copie profonde indépendante', () => {
    const state = newState();
    const data = state.toData();
    data.inventory['herbe-soin'] = 99;
    data.party.push('nyra');
    expect(state.countItem('herbe-soin')).toBe(3);
    expect(state.partyIds()).toEqual(['kael']);
  });

  it('fromData restitue le même état', () => {
    const state = newState();
    state.recruit('nyra', NYRA);
    state.addCoins(42);
    state.setFlag('nyra_recrutee');
    state.learnResonance('braise');
    state.setShortcut(0, 'braise');
    state.setMapState('mine-ocre-1', 'coffre', true);
    state.setQuestProgress('m1-05', { status: 'done', task: 1, counts: {} });
    const restored = GameState.fromData(state.toData(), HEROES);
    expect(restored.toData()).toEqual(state.toData());
  });

  it('fromData complète les champs manquants d’une ancienne sauvegarde', () => {
    const partial = {
      party: ['kael'],
      heroes: { kael: newState().getHero('kael') },
      coins: 5,
    } as unknown as GameStateData;
    const state = GameState.fromData(partial, [KAEL]);
    expect(state.coins).toBe(5);
    expect(state.inventory).toEqual({});
    expect(state.options.sfxVolume).toBe(0.8);
    expect(state.shortcuts).toEqual([null, null]);
    expect(state.position.map).toBe('brumeval-forge');
    expect(state.act).toBe(1);
  });
});

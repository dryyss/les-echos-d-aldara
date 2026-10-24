import { describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../src/systems/GameState';
import { mainQuestDoneFlag, QuestManager } from '../../src/systems/QuestManager';
import { ANNEXE_MINERAI, newState, QUESTS } from './fixtures';

function setup(): { state: GameState; quests: QuestManager } {
  const state = newState();
  return { state, quests: new QuestManager(state, QUESTS) };
}

describe('mainQuestDoneFlag', () => {
  it('convertit l’identifiant en drapeau', () => {
    expect(mainQuestDoneFlag('m1-01')).toBe('m1_01_fini');
    expect(mainQuestDoneFlag('m4-08')).toBe('m4_08_fini');
  });
});

describe('démarrage', () => {
  it('démarre une mission une seule fois', () => {
    const { quests } = setup();
    const started = vi.fn();
    quests.events.on('started', started);
    expect(quests.start('m1-01')).toBe(true);
    expect(quests.start('m1-01')).toBe(false);
    expect(quests.start('inconnue')).toBe(false);
    expect(quests.isActive('m1-01')).toBe(true);
    expect(quests.currentTask('m1-01')?.cible).toBe('aubin');
    expect(started).toHaveBeenCalledTimes(1);
  });

  it('refuse une mission dont les prérequis manquent', () => {
    const { state, quests } = setup();
    expect(quests.start('annexe-chat-lila')).toBe(false);
    state.setFlag('m1_01_fini');
    expect(quests.start('annexe-chat-lila')).toBe(true);
  });

  it('liste les missions disponibles selon les prérequis', () => {
    const { state, quests } = setup();
    const before = quests.availableQuests().map((q) => q.id);
    expect(before).not.toContain('annexe-chat-lila');
    expect(before).not.toContain('lueur-moulin');
    expect(before).toContain('m1-01');
    state.setFlag('m1_01_fini');
    expect(quests.availableQuests().map((q) => q.id)).toContain('annexe-chat-lila');
    quests.start('m1-01');
    expect(quests.availableQuests().map((q) => q.id)).not.toContain('m1-01');
  });
});

describe('chaîne m1-01 → m1-02 → m1-03', () => {
  it('valide les tâches dans l’ordre avec les déclencheurs et enchaîne les missions', () => {
    const { state, quests } = setup();
    const xp = vi.fn();
    const completed = vi.fn();
    quests.events.on('xpReward', xp);
    quests.events.on('completed', completed);
    quests.start('m1-01');

    // Un déclencheur hors ordre ne fait rien.
    expect(quests.onReachMap('brumeval')).toEqual([]);
    expect(quests.onTalk('aubin')).toEqual(['m1-01']);
    expect(quests.onReachMap('brumeval')).toEqual(['m1-01']);
    expect(quests.onPuzzleSolved('brumeval-caisses-lila')).toEqual(['m1-01']);
    // Livrer sans l'objet ne valide pas.
    expect(quests.onDeliver('aubin', 'minerai-ocre')).toEqual([]);
    state.addItem('minerai-ocre');
    expect(quests.onDeliver('aubin', 'minerai-ocre')).toEqual(['m1-01']);

    expect(quests.isDone('m1-01')).toBe(true);
    expect(state.hasFlag('m1_01_fini')).toBe(true);
    expect(state.hasResonance('poussee')).toBe(true);
    expect(xp).toHaveBeenCalledWith({ quest: 'm1-01', amount: 30 });
    expect(completed).toHaveBeenCalledWith({ quest: 'm1-01' });
    expect(quests.isActive('m1-02')).toBe(true);
    expect(quests.currentTask('m1-02')?.type).toBe('aller');
  });

  it('compte 3 villageois distincts puis termine m1-02 avec son drapeau de fin', () => {
    const { state, quests } = setup();
    quests.start('m1-02');
    quests.onReachMap('brumeval');
    const villagers = ['brumeval-villageois'];
    expect(quests.onTalk('bertrand', villagers)).toEqual([]);
    expect(quests.onTalk('bertrand', villagers)).toEqual([]);
    expect(quests.onTalk('margot', villagers)).toEqual([]);
    expect(state.getQuestProgress('m1-02')?.counts).toEqual({
      'brumeval-villageois/bertrand': 1,
      'brumeval-villageois/margot': 1,
    });
    expect(quests.onTalk('joss', villagers)).toEqual(['m1-02']);
    expect(quests.currentTask('m1-02')?.cible).toBe('aubin');
    expect(quests.onTalk('aubin')).toEqual(['m1-02']);
    expect(quests.onListen('caillou')).toEqual(['m1-02']);
    expect(quests.isDone('m1-02')).toBe(true);
    expect(state.hasFlag('secret_aubin_revele')).toBe(true);
    expect(state.hasFlag('m1_02_fini')).toBe(true);
    expect(state.hasResonance('ecoute')).toBe(true);
    expect(quests.isActive('m1-03')).toBe(true);
  });

  it('m1-03 : combat gagné, objets et XP', () => {
    const { state, quests } = setup();
    const xp = vi.fn();
    quests.events.on('xpReward', xp);
    quests.start('m1-03');
    quests.onReachMap('brumeval');
    expect(quests.onBattleWon('a1-sbires-place')).toEqual(['m1-03']);
    expect(quests.isDone('m1-03')).toBe(true);
    expect(state.countItem('marteau-aubin')).toBe(1);
    expect(xp).toHaveBeenCalledWith({ quest: 'm1-03', amount: 50 });
    expect(quests.activeQuests()).toEqual([]);
  });
});

describe('autres déclencheurs', () => {
  it('trouver : valide quand la quantité est atteinte', () => {
    const { state, quests } = setup();
    quests.start(ANNEXE_MINERAI.id);
    state.addItem('minerai-rouge', 3);
    expect(quests.onItemChanged('minerai-rouge')).toEqual([]);
    expect(state.getQuestProgress(ANNEXE_MINERAI.id)?.counts).toEqual({ 'minerai-rouge': 3 });
    state.addItem('minerai-rouge', 2);
    expect(quests.onItemChanged('minerai-rouge')).toEqual([ANNEXE_MINERAI.id]);
    expect(quests.currentTask(ANNEXE_MINERAI.id)?.type).toBe('livrer');
    expect(quests.onDeliver('aubin', 'minerai-rouge')).toEqual([ANNEXE_MINERAI.id]);
    expect(state.coins).toBe(80);
    expect(state.hasFlag('annexe_minerai_rouge_fini')).toBe(false);
  });

  it('vaincre avec quantité compte les combats', () => {
    const { state, quests } = setup();
    quests.start('annexe-loups');
    expect(quests.onBattleWon('collines-1')).toEqual([]);
    expect(state.getQuestProgress('annexe-loups')?.counts).toEqual({ 'collines-1': 1 });
    expect(quests.onBattleWon('collines-2')).toEqual([]);
    expect(quests.onBattleWon('collines-1')).toEqual(['annexe-loups']);
    expect(quests.isDone('annexe-loups')).toBe(true);
  });

  it('choisir : la cible est le drapeau', () => {
    const { quests } = setup();
    quests.start('annexe-choix');
    expect(quests.onFlag('jumeaux_tues')).toEqual([]);
    expect(quests.onFlag('jumeaux_epargnes')).toEqual(['annexe-choix']);
  });

  it('récompenses équipe et Lueur', () => {
    const { state, quests } = setup();
    const recruit = vi.fn();
    quests.events.on('recruitRequest', recruit);
    quests.start('m1-05');
    quests.onBattleWon('a1-nyra-duel');
    expect(recruit).toHaveBeenCalledWith({ quest: 'm1-05', hero: 'nyra' });
    expect(state.isLueurFound('tison')).toBe(true);
    expect(state.hasFlag('m1_05_fini')).toBe(true);
  });

  it('completeTask refuse un index qui n’est pas la tâche courante', () => {
    const { quests } = setup();
    quests.start('m1-01');
    expect(quests.completeTask('m1-01', 1)).toBe(false);
    expect(quests.completeTask('m1-01', 0)).toBe(true);
    expect(quests.completeTask('m1-01', 0)).toBe(false);
    expect(quests.completeTask('m1-02', 0)).toBe(false);
  });

  it('complete termine une mission d’un coup', () => {
    const { state, quests } = setup();
    quests.start('m1-01');
    expect(quests.complete('m1-01')).toBe(true);
    expect(quests.isDone('m1-01')).toBe(true);
    expect(state.hasResonance('poussee')).toBe(true);
    expect(quests.complete('m1-01')).toBe(false);
  });
});

describe('journal', () => {
  it('trie principales, annexes puis Lueurs et ne montre que la tâche suivante', () => {
    const { state, quests } = setup();
    state.setFlag('m1_04_fini');
    quests.start('lueur-moulin');
    quests.start('annexe-minerai-rouge');
    quests.start('m1-02');
    quests.start('m1-01');
    quests.onTalk('aubin');

    const summary = quests.summary();
    expect(summary.map((q) => q.id)).toEqual([
      'm1-01',
      'm1-02',
      'annexe-minerai-rouge',
      'lueur-moulin',
    ]);
    const m101 = summary[0];
    expect(m101).toMatchObject({ titre: 'Une matinée ordinaire', status: 'active', zone: 'brumeval' });
    expect(m101?.tasks).toEqual([
      { index: 0, texte: 'Parler à Maître Aubin dans la forge', done: true },
      { index: 1, texte: 'Aller chercher le minerai au fond du village', done: false },
    ]);
    expect(summary[1]?.tasks).toHaveLength(1);
  });

  it('les Souvenirs listent les missions finies avec toutes leurs tâches cochées', () => {
    const { quests } = setup();
    quests.start('m1-03');
    quests.complete('m1-03');
    expect(quests.completedQuests().map((q) => q.id)).toEqual(['m1-03']);
    const done = quests.summary('done');
    expect(done).toHaveLength(1);
    expect(done[0]?.status).toBe('done');
    expect(done[0]?.tasks.every((t) => t.done)).toBe(true);
    expect(done[0]?.tasks).toHaveLength(2);
    expect(quests.summary()).toEqual([]);
  });
});

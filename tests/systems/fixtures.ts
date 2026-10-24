/**
 * Fixtures des tests des systèmes : héros, missions et fichiers de sauvegarde
 * de test. Indépendantes des JSON de data/ (écrits par d'autres agents).
 */
import type { User } from '@supabase/supabase-js';
import type { GameStateData, HeroData, QuestData, SaveFile } from '../../src/data/types';
import { GameState } from '../../src/systems/GameState';
import type { StorageLike } from '../../src/systems/save/SaveBackend';

// --- Héros -----------------------------------------------------------------

export const KAEL: HeroData = {
  id: 'kael',
  name: 'Kaël',
  element: 'terre',
  age: 17,
  description: 'Apprenti forgeron de Brumeval.',
  baseStats: { hp: 40, pr: 6, attack: 8, defense: 7, speed: 5, luck: 3 },
  growth: { hp: 4, pr: 0.5, attack: 1.2, defense: 1, speed: 0.8, luck: 0.4 },
  basePower: { terre: 10, feu: 0, eau: 0, vent: 0 },
  baseResistance: { terre: 10, feu: 0, eau: 0, vent: 0 },
  weaponTypes: ['epee', 'hache', 'marteau'],
  spells: [{ spell: 'eclat-de-roche', level: 1 }],
  classes: {
    base: 'Apprenti',
    pure: ['Gardien', 'Paladin'],
    hybrid: { terre: 'Gardien', feu: 'Briseur', eau: 'Druide', vent: 'Rôdeur' },
    accordeur: 'Accordeur',
  },
  startingLueur: null,
  startingEquipment: { weapon: 'marteau-apprenti', armor: 'tunique-cuir' },
  sprite: 'kael',
  battleSprite: 'kael-combat',
  portrait: 'kael',
  voice: { pitch: 260, wave: 'square', length: 40 },
};

export const NYRA: HeroData = {
  ...KAEL,
  id: 'nyra',
  name: 'Nyra',
  element: 'feu',
  age: 19,
  description: 'Chasseresse traquée comme « sorcière de feu ».',
  baseStats: { hp: 34, pr: 8, attack: 10, defense: 5, speed: 7, luck: 4 },
  growth: { hp: 3, pr: 0.6, attack: 1.5, defense: 0.7, speed: 1, luck: 0.5 },
  basePower: { terre: 0, feu: 12, eau: 0, vent: 0 },
  baseResistance: { terre: 0, feu: 10, eau: 0, vent: 0 },
  weaponTypes: ['arc', 'dague'],
  spells: [{ spell: 'flammeche', level: 1 }],
  startingLueur: 'tison',
  startingEquipment: { weapon: 'arc-court' },
  sprite: 'nyra',
  battleSprite: 'nyra-combat',
  portrait: 'nyra',
  voice: { pitch: 380, wave: 'square', length: 35 },
};

export const HEROES: HeroData[] = [KAEL, NYRA];

// --- Missions ---------------------------------------------------------------

export const M1_01: QuestData = {
  id: 'm1-01',
  type: 'principale',
  acte: 1,
  titre: 'Une matinée ordinaire',
  resume: 'Aubin veut du minerai. Une journée comme les autres, en principe.',
  taches: [
    { type: 'parler', cible: 'aubin', texte: 'Parler à Maître Aubin dans la forge' },
    { type: 'aller', cible: 'brumeval', texte: 'Aller chercher le minerai au fond du village' },
    { type: 'resoudre', cible: 'brumeval-caisses-lila', texte: 'Aider Lila, coincée derrière des caisses' },
    { type: 'livrer', cible: 'aubin', texte: 'Rapporter le minerai à Aubin', quantite: 1 },
  ],
  recompenses: { resonance: 'poussee', xp: 30 },
  suivante: 'm1-02',
  zone: 'brumeval',
};

export const M1_02: QuestData = {
  id: 'm1-02',
  type: 'principale',
  acte: 1,
  titre: 'Le secret d’Aubin',
  resume: 'Aubin veut me parler au sanctuaire, ce soir, pendant la fête.',
  taches: [
    { type: 'aller', cible: 'brumeval', texte: 'Rejoindre la fête des moissons sur la place' },
    { type: 'parler', cible: 'brumeval-villageois', texte: 'Parler à 3 villageois', quantite: 3 },
    { type: 'parler', cible: 'aubin', texte: 'Retrouver Aubin au sanctuaire' },
    { type: 'ecouter', cible: 'caillou', texte: 'Utiliser Écoute sur Caillou' },
  ],
  recompenses: { resonance: 'ecoute' },
  suivante: 'm1-03',
  drapeauFin: 'secret_aubin_revele',
  zone: 'brumeval',
};

export const M1_03: QuestData = {
  id: 'm1-03',
  type: 'principale',
  acte: 1,
  titre: 'La nuit des masques',
  resume: 'Des hommes masqués de cuivre encerclent le village.',
  taches: [
    { type: 'aller', cible: 'brumeval', texte: 'Rejoindre la place attaquée par l’Ordre' },
    { type: 'vaincre', cible: 'a1-sbires-place', texte: 'Vaincre 2 sbires de l’Ordre' },
  ],
  recompenses: { xp: 50, objets: [{ id: 'marteau-aubin', quantite: 1 }] },
  zone: 'brumeval',
};

export const M1_05: QuestData = {
  id: 'm1-05',
  type: 'principale',
  acte: 1,
  titre: 'La sorcière de feu',
  resume: 'Des chasseurs traquent une sorcière de feu dans la forêt.',
  taches: [{ type: 'vaincre', cible: 'a1-nyra-duel', texte: 'Affronter la sorcière de feu' }],
  recompenses: { equipe: 'nyra', lueur: 'tison' },
  zone: 'hautegrange',
};

export const ANNEXE_CHAT: QuestData = {
  id: 'annexe-chat-lila',
  type: 'annexe',
  acte: 1,
  titre: 'Le chat de Lila',
  resume: 'Le chat de Lila a disparu. Les animaux du village savent peut-être où.',
  prerequis: ['m1_01_fini'],
  taches: [
    { type: 'ecouter', cible: 'chat-lila', texte: 'Écouter les animaux pour retrouver le chat' },
    { type: 'resoudre', cible: 'brumeval-toit-chat', texte: 'Faire descendre le chat du toit' },
  ],
  recompenses: { objets: [{ id: 'herbe-soin', quantite: 3 }] },
  drapeauFin: 'chat_lila_retrouve',
  zone: 'brumeval',
};

export const ANNEXE_MINERAI: QuestData = {
  id: 'annexe-minerai-rouge',
  type: 'annexe',
  acte: 1,
  titre: 'Le minerai rouge',
  resume: 'Cinq minerais rouges cachés dans la mine. Une belle épée à la clé.',
  taches: [
    { type: 'trouver', cible: 'minerai-rouge', texte: 'Trouver 5 minerais rouges', quantite: 5 },
    { type: 'livrer', cible: 'aubin', texte: 'Rapporter le minerai à la forge', quantite: 5 },
  ],
  recompenses: { pieces: 80 },
  zone: 'mine',
};

export const ANNEXE_CHOIX: QuestData = {
  id: 'annexe-choix',
  type: 'annexe',
  acte: 4,
  titre: 'Les jumeaux',
  resume: 'Épargner Ilse et Corvo, ou non.',
  taches: [{ type: 'choisir', cible: 'jumeaux_epargnes', texte: 'Décider du sort des jumeaux' }],
};

export const ANNEXE_LOUPS: QuestData = {
  id: 'annexe-loups',
  type: 'annexe',
  acte: 1,
  titre: 'Les loups des collines',
  resume: 'Deux meutes rôdent sur le sentier.',
  taches: [{ type: 'vaincre', cible: 'collines-1', texte: 'Vaincre 2 groupes de loups', quantite: 2 }],
  recompenses: { pieces: 20 },
};

export const LUEUR_MOULIN: QuestData = {
  id: 'lueur-moulin',
  type: 'lueur',
  acte: 1,
  titre: 'La Lueur du moulin',
  resume: 'Quelque chose brille en haut du moulin.',
  prerequis: ['m1_04_fini'],
  taches: [{ type: 'resoudre', cible: 'brumeval-moulin', texte: 'Faire pousser une liane sur le moulin' }],
  recompenses: { lueur: 'mousse' },
  zone: 'brumeval',
};

export const QUESTS: QuestData[] = [
  LUEUR_MOULIN,
  ANNEXE_CHAT,
  M1_03,
  M1_01,
  ANNEXE_MINERAI,
  M1_02,
  M1_05,
  ANNEXE_CHOIX,
  ANNEXE_LOUPS,
];

// --- Aides -------------------------------------------------------------------

export function newState(): GameState {
  return GameState.newGame(HEROES);
}

export function makeSaveFile(slot: number, updatedAt: string, patch: Partial<SaveFile> = {}): SaveFile {
  const state: GameStateData = newState().toData();
  return {
    saveVersion: 1,
    slot,
    createdAt: updatedAt,
    updatedAt,
    summary: {
      slot,
      act: 1,
      locationName: 'Brumeval',
      partyLevel: 1,
      playTimeMs: 0,
      updatedAt,
      heroes: ['kael'],
    },
    state,
    ...patch,
  };
}

/** Faux localStorage pour les tests. */
export class FakeStorage implements StorageLike {
  readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

export function fakeUser(patch: Partial<User> = {}): User {
  return {
    id: 'user-1',
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00.000Z',
    email: 'kael@brumeval.test',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    is_anonymous: false,
    ...patch,
  };
}

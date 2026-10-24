import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  VOICE_PITCH_VARIATION,
  playSfx,
  sfxRepeatFrequencies,
  validateSfx,
  voiceBlip,
  voiceBlipFrequency,
} from '../../../src/systems/audio/sfx';
import type { SfxDef } from '../../../src/systems/audio/sfx';
import { Synth } from '../../../src/systems/audio/Synth';
import { FakeAudioContext } from './fakeAudioContext';

const SFX_PATH = join(__dirname, '..', '..', '..', 'data', 'audio', 'sfx.json');

/** Liste de la section « Bruitages attendus » de docs/technique/format-audio.md. */
const EXPECTED_SFX = [
  'poussee', 'racine', 'braise', 'ecoute', 'ecoute-bloquee', 'givre', 'averse', 'prise',
  'bourrasque', 'envol', 'revelation', 'accord',
  'pas', 'pas-herbe', 'pas-bois', 'pas-eau', 'porte', 'coffre', 'objet', 'lueur-trouvee',
  'sauvegarde', 'warp', 'bloque', 'pousser', 'chute', 'puzzle-ok', 'puzzle-erreur', 'secret',
  'menu-deplacer', 'menu-valider', 'menu-annuler', 'menu-ouvrir', 'menu-fermer', 'texte-bip',
  'achat', 'pieces',
  'combat-debut', 'coup', 'coup-critique', 'esquive', 'sort-feu', 'sort-eau', 'sort-terre',
  'sort-vent', 'soin', 'poison', 'sommeil', 'etourdi', 'ko', 'lueur-liberee', 'invocation',
  'niveau', 'fuite', 'victoire-court',
  'cloche', 'onde-diapason', 'tremblement', 'verre-brise', 'tonnerre', 'vague', 'chaines',
];

function loadSfx(): Record<string, SfxDef> {
  return JSON.parse(readFileSync(SFX_PATH, 'utf8')) as Record<string, SfxDef>;
}

describe('data/audio/sfx.json', () => {
  it('a une structure valide', () => {
    expect(validateSfx(loadSfx())).toEqual([]);
  });

  it('contient tous les bruitages attendus par la spec', () => {
    const defs = loadSfx();
    const missing = EXPECTED_SFX.filter((id) => !(id in defs));
    expect(missing).toEqual([]);
    expect(Object.keys(defs)).toHaveLength(EXPECTED_SFX.length);
  });

  it('distingue Écoute (montant) d’Écoute bloquée (grave et étouffé)', () => {
    const defs = loadSfx();
    const ecoute = defs['ecoute']!;
    const bloquee = defs['ecoute-bloquee']!;
    expect(ecoute.freqEnd!).toBeGreaterThan(ecoute.freq);
    expect(bloquee.freqEnd!).toBeLessThan(bloquee.freq);
    expect(bloquee.freq).toBeLessThan(ecoute.freq);
    expect(bloquee.lowpass).toBeDefined();
  });

  it('les sons mélodiques utilisent repeat et freqEnd', () => {
    const defs = loadSfx();
    for (const id of ['niveau', 'victoire-court', 'lueur-trouvee']) {
      const def = defs[id]!;
      expect(def.repeat, id).toBeGreaterThan(1);
      expect(def.freqEnd, id).toBeGreaterThan(def.freq);
    }
    expect(defs['braise']!.wave).toBe('noise');
    expect(defs['braise']!.repeat).toBeGreaterThan(1);
  });
});

describe('validateSfx', () => {
  it('signale les champs manquants, inconnus ou hors limites', () => {
    const errors = validateSfx({
      'Mauvais Id': { wave: 'square', freq: 440, duration: 0.1, volume: 0.2 },
      bruit: { wave: 'organ', freq: -1, duration: 0.1, volume: 2, couleur: 'rouge' },
      vide: {},
      repete: { wave: 'sine', freq: 440, duration: 0.1, volume: 0.2, repeat: 1.5 },
    });
    expect(errors.join('\n')).toMatch(/Mauvais Id : identifiant non kebab-case/);
    expect(errors.join('\n')).toMatch(/bruit : onde inconnue « organ »/);
    expect(errors.join('\n')).toMatch(/bruit : freq doit être/);
    expect(errors.join('\n')).toMatch(/bruit : volume doit être ≤ 1/);
    expect(errors.join('\n')).toMatch(/bruit : champ inconnu « couleur »/);
    expect(errors.join('\n')).toMatch(/vide : freq manquant/);
    expect(errors.join('\n')).toMatch(/repete : repeat doit être un entier/);
    expect(validateSfx([])).toHaveLength(1);
  });
});

describe('sfxRepeatFrequencies', () => {
  const base: SfxDef = { wave: 'square', freq: 440, duration: 0.1, volume: 0.2 };

  it('donne une seule fréquence sans répétition', () => {
    expect(sfxRepeatFrequencies(base)).toEqual([440]);
    expect(sfxRepeatFrequencies({ ...base, freqEnd: 880 })).toEqual([440]);
  });

  it('répète la même hauteur sans freqEnd', () => {
    expect(sfxRepeatFrequencies({ ...base, repeat: 3 })).toEqual([440, 440, 440]);
  });

  it('monte par paliers égaux de freq à freqEnd', () => {
    const steps = sfxRepeatFrequencies({ ...base, freqEnd: 880, repeat: 3 });
    expect(steps).toHaveLength(3);
    expect(steps[0]).toBe(440);
    expect(steps[1]).toBeCloseTo(622.25, 1);
    expect(steps[2]).toBeCloseTo(880, 6);
  });
});

describe('voiceBlipFrequency', () => {
  it('varie la hauteur de ±8 % au maximum', () => {
    expect(voiceBlipFrequency(260, () => 0)).toBeCloseTo(260 * (1 - VOICE_PITCH_VARIATION));
    expect(voiceBlipFrequency(260, () => 1)).toBeCloseTo(260 * (1 + VOICE_PITCH_VARIATION));
    expect(voiceBlipFrequency(260, () => 0.5)).toBeCloseTo(260);
  });
});

describe('playSfx et voiceBlip sur un faux contexte', () => {
  it('crée une voix par répétition, espacée de l’intervalle', () => {
    const ctx = new FakeAudioContext();
    const synth = new Synth(ctx.asContext(), () => 0.5);
    playSfx(synth, { wave: 'square', freq: 440, freqEnd: 880, duration: 0.1, volume: 0.2, repeat: 3, interval: 0.05 }, 1);
    expect(ctx.oscillators).toHaveLength(3);
    expect(ctx.oscillators.map((osc) => osc.startedAt)).toEqual([1, 1.05, 1.1]);
    expect(ctx.oscillators[2]?.frequency.value).toBeCloseTo(880);
    expect(ctx.oscillators.every((osc) => osc.type === 'square')).toBe(true);
  });

  it('joue le bruit à travers un passe-bande et les filtres demandés', () => {
    const ctx = new FakeAudioContext();
    const synth = new Synth(ctx.asContext(), () => 0.5);
    playSfx(synth, { wave: 'noise', freq: 200, duration: 0.12, volume: 0.4, decay: 0.1, lowpass: 800 });
    expect(ctx.noises).toHaveLength(1);
    expect(ctx.noises[0]?.loop).toBe(true);
    expect(ctx.filters.map((filter) => filter.type)).toEqual(['bandpass', 'lowpass']);
  });

  it('le bip de voix suit l’onde et la durée du personnage', () => {
    const ctx = new FakeAudioContext();
    const synth = new Synth(ctx.asContext(), () => 0.5);
    voiceBlip(synth, { pitch: 260, wave: 'square', length: 60 }, () => 1);
    const osc = ctx.oscillators[0]!;
    expect(osc.type).toBe('square');
    expect(osc.frequency.value).toBeCloseTo(260 * 1.08);
    expect(osc.stoppedAt! - osc.startedAt!).toBeCloseTo(0.06 + 0.05, 5);
  });

  it('les ondes pulse passent par une PeriodicWave', () => {
    const ctx = new FakeAudioContext();
    const synth = new Synth(ctx.asContext(), () => 0.5);
    playSfx(synth, { wave: 'pulse25', freq: 440, duration: 0.1, volume: 0.2 });
    expect(ctx.oscillators[0]?.periodic).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import {
  MAX_TRACK_VOLUME,
  PatternError,
  noteToFrequency,
  noteToMidi,
  parsePattern,
  patternLength,
  stepSeconds,
  validateMusic,
} from '../../../src/systems/audio/patterns';
import type { MusicData } from '../../../src/systems/audio/patterns';

describe('noteToFrequency', () => {
  it('donne 440 Hz pour A4 et 261,63 Hz pour C4', () => {
    expect(noteToFrequency('A4')).toBe(440);
    expect(noteToFrequency('C4')).toBeCloseTo(261.63, 2);
    expect(noteToFrequency('A5')).toBe(880);
  });

  it('numérote les notes en MIDI avec C4 = 60', () => {
    expect(noteToMidi('C4')).toBe(60);
    expect(noteToMidi('A4')).toBe(69);
    expect(noteToMidi('C1')).toBe(24);
  });

  it('comprend les dièses et les bémols', () => {
    expect(noteToMidi('C#4')).toBe(61);
    expect(noteToMidi('Db4')).toBe(61);
    expect(noteToMidi('Bb3')).toBe(58);
    expect(noteToMidi('A#3')).toBe(58);
  });

  it('refuse un nom invalide', () => {
    expect(() => noteToMidi('H4')).toThrow(PatternError);
    expect(() => noteToMidi('C9')).toThrow(PatternError);
    expect(() => noteToMidi('c4')).toThrow(PatternError);
  });
});

describe('parsePattern', () => {
  it('place les notes sur la grille avec leur durée', () => {
    const notes = parsePattern('C4:2 D4 E4:4');
    expect(notes).toHaveLength(3);
    expect(notes[0]).toMatchObject({ step: 0, lengthSteps: 2, midi: 60 });
    expect(notes[1]).toMatchObject({ step: 2, lengthSteps: 1, midi: 62 });
    expect(notes[2]).toMatchObject({ step: 3, lengthSteps: 4, midi: 64 });
    expect(notes[0]?.frequency).toBeCloseTo(261.63, 2);
  });

  it('ignore les repères de mesure et les espaces multiples', () => {
    const notes = parsePattern('  C4:4   | D4:4 |\n E4:8 ');
    expect(notes.map((n) => n.step)).toEqual([0, 4, 8]);
    expect(patternLength('C4:4 | D4:4 | E4:8')).toBe(16);
  });

  it('garde les silences avec une fréquence nulle', () => {
    const notes = parsePattern('C4 . .:4 D4');
    expect(notes).toHaveLength(4);
    expect(notes[1]).toMatchObject({ step: 1, lengthSteps: 1, frequency: null, midi: null });
    expect(notes[2]).toMatchObject({ step: 2, lengthSteps: 4, frequency: null });
    expect(notes[3]).toMatchObject({ step: 6, midi: 62 });
  });

  it('prolonge la note précédente avec ~', () => {
    const notes = parsePattern('C4:4 ~ ~ D4:2 ~:2');
    expect(notes).toHaveLength(2);
    expect(notes[0]).toMatchObject({ step: 0, lengthSteps: 6 });
    expect(notes[1]).toMatchObject({ step: 6, lengthSteps: 4 });
    expect(patternLength('C4:4 ~ ~ D4:2 ~:2')).toBe(10);
  });

  it('lit les accords', () => {
    const notes = parsePattern('[C4 E4 G4]:4 A4');
    const chord = notes[0];
    expect(chord?.lengthSteps).toBe(4);
    expect(chord?.midi).toBe(60);
    expect(chord?.chord).toHaveLength(3);
    expect(chord?.chord?.[1]).toBeCloseTo(329.63, 2);
    expect(chord?.chord?.[2]).toBeCloseTo(392, 2);
    expect(chord?.frequency).toBe(chord?.chord?.[0]);
    expect(notes[1]).toMatchObject({ step: 4, midi: 69 });
  });

  it('lit les percussions k, s, h', () => {
    const notes = parsePattern('k . h:2 s');
    expect(notes[0]).toMatchObject({ step: 0, drum: 'k', frequency: null, lengthSteps: 1 });
    expect(notes[2]).toMatchObject({ step: 2, drum: 'h', lengthSteps: 2 });
    expect(notes[3]).toMatchObject({ step: 4, drum: 's' });
  });

  it('signale un jeton inconnu avec sa position', () => {
    expect(() => parsePattern('C4:4 X4 D4')).toThrow(PatternError);
    try {
      parsePattern('C4:4 X4 D4');
    } catch (error) {
      expect(error).toBeInstanceOf(PatternError);
      const patternError = error as PatternError;
      expect(patternError.position).toBe(5);
      expect(patternError.token).toBe('X4');
      expect(patternError.message).toContain('X4');
      expect(patternError.message).toContain('5');
    }
  });

  it('refuse une liaison sans note, une durée nulle et un accord non fermé', () => {
    expect(() => parsePattern('~ C4')).toThrow(/Liaison/);
    expect(() => parsePattern('C4:0')).toThrow(/Durée/);
    expect(() => parsePattern('C4:abc')).toThrow(PatternError);
    expect(() => parsePattern('[C4 E4')).toThrow(/non fermé/);
    expect(() => parsePattern('[]:4')).toThrow(/Accord vide/);
    expect(() => parsePattern('[C4 k]:4')).toThrow(PatternError);
  });

  it('renvoie une liste vide pour un pattern vide', () => {
    expect(parsePattern('')).toEqual([]);
    expect(patternLength('| |')).toBe(0);
  });
});

describe('stepSeconds', () => {
  it('calcule la durée d’un pas', () => {
    expect(stepSeconds(120, 4)).toBeCloseTo(0.125);
    expect(stepSeconds(60, 1)).toBe(1);
  });
});

function music(overrides: Partial<MusicData> = {}): MusicData {
  return {
    id: 'test',
    title: 'Test',
    bpm: 120,
    stepsPerBeat: 4,
    loop: true,
    tracks: [
      { name: 'melodie', wave: 'square', volume: 0.2, pattern: 'C4:4 D4:4 | E4:8' },
      { name: 'basse', wave: 'triangle', volume: 0.2, pattern: 'C2:8 G2:8' },
      { name: 'percu', wave: 'noise', volume: 0.1, pattern: 'k . h . s . h . k . h . s . h .' },
    ],
    ...overrides,
  };
}

describe('validateMusic', () => {
  it('accepte un morceau correct', () => {
    expect(validateMusic(music())).toEqual([]);
  });

  it('refuse des pistes de longueurs différentes', () => {
    const data = music();
    data.tracks[1] = { name: 'basse', wave: 'triangle', volume: 0.2, pattern: 'C2:8 G2:4' };
    const errors = validateMusic(data);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/longueurs différentes/);
  });

  it('refuse un volume trop fort ou une onde inconnue', () => {
    const data = music();
    data.tracks[0] = { name: 'm', wave: 'square', volume: MAX_TRACK_VOLUME + 0.01, pattern: 'C4:16' };
    expect(validateMusic(data).join(' ')).toMatch(/volume/);
    const bad = music() as unknown as { tracks: { wave: string }[] };
    bad.tracks[0]!.wave = 'organ';
    expect(validateMusic(bad).join(' ')).toMatch(/onde inconnue « organ »/);
  });

  it('remonte les erreurs de pattern avec le nom de la piste', () => {
    const data = music();
    data.tracks[0] = { name: 'melodie', wave: 'square', volume: 0.2, pattern: 'C4:4 Z9 .:11' };
    const errors = validateMusic(data);
    expect(errors.some((e) => e.includes('melodie') && e.includes('Z9'))).toBe(true);
  });

  it('exige que les percussions soient sur une piste noise et inversement', () => {
    const drumsOnSquare = music();
    drumsOnSquare.tracks[0] = { name: 'm', wave: 'square', volume: 0.2, pattern: 'k:16' };
    expect(validateMusic(drumsOnSquare).join(' ')).toMatch(/piste noise/);
    const notesOnNoise = music();
    notesOnNoise.tracks[2] = { name: 'p', wave: 'noise', volume: 0.1, pattern: 'C4:16' };
    expect(validateMusic(notesOnNoise).join(' ')).toMatch(/noise ne contient que/);
  });

  it('vérifie l’en-tête et les champs optionnels', () => {
    expect(validateMusic(null)).toHaveLength(1);
    expect(validateMusic({ ...music(), bpm: 0 }).join(' ')).toMatch(/bpm/);
    expect(validateMusic({ ...music(), stepsPerBeat: 2.5 }).join(' ')).toMatch(/stepsPerBeat/);
    expect(validateMusic({ ...music(), loop: 'oui' }).join(' ')).toMatch(/loop/);
    expect(validateMusic({ ...music(), id: 'Titre Principal' }).join(' ')).toMatch(/id/);
    expect(validateMusic({ ...music(), tracks: [] }).join(' ')).toMatch(/tracks/);
    const data = music();
    data.tracks[0] = { ...data.tracks[0]!, octave: 1.5, attack: -1 };
    const errors = validateMusic(data).join(' ');
    expect(errors).toMatch(/octave/);
    expect(errors).toMatch(/attack/);
  });
});

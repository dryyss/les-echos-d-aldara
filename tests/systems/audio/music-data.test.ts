import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  musicLengthSteps,
  stepSeconds,
  validateMusic,
} from '../../../src/systems/audio/patterns';
import type { MusicData } from '../../../src/systems/audio/patterns';

const MUSIC_DIR = join(__dirname, '..', '..', '..', 'data', 'audio', 'music');

/** Morceaux écrits par l'équipe moteur audio ; les autres viennent du compositeur. */
const REFERENCE_TRACKS = ['titre', 'brumeval', 'combat', 'boss', 'victoire', 'defaite'];

function loadMusic(id: string): unknown {
  return JSON.parse(readFileSync(join(MUSIC_DIR, `${id}.json`), 'utf8')) as unknown;
}

function barsOf(data: MusicData): number {
  return musicLengthSteps(data) / (data.stepsPerBeat * 4);
}

describe('morceaux de référence (data/audio/music)', () => {
  it.each(REFERENCE_TRACKS)('%s est valide', (id) => {
    const data = loadMusic(id);
    expect(validateMusic(data)).toEqual([]);
    expect((data as MusicData).id).toBe(id);
  });

  it('les morceaux en boucle font entre 16 et 32 mesures à 4 pistes', () => {
    for (const id of ['titre', 'brumeval', 'combat', 'boss']) {
      const data = loadMusic(id) as MusicData;
      expect(data.loop).toBe(true);
      expect(data.tracks).toHaveLength(4);
      const bars = barsOf(data);
      expect(bars, `${id} : ${bars} mesures`).toBeGreaterThanOrEqual(16);
      expect(bars, `${id} : ${bars} mesures`).toBeLessThanOrEqual(32);
      expect(Number.isInteger(bars), `${id} : mesures incomplètes`).toBe(true);
    }
  });

  it('victoire et défaite sont courts et sans boucle', () => {
    const victoire = loadMusic('victoire') as MusicData;
    const defaite = loadMusic('defaite') as MusicData;
    expect(victoire.loop).toBe(false);
    expect(defaite.loop).toBe(false);
    expect(barsOf(victoire)).toBe(2);
    expect(barsOf(defaite)).toBe(4);
    const victoireSeconds =
      musicLengthSteps(victoire) * stepSeconds(victoire.bpm, victoire.stepsPerBeat);
    expect(victoireSeconds).toBeLessThan(5);
  });

  it('respecte les tempos demandés', () => {
    expect((loadMusic('titre') as MusicData).bpm).toBe(110);
    expect((loadMusic('brumeval') as MusicData).bpm).toBe(96);
    expect((loadMusic('combat') as MusicData).bpm).toBe(150);
    expect((loadMusic('boss') as MusicData).bpm).toBe(160);
  });

  it('chaque piste a une onde et un rôle distinct', () => {
    for (const id of REFERENCE_TRACKS) {
      const data = loadMusic(id) as MusicData;
      const names = new Set(data.tracks.map((track) => track.name));
      expect(names.size).toBe(data.tracks.length);
      expect(data.tracks.some((track) => track.wave === 'noise')).toBe(true);
    }
  });
});

describe('tous les morceaux du dossier', () => {
  const files = existsSync(MUSIC_DIR)
    ? readdirSync(MUSIC_DIR).filter((file) => file.endsWith('.json'))
    : [];

  it.each(files)('%s passe la validation et porte le nom de son fichier', (file) => {
    const data = JSON.parse(readFileSync(join(MUSIC_DIR, file), 'utf8')) as unknown;
    expect(validateMusic(data)).toEqual([]);
    expect((data as MusicData).id).toBe(basename(file, '.json'));
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioManager, audio } from '../../../src/systems/audio/AudioManager';
import type { MusicData } from '../../../src/systems/audio/patterns';
import type { SfxDef } from '../../../src/systems/audio/sfx';
import { FakeAudioContext } from './fakeAudioContext';

const VOICE = { pitch: 260, wave: 'square', length: 60 } as const;

function music(id: string, loop = true): MusicData {
  return {
    id,
    title: id,
    bpm: 120,
    stepsPerBeat: 4,
    loop,
    tracks: [
      { name: 'melodie', wave: 'square', volume: 0.2, pattern: 'C4 D4 E4 F4' },
      { name: 'percu', wave: 'noise', volume: 0.1, pattern: 'k . s .' },
    ],
  };
}

const SFX: Record<string, SfxDef> = {
  coup: { wave: 'noise', freq: 200, duration: 0.12, volume: 0.4, decay: 0.1 },
  niveau: { wave: 'square', freq: 523, freqEnd: 1175, duration: 0.3, volume: 0.25, repeat: 3, interval: 0.1 },
};

describe('AudioManager sans Web Audio (Node)', () => {
  it('toutes les méthodes sont inoffensives', () => {
    expect(typeof window).toBe('undefined');
    const manager = new AudioManager();
    expect(() => {
      manager.init();
      manager.init();
      manager.loadMusic({ titre: music('titre') });
      manager.loadSfx(SFX);
      manager.playMusic('titre');
      manager.playMusic('titre', { fade: 0, restart: true });
      manager.playSfx('coup');
      manager.voiceBlip(VOICE);
      manager.setMusicVolume(0.5);
      manager.setSfxVolume(2);
      manager.stopMusic(0);
    }).not.toThrow();
    expect(manager.currentMusic).toBeNull();
    expect(manager.isActive).toBe(false);
  });

  it('expose un singleton audio', () => {
    expect(audio).toBeInstanceOf(AudioManager);
    expect(audio.currentMusic).toBeNull();
  });
});

describe('AudioManager avec un faux contexte', () => {
  let ctx: FakeAudioContext;
  let manager: AudioManager;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    ctx = new FakeAudioContext();
    manager = new AudioManager({ createContext: () => ctx.asContext(), rng: () => 0.5 });
    manager.init();
    manager.loadMusic({ titre: music('titre'), combat: music('combat'), victoire: music('victoire', false) });
    manager.loadSfx(SFX);
  });

  afterEach(() => {
    vi.useRealTimers();
    warn.mockRestore();
  });

  it('crée le contexte à la demande et joue la musique', () => {
    expect(manager.isActive).toBe(false);
    manager.playMusic('titre');
    expect(manager.isActive).toBe(true);
    expect(manager.currentMusic).toBe('titre');
    ctx.run(0.3);
    expect(ctx.melodicOscillators().length).toBeGreaterThan(0);
    expect(ctx.noises.length).toBeGreaterThan(0);
  });

  it('ne relance pas un morceau déjà en cours sauf avec restart', () => {
    manager.playMusic('titre');
    const gains = ctx.gains.length;
    manager.playMusic('titre');
    expect(ctx.gains.length).toBe(gains);
    manager.playMusic('titre', { restart: true });
    expect(ctx.gains.length).toBeGreaterThan(gains);
    expect(manager.currentMusic).toBe('titre');
  });

  it('enchaîne deux morceaux en fondu croisé', () => {
    manager.playMusic('titre', { fade: 0.5 });
    ctx.run(0.5);
    const titreOutput = ctx.gains.find((gain) => gain.gain.events.some((e) => e.type === 'linear' && e.value === 1));
    expect(titreOutput).toBeDefined();
    manager.playMusic('combat', { fade: 0.5 });
    expect(manager.currentMusic).toBe('combat');
    const fadeOut = titreOutput!.gain.events.find((e) => e.type === 'linear' && e.value === 0);
    expect(fadeOut?.time).toBeCloseTo(ctx.currentTime + 0.5, 6);
    ctx.run(1);
    expect(manager.currentMusic).toBe('combat');
  });

  it('stopMusic coupe le morceau courant', () => {
    manager.playMusic('titre');
    manager.stopMusic(0);
    expect(manager.currentMusic).toBeNull();
    const count = ctx.melodicOscillators().length;
    ctx.run(0.5);
    expect(ctx.melodicOscillators()).toHaveLength(count);
  });

  it('oublie un morceau sans boucle quand il se termine', () => {
    manager.playMusic('victoire', { fade: 0 });
    expect(manager.currentMusic).toBe('victoire');
    ctx.run(3);
    expect(manager.currentMusic).toBeNull();
  });

  it('prévient une seule fois par identifiant inconnu', () => {
    manager.playMusic('inconnu');
    manager.playMusic('inconnu');
    manager.playSfx('nope');
    manager.playSfx('nope');
    expect(warn).toHaveBeenCalledTimes(2);
    expect(String(warn.mock.calls[0]?.[0])).toContain('inconnu');
    expect(String(warn.mock.calls[1]?.[0])).toContain('nope');
  });

  it('ignore les musiques et bruitages invalides au chargement', () => {
    const broken = { ...music('casse'), tracks: [{ name: 'm', wave: 'square', volume: 0.9, pattern: 'C4' }] } as MusicData;
    manager.loadMusic({ casse: broken });
    manager.loadSfx({ 'mauvais-son': { wave: 'square', freq: 440, duration: 0.1, volume: 3 } });
    expect(warn).toHaveBeenCalledTimes(2);
    manager.playMusic('casse');
    manager.playSfx('mauvais-son');
    expect(manager.currentMusic).toBeNull();
    expect(ctx.oscillators).toHaveLength(0);
  });

  it('joue les bruitages et les bips de voix', () => {
    manager.playSfx('niveau');
    expect(ctx.oscillators).toHaveLength(3);
    manager.playSfx('coup');
    expect(ctx.noises).toHaveLength(1);
    manager.voiceBlip(VOICE);
    expect(ctx.oscillators).toHaveLength(4);
    expect(ctx.oscillators[3]?.frequency.value).toBeCloseTo(260);
  });

  it('applique les volumes aux bus, même réglés avant la création du contexte', () => {
    manager.setMusicVolume(0.25);
    manager.setSfxVolume(0.75);
    manager.playSfx('coup');
    const targets = ctx.gains.flatMap((gain) => gain.gain.events.filter((e) => e.type === 'target'));
    expect(targets.map((e) => e.value)).toEqual(expect.arrayContaining([0.25, 0.75]));
    manager.setMusicVolume(1.5);
    const latest = ctx.gains.flatMap((gain) => gain.gain.events).at(-1);
    expect(latest).toMatchObject({ type: 'target', value: 1 });
  });
});

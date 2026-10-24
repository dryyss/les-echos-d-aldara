/**
 * Façade audio du jeu. Le contexte Web Audio est créé à la demande et
 * débloqué au premier geste (pointerdown, keydown). Les musiques (Sequencer)
 * et les bruitages (sfx) sont chargés depuis les JSON de data/audio.
 * Sans AudioContext (tests Node), toutes les méthodes sont inoffensives.
 */
import type { VoiceData } from '../../data/types';
import type { MusicData } from './patterns';
import { validateMusic } from './patterns';
import { Sequencer } from './Sequencer';
import type { SfxDef } from './sfx';
import * as sfx from './sfx';
import { Synth } from './Synth';

export interface PlayMusicOptions {
  /** Durée du fondu (croisé si un morceau joue déjà), en secondes. */
  fade?: number;
  /** Relance le morceau même s'il est déjà en cours. */
  restart?: boolean;
}

export interface AudioManagerOptions {
  /** Fabrique du contexte audio (tests) ; null si la Web Audio est indisponible. */
  createContext?: () => AudioContext | null;
  rng?: () => number;
}

export const DEFAULT_MUSIC_FADE = 0.6;
const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const;

function defaultCreateContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return null;
  return new window.AudioContext();
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function ignore(): void {}

export class AudioManager {
  private readonly createContext: () => AudioContext | null;
  private readonly rng: () => number;
  private synth: Synth | null = null;
  private unsupported = false;
  private initialized = false;
  private musicData: Record<string, MusicData> = {};
  private sfxDefs: Record<string, SfxDef> = {};
  private current: Sequencer | null = null;
  private currentId: string | null = null;
  private musicVolume = 1;
  private sfxVolume = 1;
  private suspendedByVisibility = false;
  private readonly warned = new Set<string>();

  constructor(options: AudioManagerOptions = {}) {
    this.createContext = options.createContext ?? defaultCreateContext;
    this.rng = options.rng ?? Math.random;
  }

  /** Identifiant du morceau en cours, ou null. */
  get currentMusic(): string | null {
    return this.currentId;
  }

  /** Vrai dès qu'un contexte audio existe. */
  get isActive(): boolean {
    return this.synth !== null;
  }

  /** À appeler une fois au démarrage : pose les écouteurs de déblocage et de visibilité. */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const unlock = (): void => {
      const synth = this.ensureSynth();
      if (synth && synth.context.state !== 'running') synth.context.resume().catch(ignore);
      UNLOCK_EVENTS.forEach((type) => window.removeEventListener(type, unlock));
    };
    UNLOCK_EVENTS.forEach((type) => window.addEventListener(type, unlock, { passive: true }));
    document.addEventListener('visibilitychange', () => this.handleVisibility());
  }

  loadMusic(tracks: Record<string, MusicData>): void {
    for (const [id, data] of Object.entries(tracks)) {
      const errors = validateMusic(data);
      if (errors.length > 0) {
        this.warnOnce(`Musique « ${id} » ignorée : ${errors.join(' ; ')}`);
        continue;
      }
      this.musicData[id] = data;
    }
  }

  loadSfx(defs: Record<string, SfxDef>): void {
    const errors = sfx.validateSfx(defs);
    const invalid = new Set(errors.map((error) => error.split(' : ')[0] ?? ''));
    errors.forEach((error) => this.warnOnce(`Bruitage ignoré : ${error}`));
    for (const [id, def] of Object.entries(defs)) {
      if (!invalid.has(id)) this.sfxDefs[id] = def;
    }
  }

  playMusic(id: string, options: PlayMusicOptions = {}): void {
    const { fade = DEFAULT_MUSIC_FADE, restart = false } = options;
    const data = this.musicData[id];
    if (!data) {
      this.warnOnce(`Musique inconnue : ${id}`);
      return;
    }
    if (this.currentId === id && this.current?.isPlaying && !restart) return;
    const synth = this.ensureSynth();
    if (!synth) return;

    this.current?.stop(fade);
    const sequencer = new Sequencer(synth, synth.bus('music'));
    sequencer.onEnded = () => {
      if (this.current === sequencer) {
        this.current = null;
        this.currentId = null;
      }
    };
    sequencer.setVolume(0);
    sequencer.play(data);
    sequencer.setVolume(1, fade);
    this.current = sequencer;
    this.currentId = id;
  }

  stopMusic(fade = DEFAULT_MUSIC_FADE): void {
    const sequencer = this.current;
    this.current = null;
    this.currentId = null;
    sequencer?.stop(fade);
  }

  playSfx(id: string): void {
    const def = this.sfxDefs[id];
    if (!def) {
      this.warnOnce(`Bruitage inconnu : ${id}`);
      return;
    }
    const synth = this.ensureSynth();
    if (synth) sfx.playSfx(synth, def);
  }

  voiceBlip(voice: VoiceData): void {
    const synth = this.ensureSynth();
    if (synth) sfx.voiceBlip(synth, voice, this.rng);
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = clamp01(volume);
    this.synth?.setBusVolume('music', this.musicVolume);
  }

  /** Règle les bruitages et les bips de voix (une seule option dans le jeu). */
  setSfxVolume(volume: number): void {
    this.sfxVolume = clamp01(volume);
    this.synth?.setBusVolume('sfx', this.sfxVolume);
    this.synth?.setBusVolume('voice', this.sfxVolume);
  }

  private ensureSynth(): Synth | null {
    if (this.synth) return this.synth;
    if (this.unsupported) return null;
    let context: AudioContext | null = null;
    try {
      context = this.createContext();
    } catch {
      context = null;
    }
    if (!context) {
      this.unsupported = true;
      return null;
    }
    this.synth = new Synth(context, this.rng);
    this.synth.setBusVolume('music', this.musicVolume);
    this.synth.setBusVolume('sfx', this.sfxVolume);
    this.synth.setBusVolume('voice', this.sfxVolume);
    return this.synth;
  }

  private handleVisibility(): void {
    const synth = this.synth;
    if (!synth) return;
    if (document.hidden) {
      this.current?.pause();
      if (synth.context.state === 'running') {
        this.suspendedByVisibility = true;
        synth.context.suspend().catch(ignore);
      }
      return;
    }
    if (this.suspendedByVisibility) {
      this.suspendedByVisibility = false;
      synth.context.resume().catch(ignore);
    }
    this.current?.resume();
  }

  private warnOnce(message: string): void {
    if (this.warned.has(message)) return;
    this.warned.add(message);
    console.warn(`[audio] ${message}`);
  }
}

/** Instance unique utilisée par les scènes Phaser. */
export const audio = new AudioManager();

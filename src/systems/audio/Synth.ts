/**
 * Voix Web Audio du moteur chiptune : oscillateurs (carré, triangle, dent de
 * scie, sinus, pulsations 25 % et 12,5 %), bruit blanc filtré pour les
 * percussions, enveloppes, vibrato et filtres. Tout passe par un bus de gain
 * par catégorie (music, sfx, voice), puis un gain global et un limiteur.
 * Aucune dépendance à Phaser.
 */
import type { DrumKind, WaveName } from './patterns';

export type AudioCategory = 'music' | 'sfx' | 'voice';
export const AUDIO_CATEGORIES: readonly AudioCategory[] = ['music', 'sfx', 'voice'];

/** Paramètres d'une note ou d'un bruitage. */
export interface ToneParams {
  wave: WaveName;
  /** Fréquence en Hz ; pour le bruit, centre du filtre passe-bande. */
  frequency: number;
  /** Glissando vers cette fréquence sur toute la durée. */
  frequencyEnd?: number;
  /** Instant de départ sur l'horloge du contexte audio. */
  start: number;
  duration: number;
  /** Gain de crête, 0 à 1. */
  volume: number;
  /** Montée en secondes (défaut 0.005). */
  attack?: number;
  /** Décroissance percussive après l'attaque ; sans elle la note est tenue puis relâchée. */
  decay?: number;
  /** Relâchement en fin de note en secondes (défaut 0.03). */
  release?: number;
  detune?: number;
  /** Profondeur du vibrato en cents. */
  vibrato?: number;
  lowpass?: number;
  highpass?: number;
}

interface FilterSpec {
  type: BiquadFilterType;
  frequency: number;
  frequencyEnd?: number;
  q?: number;
}

interface VoiceSpec {
  wave: WaveName;
  frequency: number;
  frequencyEnd?: number;
  start: number;
  duration: number;
  volume: number;
  attack: number;
  decay?: number;
  release: number;
  detune: number;
  vibrato: number;
  filters: FilterSpec[];
}

const DEFAULT_ATTACK = 0.005;
const DEFAULT_RELEASE = 0.03;
const VIBRATO_RATE_HZ = 5.5;
const PULSE_HARMONICS = 48;
const NOISE_SECONDS = 2;
const NOISE_BANDPASS_Q = 1;
/** Marge après la fin de l'enveloppe avant d'arrêter la source. */
const STOP_MARGIN = 0.05;
const PULSE_DUTY: Readonly<Record<'pulse25' | 'pulse12', number>> = { pulse25: 0.25, pulse12: 0.125 };

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Un passe-bande ne laisse passer qu'une fraction du bruit blanc : plus il est
 * grave et étroit, plus le bruit ressort faible. On compense selon la bande.
 */
function noiseGain(frequency: number, sampleRate: number): number {
  return Math.min(6, Math.max(1, Math.sqrt(sampleRate / 2 / Math.max(frequency, 20))));
}

function applyEnvelope(gain: AudioParam, spec: VoiceSpec): void {
  const end = spec.start + spec.duration;
  const peakTime = Math.min(spec.start + spec.attack, end);
  gain.setValueAtTime(0, spec.start);
  gain.linearRampToValueAtTime(spec.volume, peakTime);
  if (spec.decay !== undefined) {
    const decayEnd = Math.min(peakTime + Math.max(spec.decay, 0.001), end);
    gain.exponentialRampToValueAtTime(spec.volume * 0.001, decayEnd);
    gain.linearRampToValueAtTime(0, end);
    return;
  }
  const releaseStart = Math.max(peakTime, end - spec.release);
  gain.setValueAtTime(spec.volume, releaseStart);
  gain.linearRampToValueAtTime(0, end);
}

export class Synth {
  private readonly master: GainNode;
  private readonly buses: Record<AudioCategory, GainNode>;
  private readonly pulseWaves = new Map<number, PeriodicWave>();
  private noiseBuffer: AudioBuffer | null = null;

  constructor(
    readonly context: AudioContext,
    private readonly rng: () => number = Math.random,
  ) {
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -8;
    limiter.knee.value = 6;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.15;
    limiter.connect(context.destination);
    this.master = context.createGain();
    this.master.connect(limiter);
    this.buses = { music: this.createBus(), sfx: this.createBus(), voice: this.createBus() };
  }

  get now(): number {
    return this.context.currentTime;
  }

  bus(category: AudioCategory): GainNode {
    return this.buses[category];
  }

  setBusVolume(category: AudioCategory, volume: number): void {
    this.buses[category].gain.setTargetAtTime(clamp01(volume), this.now, 0.02);
  }

  setMasterVolume(volume: number): void {
    this.master.gain.setTargetAtTime(clamp01(volume), this.now, 0.02);
  }

  /** Joue une note ou un bruitage sur la destination donnée (bus sfx par défaut). */
  playTone(params: ToneParams, destination: AudioNode = this.buses.sfx): void {
    const filters: FilterSpec[] = [];
    let volume = params.volume;
    if (params.wave === 'noise') {
      filters.push({
        type: 'bandpass',
        frequency: params.frequency,
        frequencyEnd: params.frequencyEnd,
        q: NOISE_BANDPASS_Q,
      });
      volume *= noiseGain(params.frequency, this.context.sampleRate);
    }
    if (params.lowpass) filters.push({ type: 'lowpass', frequency: params.lowpass });
    if (params.highpass) filters.push({ type: 'highpass', frequency: params.highpass });
    this.playVoice(
      {
        wave: params.wave,
        frequency: params.frequency,
        frequencyEnd: params.frequencyEnd,
        start: params.start,
        duration: params.duration,
        volume,
        attack: params.attack ?? DEFAULT_ATTACK,
        decay: params.decay,
        release: params.release ?? DEFAULT_RELEASE,
        detune: params.detune ?? 0,
        vibrato: params.vibrato ?? 0,
        filters,
      },
      destination,
    );
  }

  /** Percussions : k (grave), s (caisse claire), h (charleston). */
  playDrum(kind: DrumKind, start: number, volume: number, destination: AudioNode): void {
    const base = { start, frequency: 0, attack: 0.002, release: 0.01, detune: 0, vibrato: 0 };
    switch (kind) {
      case 'k':
        this.playVoice(
          { ...base, wave: 'noise', volume: volume * 2, duration: 0.2, decay: 0.15, filters: [{ type: 'lowpass', frequency: 150 }] },
          destination,
        );
        this.playVoice(
          { ...base, wave: 'sine', frequency: 150, frequencyEnd: 45, volume: volume * 1.5, duration: 0.16, decay: 0.12, filters: [] },
          destination,
        );
        return;
      case 's':
        this.playVoice(
          { ...base, wave: 'noise', volume: volume * 1.2, duration: 0.16, decay: 0.12, filters: [{ type: 'bandpass', frequency: 1000, q: 0.7 }] },
          destination,
        );
        return;
      case 'h':
        this.playVoice(
          { ...base, wave: 'noise', volume: volume * 0.5, duration: 0.05, decay: 0.035, filters: [{ type: 'highpass', frequency: 6000 }] },
          destination,
        );
    }
  }

  private createBus(): GainNode {
    const bus = this.context.createGain();
    bus.connect(this.master);
    return bus;
  }

  private playVoice(spec: VoiceSpec, destination: AudioNode): void {
    if (spec.volume <= 0 || spec.duration <= 0) return;
    const end = spec.start + spec.duration;
    const source =
      spec.wave === 'noise' ? this.createNoise(spec.start) : this.createOscillator(spec, end);
    const filters = spec.filters.map((filter) => this.createFilter(filter, spec.start, end));
    const envelope = this.context.createGain();
    applyEnvelope(envelope.gain, spec);

    const nodes: AudioNode[] = [source, ...filters, envelope];
    nodes.forEach((node, index) => node.connect(nodes[index + 1] ?? destination));
    source.stop(end + STOP_MARGIN);
    source.onended = () => nodes.forEach((node) => node.disconnect());
  }

  private createOscillator(spec: VoiceSpec, end: number): OscillatorNode {
    const osc = this.context.createOscillator();
    switch (spec.wave) {
      case 'pulse25':
      case 'pulse12':
        osc.setPeriodicWave(this.pulseWave(PULSE_DUTY[spec.wave]));
        break;
      case 'noise':
        break;
      default:
        osc.type = spec.wave;
    }
    osc.frequency.setValueAtTime(Math.max(spec.frequency, 1), spec.start);
    if (spec.frequencyEnd !== undefined && spec.frequencyEnd > 0) {
      osc.frequency.exponentialRampToValueAtTime(spec.frequencyEnd, end);
    }
    if (spec.detune !== 0) osc.detune.setValueAtTime(spec.detune, spec.start);
    if (spec.vibrato > 0) this.attachVibrato(osc, spec.vibrato, spec.start, end);
    osc.start(spec.start);
    return osc;
  }

  private attachVibrato(osc: OscillatorNode, cents: number, start: number, end: number): void {
    const lfo = this.context.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = VIBRATO_RATE_HZ;
    const depth = this.context.createGain();
    depth.gain.value = cents;
    lfo.connect(depth);
    depth.connect(osc.detune);
    lfo.start(start);
    lfo.stop(end + STOP_MARGIN);
    lfo.onended = () => {
      lfo.disconnect();
      depth.disconnect();
    };
  }

  private createNoise(start: number): AudioBufferSourceNode {
    const source = this.context.createBufferSource();
    source.buffer = this.getNoiseBuffer();
    source.loop = true;
    // Décalage aléatoire pour que deux bruits consécutifs ne soient pas identiques.
    source.start(start, this.rng() * (NOISE_SECONDS - 1));
    return source;
  }

  private getNoiseBuffer(): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const { sampleRate } = this.context;
    const length = Math.floor(sampleRate * NOISE_SECONDS);
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = this.rng() * 2 - 1;
    this.noiseBuffer = buffer;
    return buffer;
  }

  /** Onde rectangulaire de rapport cyclique donné, par série de Fourier. */
  private pulseWave(duty: number): PeriodicWave {
    const cached = this.pulseWaves.get(duty);
    if (cached) return cached;
    const real = new Float32Array(PULSE_HARMONICS + 1);
    const imag = new Float32Array(PULSE_HARMONICS + 1);
    for (let n = 1; n <= PULSE_HARMONICS; n += 1) {
      real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
    }
    const wave = this.context.createPeriodicWave(real, imag);
    this.pulseWaves.set(duty, wave);
    return wave;
  }

  private createFilter(spec: FilterSpec, start: number, end: number): BiquadFilterNode {
    const filter = this.context.createBiquadFilter();
    filter.type = spec.type;
    filter.Q.value = spec.q ?? 1;
    filter.frequency.setValueAtTime(Math.max(spec.frequency, 10), start);
    if (spec.frequencyEnd !== undefined && spec.frequencyEnd > 0) {
      filter.frequency.exponentialRampToValueAtTime(spec.frequencyEnd, end);
    }
    return filter;
  }
}

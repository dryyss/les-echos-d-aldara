/**
 * Bruitages synthétisés (data/audio/sfx.json) et bips de voix des dialogues.
 * La partie calcul (fréquences des répétitions, variation de hauteur,
 * validation) est pure ; seules playSfx et voiceBlip touchent la Web Audio.
 */
import type { VoiceData } from '../../data/types';
import type { WaveName } from './patterns';
import { isRecord, isWaveName } from './patterns';
import type { Synth } from './Synth';

/** Définition d'un bruitage, voir docs/technique/format-audio.md. */
export interface SfxDef {
  wave: WaveName;
  freq: number;
  /** Glissando (une seule répétition) ou hauteur de la dernière répétition (repeat > 1). */
  freqEnd?: number;
  duration: number;
  volume: number;
  attack?: number;
  decay?: number;
  vibrato?: number;
  lowpass?: number;
  highpass?: number;
  /** Nombre de répétitions rapides. */
  repeat?: number;
  /** Délai entre deux répétitions en secondes (défaut : la durée). */
  interval?: number;
}

/** Variation aléatoire de hauteur d'un bip de voix (±8 %). */
export const VOICE_PITCH_VARIATION = 0.08;
const VOICE_VOLUME = 0.22;
const MAX_SFX_DURATION = 5;

const SFX_KEYS: ReadonlySet<string> = new Set([
  'wave',
  'freq',
  'freqEnd',
  'duration',
  'volume',
  'attack',
  'decay',
  'vibrato',
  'lowpass',
  'highpass',
  'repeat',
  'interval',
]);

/**
 * Fréquence de chaque répétition. Avec freqEnd et plusieurs répétitions, la
 * hauteur monte (ou descend) par paliers égaux de freq à freqEnd : c'est ce qui
 * rend « niveau » ou « victoire-court » mélodiques.
 */
export function sfxRepeatFrequencies(def: SfxDef): number[] {
  const count = Math.max(1, Math.floor(def.repeat ?? 1));
  if (count === 1 || def.freqEnd === undefined) return Array.from({ length: count }, () => def.freq);
  const ratio = def.freqEnd / def.freq;
  return Array.from({ length: count }, (_, i) => def.freq * ratio ** (i / (count - 1)));
}

export function playSfx(
  synth: Synth,
  def: SfxDef,
  start: number = synth.now,
  destination: AudioNode = synth.bus('sfx'),
): void {
  const frequencies = sfxRepeatFrequencies(def);
  const interval = def.interval ?? def.duration;
  const glide = frequencies.length === 1 ? def.freqEnd : undefined;
  frequencies.forEach((frequency, i) => {
    synth.playTone(
      {
        wave: def.wave,
        frequency,
        frequencyEnd: glide,
        start: start + i * interval,
        duration: def.duration,
        volume: def.volume,
        attack: def.attack,
        decay: def.decay,
        vibrato: def.vibrato,
        lowpass: def.lowpass,
        highpass: def.highpass,
      },
      destination,
    );
  });
}

/** Hauteur d'un bip : la hauteur de base variée de ±8 % au hasard. */
export function voiceBlipFrequency(pitch: number, rng: () => number): number {
  return pitch * (1 + (rng() * 2 - 1) * VOICE_PITCH_VARIATION);
}

export function voiceBlip(
  synth: Synth,
  voice: VoiceData,
  rng: () => number,
  destination: AudioNode = synth.bus('voice'),
): void {
  const duration = Math.max(0.02, voice.length / 1000);
  synth.playTone(
    {
      wave: voice.wave,
      frequency: voiceBlipFrequency(voice.pitch, rng),
      start: synth.now,
      duration,
      volume: VOICE_VOLUME,
      attack: 0.003,
      release: 0.015,
      // La dent de scie (Varn) est adoucie par un passe-bas, comme le demande la spec.
      lowpass: voice.wave === 'sawtooth' ? voice.pitch * 6 : undefined,
    },
    destination,
  );
}

type Report = (message: string) => void;

function checkNumber(
  def: Record<string, unknown>,
  key: string,
  fail: Report,
  options: { required?: boolean; min?: number; max?: number; integer?: boolean } = {},
): void {
  const value = def[key];
  if (value === undefined) {
    if (options.required) fail(`${key} manquant`);
    return;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) return fail(`${key} doit être un nombre`);
  if (options.integer && !Number.isInteger(value)) return fail(`${key} doit être un entier`);
  if (options.min !== undefined && value < options.min) return fail(`${key} doit être ≥ ${options.min}`);
  if (options.max !== undefined && value > options.max) fail(`${key} doit être ≤ ${options.max}`);
}

function validateSfxDef(id: string, def: unknown, report: Report): void {
  const fail: Report = (message) => report(`${id} : ${message}`);
  if (!/^[a-z0-9-]+$/.test(id)) fail('identifiant non kebab-case');
  if (!isRecord(def)) return fail('doit être un objet');
  for (const key of Object.keys(def)) {
    if (!SFX_KEYS.has(key)) fail(`champ inconnu « ${key} »`);
  }
  if (!isWaveName(def.wave)) fail(`onde inconnue « ${String(def.wave)} »`);
  checkNumber(def, 'freq', fail, { required: true, min: 1 });
  checkNumber(def, 'freqEnd', fail, { min: 1 });
  checkNumber(def, 'duration', fail, { required: true, min: 0.005, max: MAX_SFX_DURATION });
  checkNumber(def, 'volume', fail, { required: true, min: 0.01, max: 1 });
  checkNumber(def, 'attack', fail, { min: 0 });
  checkNumber(def, 'decay', fail, { min: 0 });
  checkNumber(def, 'vibrato', fail, { min: 0 });
  checkNumber(def, 'lowpass', fail, { min: 10 });
  checkNumber(def, 'highpass', fail, { min: 10 });
  checkNumber(def, 'repeat', fail, { min: 1, integer: true });
  checkNumber(def, 'interval', fail, { min: 0.005 });
}

/** Vérifie le contenu brut de sfx.json et renvoie la liste des problèmes. */
export function validateSfx(defs: unknown): string[] {
  if (!isRecord(defs)) return ['sfx.json doit être un objet { identifiant: définition }.'];
  const errors: string[] = [];
  for (const [id, def] of Object.entries(defs)) {
    validateSfxDef(id, def, (message) => errors.push(message));
  }
  return errors;
}

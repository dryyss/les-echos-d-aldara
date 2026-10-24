/**
 * Lecture et validation des patterns musicaux textuels décrits dans
 * docs/technique/format-audio.md. Module pur : ni Web Audio, ni Phaser.
 */

export type WaveName =
  | 'square'
  | 'triangle'
  | 'sawtooth'
  | 'sine'
  | 'noise'
  | 'pulse25'
  | 'pulse12';

export const WAVE_NAMES: readonly WaveName[] = [
  'square',
  'triangle',
  'sawtooth',
  'sine',
  'noise',
  'pulse25',
  'pulse12',
];

export type DrumKind = 'k' | 's' | 'h';

/** Volume maximal d'une piste : au-delà, quatre pistes saturent la sortie. */
export const MAX_TRACK_VOLUME = 0.35;

/** Une piste d'un morceau (data/audio/music/<id>.json). */
export interface MusicTrack {
  name: string;
  wave: WaveName;
  /** De 0 à 0.35. */
  volume: number;
  pattern: string;
  /** Décalage en cents, pour épaissir. */
  detune?: number;
  /** Enveloppe en secondes (défaut 0.01). */
  attack?: number;
  /** Enveloppe en secondes (défaut 0.05). */
  release?: number;
  /** Profondeur du vibrato en cents (défaut 0). */
  vibrato?: number;
  /** Transpose toute la piste de N octaves. */
  octave?: number;
  /** Les accords sont arpégés rapidement au lieu d'être joués ensemble. */
  arpeggio?: boolean;
}

/** Un morceau complet. */
export interface MusicData {
  id: string;
  title: string;
  bpm: number;
  /** Pas par temps (4 par défaut dans les fichiers : une double-croche). */
  stepsPerBeat: number;
  loop: boolean;
  tracks: MusicTrack[];
}

/** Une note, un silence ou une percussion issu d'un pattern. */
export interface ParsedNote {
  /** Pas de départ, à partir de 0. */
  step: number;
  lengthSteps: number;
  /** Fréquence en Hz ; null pour un silence ou une percussion. */
  frequency: number | null;
  /** Numéro MIDI (C4 = 60) ; null pour un silence ou une percussion. */
  midi: number | null;
  drum?: DrumKind;
  /** Fréquences de toutes les notes d'un accord (la première est aussi dans frequency). */
  chord?: number[];
}

export class PatternError extends Error {
  constructor(
    message: string,
    readonly position: number,
    readonly token: string,
  ) {
    super(`${message} (jeton « ${token} », position ${position})`);
    this.name = 'PatternError';
  }
}

interface Token {
  text: string;
  position: number;
}

const SEMITONES: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NOTE_NAME_RE = /^([A-G])(#|b)?([0-8])$/;
const NOTE_TOKEN_RE = /^([A-G](?:#|b)?\d)(?::(\d+))?$/;
const SILENCE_RE = /^\.(?::(\d+))?$/;
const TIE_RE = /^~(?::(\d+))?$/;
const DRUM_RE = /^([ksh])(?::(\d+))?$/;
const CHORD_RE = /^\[([^\]]*)\](?::(\d+))?$/;

export function isWaveName(value: unknown): value is WaveName {
  return typeof value === 'string' && (WAVE_NAMES as readonly string[]).includes(value);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Durée d'un pas en secondes. */
export function stepSeconds(bpm: number, stepsPerBeat: number): number {
  return 60 / bpm / stepsPerBeat;
}

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** « C4 » donne 60, « A4 » donne 69. Dièses (#) et bémols (b) acceptés, octaves 0 à 8. */
export function noteToMidi(name: string): number {
  return midiOf({ text: name, position: 0 }, name);
}

/** « A4 » donne 440. */
export function noteToFrequency(name: string): number {
  return midiToFrequency(noteToMidi(name));
}

function midiOf(token: Token, name: string): number {
  const match = NOTE_NAME_RE.exec(name);
  if (!match) throw new PatternError(`Nom de note invalide « ${name} »`, token.position, token.text);
  const [, letter = '', accidental = '', octave = '4'] = match;
  const shift = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  return 12 * (Number(octave) + 1) + (SEMITONES[letter] ?? 0) + shift;
}

function isSpace(ch: string): boolean {
  return /\s/.test(ch);
}

/** Découpe sur les espaces, en gardant les accords « [C4 E4 G4]:4 » entiers. */
function tokenize(pattern: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < pattern.length) {
    if (isSpace(pattern.charAt(i))) {
      i += 1;
      continue;
    }
    const start = i;
    if (pattern.charAt(i) === '[') {
      const close = pattern.indexOf(']', i);
      if (close === -1) throw new PatternError('Accord non fermé', start, pattern.slice(start));
      i = close + 1;
    }
    while (i < pattern.length && !isSpace(pattern.charAt(i))) i += 1;
    tokens.push({ text: pattern.slice(start, i), position: start });
  }
  return tokens;
}

function parseDuration(raw: string | undefined, token: Token): number {
  if (raw === undefined) return 1;
  const steps = Number(raw);
  if (!Number.isInteger(steps) || steps < 1) {
    throw new PatternError('Durée invalide, il faut un entier positif', token.position, token.text);
  }
  return steps;
}

type NoteBody = Omit<ParsedNote, 'step'>;

function readChord(token: Token, inner: string, lengthSteps: number): NoteBody {
  const names = inner.trim().split(/\s+/).filter(Boolean);
  if (names.length === 0) throw new PatternError('Accord vide', token.position, token.text);
  const midis = names.map((name) => midiOf(token, name));
  const chord = midis.map(midiToFrequency);
  return { lengthSteps, frequency: chord[0] ?? null, midi: midis[0] ?? null, chord };
}

function readToken(token: Token): NoteBody {
  const silence = SILENCE_RE.exec(token.text);
  if (silence) return { lengthSteps: parseDuration(silence[1], token), frequency: null, midi: null };

  const drum = DRUM_RE.exec(token.text);
  if (drum) {
    const kind = drum[1] as DrumKind;
    return { lengthSteps: parseDuration(drum[2], token), frequency: null, midi: null, drum: kind };
  }

  const chord = CHORD_RE.exec(token.text);
  if (chord) return readChord(token, chord[1] ?? '', parseDuration(chord[2], token));

  const note = NOTE_TOKEN_RE.exec(token.text);
  if (note) {
    const midi = midiOf(token, note[1] ?? '');
    return { lengthSteps: parseDuration(note[2], token), frequency: midiToFrequency(midi), midi };
  }

  throw new PatternError('Jeton inconnu', token.position, token.text);
}

/**
 * Transforme un pattern en liste de notes placées sur la grille des pas.
 * Les silences sont conservés (frequency null) ; « ~ » allonge l'élément précédent.
 */
export function parsePattern(pattern: string): ParsedNote[] {
  const notes: ParsedNote[] = [];
  let step = 0;
  for (const token of tokenize(pattern)) {
    if (token.text === '|') continue;
    const tie = TIE_RE.exec(token.text);
    if (tie) {
      const last = notes[notes.length - 1];
      if (!last) throw new PatternError('Liaison sans note précédente', token.position, token.text);
      const extra = parseDuration(tie[1], token);
      last.lengthSteps += extra;
      step += extra;
      continue;
    }
    const body = readToken(token);
    notes.push({ ...body, step });
    step += body.lengthSteps;
  }
  return notes;
}

export function notesLength(notes: readonly ParsedNote[]): number {
  return notes.reduce((total, note) => total + note.lengthSteps, 0);
}

/** Longueur totale d'un pattern en pas. */
export function patternLength(pattern: string): number {
  return notesLength(parsePattern(pattern));
}

/** Longueur d'un morceau en pas (celle de sa première piste). */
export function musicLengthSteps(data: MusicData): number {
  const first = data.tracks[0];
  return first ? patternLength(first.pattern) : 0;
}

type Report = (message: string) => void;

function checkOptionalNumber(
  track: Record<string, unknown>,
  key: string,
  fail: Report,
  options: { min?: number; integer?: boolean } = {},
): void {
  const value = track[key];
  if (value === undefined) return;
  if (typeof value !== 'number' || !Number.isFinite(value)) return fail(`${key} doit être un nombre`);
  if (options.integer && !Number.isInteger(value)) return fail(`${key} doit être un entier`);
  if (options.min !== undefined && value < options.min) fail(`${key} doit être ≥ ${options.min}`);
}

/** Vérifie une piste et renvoie sa longueur en pas, ou -1 si elle est illisible. */
function validateTrack(track: unknown, index: number, report: Report): number {
  if (!isRecord(track)) {
    report(`piste ${index} : doit être un objet`);
    return -1;
  }
  const name = typeof track.name === 'string' ? track.name : `#${index}`;
  const fail: Report = (message) => report(`piste ${name} : ${message}`);

  if (typeof track.name !== 'string') fail('name manquant');
  if (!isWaveName(track.wave)) fail(`onde inconnue « ${String(track.wave)} »`);
  if (typeof track.volume !== 'number' || track.volume <= 0 || track.volume > MAX_TRACK_VOLUME) {
    fail(`volume hors limites (0 < volume ≤ ${MAX_TRACK_VOLUME})`);
  }
  checkOptionalNumber(track, 'detune', fail);
  checkOptionalNumber(track, 'attack', fail, { min: 0 });
  checkOptionalNumber(track, 'release', fail, { min: 0 });
  checkOptionalNumber(track, 'vibrato', fail, { min: 0 });
  checkOptionalNumber(track, 'octave', fail, { integer: true });
  if (track.arpeggio !== undefined && typeof track.arpeggio !== 'boolean') {
    fail('arpeggio doit être un booléen');
  }
  if (typeof track.pattern !== 'string') {
    fail('pattern manquant');
    return -1;
  }

  let notes: ParsedNote[];
  try {
    notes = parsePattern(track.pattern);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
    return -1;
  }
  const hasDrums = notes.some((note) => note.drum !== undefined);
  const hasNotes = notes.some((note) => note.frequency !== null);
  if (track.wave === 'noise' && hasNotes) fail('une piste noise ne contient que k, s et h');
  if (track.wave !== 'noise' && hasDrums) fail('les percussions k, s, h vont sur une piste noise');
  const length = notesLength(notes);
  if (length === 0) fail('pattern vide');
  return length;
}

/**
 * Vérifie un morceau (données JSON brutes) et renvoie la liste des problèmes,
 * vide si tout est correct.
 */
export function validateMusic(data: unknown): string[] {
  if (!isRecord(data)) return ['Le morceau doit être un objet JSON.'];
  const errors: string[] = [];
  const label = typeof data.id === 'string' ? data.id : '?';
  const report: Report = (message) => errors.push(`${label} : ${message}`);

  if (typeof data.id !== 'string' || !/^[a-z0-9-]+$/.test(data.id)) {
    report('id manquant ou non kebab-case');
  }
  if (typeof data.title !== 'string' || data.title.length === 0) report('title manquant');
  if (typeof data.bpm !== 'number' || !(data.bpm > 0)) report('bpm doit être un nombre positif');
  if (!Number.isInteger(data.stepsPerBeat) || (data.stepsPerBeat as number) < 1) {
    report('stepsPerBeat doit être un entier positif');
  }
  if (typeof data.loop !== 'boolean') report('loop doit être un booléen');
  if (!Array.isArray(data.tracks) || data.tracks.length === 0) {
    report('tracks doit être une liste non vide');
    return errors;
  }

  const lengths = data.tracks.map((track, index) => validateTrack(track, index, report));
  const readable = lengths.filter((length) => length > 0);
  if (new Set(readable).size > 1) {
    report(`pistes de longueurs différentes : ${lengths.join(', ')} pas`);
  }
  return errors;
}

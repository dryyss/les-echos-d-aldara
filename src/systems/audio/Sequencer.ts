/**
 * Lecteur de MusicData : planifie les notes en avance sur l'horloge du
 * contexte audio (lookahead 120 ms, tic toutes les 25 ms) et boucle sans trou
 * en repartant de la fin exacte du morceau en secondes.
 */
import type { MusicData, MusicTrack, ParsedNote } from './patterns';
import { notesLength, parsePattern, stepSeconds } from './patterns';
import type { Synth, ToneParams } from './Synth';

export const LOOKAHEAD_SECONDS = 0.12;
export const TICK_MS = 25;
const START_DELAY_SECONDS = 0.05;
/** Durée de chaque note d'un accord arpégé. */
const ARPEGGIO_NOTE_SECONDS = 0.04;
const DEFAULT_ATTACK = 0.01;
const DEFAULT_RELEASE = 0.05;
/** Marge laissée aux dernières notes avant de signaler la fin d'un morceau sans boucle. */
const TAIL_SECONDS = 1;

interface ScheduledTrack {
  track: MusicTrack;
  notesByStep: Map<number, ParsedNote[]>;
}

type SequencerState = 'idle' | 'playing' | 'stopping' | 'stopped';

function groupByStep(notes: ParsedNote[]): Map<number, ParsedNote[]> {
  const map = new Map<number, ParsedNote[]>();
  for (const note of notes) {
    if (note.frequency === null && note.drum === undefined) continue;
    const list = map.get(note.step) ?? [];
    list.push(note);
    map.set(note.step, list);
  }
  return map;
}

export class Sequencer {
  /** Gain propre au morceau, pour les fondus croisés. */
  readonly output: GainNode;
  /** Appelé quand un morceau sans boucle se termine, ou après un stop. */
  onEnded: (() => void) | null = null;

  private data: MusicData | null = null;
  private tracks: ScheduledTrack[] = [];
  private lengthSteps = 0;
  private secondsPerStep = 0;
  private step = 0;
  private nextStepTime = 0;
  private volume = 1;
  private timer: ReturnType<typeof setInterval> | null = null;
  private pausedAt: number | null = null;
  private state: SequencerState = 'idle';

  constructor(
    private readonly synth: Synth,
    destination: AudioNode,
  ) {
    this.output = synth.context.createGain();
    this.output.connect(destination);
  }

  get music(): MusicData | null {
    return this.data;
  }

  get isPlaying(): boolean {
    return this.state === 'playing';
  }

  /** Prochain pas à planifier (débogage et tests). */
  get currentStep(): number {
    return this.step;
  }

  play(data: MusicData, startTime: number = this.synth.now + START_DELAY_SECONDS): void {
    if (this.state !== 'idle') return;
    const parsed = data.tracks.map((track) => parsePattern(track.pattern));
    this.data = data;
    this.tracks = data.tracks.map((track, i) => ({
      track,
      notesByStep: groupByStep(parsed[i] ?? []),
    }));
    this.lengthSteps = Math.max(0, ...parsed.map(notesLength));
    this.secondsPerStep = stepSeconds(data.bpm, data.stepsPerBeat);
    this.step = 0;
    this.nextStepTime = startTime;
    this.state = 'playing';
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.tick();
  }

  /** Arrête le morceau, avec un fondu de sortie optionnel. */
  stop(fadeOutSeconds = 0): void {
    if (this.state === 'stopping' || this.state === 'stopped') return;
    if (this.state === 'idle' || this.pausedAt !== null || fadeOutSeconds <= 0) {
      this.dispose();
      return;
    }
    this.state = 'stopping';
    this.setVolume(0, fadeOutSeconds);
    setTimeout(() => this.dispose(), fadeOutSeconds * 1000 + 50);
  }

  pause(): void {
    if (this.state !== 'playing' || this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
    this.pausedAt = this.synth.now;
  }

  resume(): void {
    if (this.pausedAt === null || this.state !== 'playing') return;
    this.nextStepTime += this.synth.now - this.pausedAt;
    this.pausedAt = null;
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.tick();
  }

  /** Volume du morceau (0 à 1), avec une rampe optionnelle en secondes. */
  setVolume(volume: number, rampSeconds = 0): void {
    const gain = this.output.gain;
    const now = this.synth.now;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(this.volume, now);
    if (rampSeconds > 0) gain.linearRampToValueAtTime(volume, now + rampSeconds);
    else gain.setValueAtTime(volume, now);
    this.volume = volume;
  }

  private tick(): void {
    if (!this.data || this.lengthSteps === 0) return;
    const horizon = this.synth.now + LOOKAHEAD_SECONDS;
    while (this.nextStepTime < horizon) {
      if (this.step >= this.lengthSteps) {
        if (!this.data.loop) {
          this.finishAfterTail();
          return;
        }
        this.step = 0;
      }
      this.scheduleStep(this.step, this.nextStepTime);
      this.step += 1;
      this.nextStepTime += this.secondsPerStep;
    }
  }

  private scheduleStep(step: number, time: number): void {
    for (const { track, notesByStep } of this.tracks) {
      for (const note of notesByStep.get(step) ?? []) this.scheduleNote(track, note, time);
    }
  }

  private scheduleNote(track: MusicTrack, note: ParsedNote, time: number): void {
    if (note.drum !== undefined) {
      this.synth.playDrum(note.drum, time, track.volume, this.output);
      return;
    }
    if (note.frequency === null) return;
    const duration = note.lengthSteps * this.secondsPerStep;
    const transpose = 2 ** (track.octave ?? 0);
    const frequencies = (note.chord ?? [note.frequency]).map((f) => f * transpose);
    if (note.chord && track.arpeggio) {
      this.scheduleArpeggio(track, frequencies, time, duration);
      return;
    }
    const volume = track.volume / Math.sqrt(frequencies.length);
    for (const frequency of frequencies) {
      this.synth.playTone(this.toneFor(track, frequency, time, duration, volume), this.output);
    }
  }

  private scheduleArpeggio(
    track: MusicTrack,
    frequencies: number[],
    time: number,
    duration: number,
  ): void {
    const count = Math.max(1, Math.floor(duration / ARPEGGIO_NOTE_SECONDS));
    for (let i = 0; i < count; i += 1) {
      const frequency = frequencies[i % frequencies.length];
      if (frequency === undefined) return;
      const tone = this.toneFor(
        track,
        frequency,
        time + i * ARPEGGIO_NOTE_SECONDS,
        ARPEGGIO_NOTE_SECONDS,
        track.volume,
      );
      this.synth.playTone({ ...tone, attack: 0.002, release: 0.008 }, this.output);
    }
  }

  private toneFor(
    track: MusicTrack,
    frequency: number,
    start: number,
    duration: number,
    volume: number,
  ): ToneParams {
    return {
      wave: track.wave,
      frequency,
      start,
      duration,
      volume,
      attack: track.attack ?? DEFAULT_ATTACK,
      release: track.release ?? DEFAULT_RELEASE,
      detune: track.detune,
      vibrato: track.vibrato,
    };
  }

  private finishAfterTail(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    const remaining = Math.max(0, this.nextStepTime - this.synth.now) + TAIL_SECONDS;
    setTimeout(() => this.dispose(), remaining * 1000);
  }

  private dispose(): void {
    if (this.state === 'stopped') return;
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.pausedAt = null;
    this.state = 'stopped';
    this.output.disconnect();
    this.onEnded?.();
  }
}

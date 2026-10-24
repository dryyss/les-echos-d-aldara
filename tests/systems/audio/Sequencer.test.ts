import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MusicData, MusicTrack } from '../../../src/systems/audio/patterns';
import { Sequencer } from '../../../src/systems/audio/Sequencer';
import { Synth } from '../../../src/systems/audio/Synth';
import { FakeAudioContext, FakeGain } from './fakeAudioContext';

const C4 = 261.63;

function music(tracks: Partial<MusicTrack>[], overrides: Partial<MusicData> = {}): MusicData {
  return {
    id: 'test',
    title: 'Test',
    bpm: 120,
    stepsPerBeat: 4,
    loop: true,
    tracks: tracks.map((track, i) => ({
      name: `piste-${i}`,
      wave: 'square',
      volume: 0.2,
      pattern: 'C4',
      ...track,
    })),
    ...overrides,
  };
}

function setup() {
  const ctx = new FakeAudioContext();
  const synth = new Synth(ctx.asContext(), () => 0.5);
  const sequencer = new Sequencer(synth, synth.bus('music'));
  return { ctx, synth, sequencer };
}

function startsOf(ctx: FakeAudioContext, frequency: number): number[] {
  return ctx.oscillators
    .filter((osc) => Math.abs(osc.frequency.value - frequency) < 0.5)
    .map((osc) => osc.startedAt ?? -1);
}

describe('Sequencer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('planifie les notes sur la grille et boucle sans trou', () => {
    const { ctx, sequencer } = setup();
    // 120 bpm, 4 pas par temps : un pas dure 0,125 s, la boucle de 4 pas dure 0,5 s.
    sequencer.play(music([{ pattern: 'C4 D4 E4 F4' }]), 0.1);
    ctx.run(1.3);

    const starts = startsOf(ctx, C4);
    expect(starts).toHaveLength(3);
    expect(starts[0]).toBeCloseTo(0.1, 6);
    expect(starts[1]).toBeCloseTo(0.6, 6);
    expect(starts[2]).toBeCloseTo(1.1, 6);
    expect(ctx.melodicOscillators().length).toBeGreaterThanOrEqual(10);
    expect(sequencer.isPlaying).toBe(true);
  });

  it('ne planifie jamais au-delà de la fenêtre d’avance', () => {
    const { ctx, sequencer } = setup();
    sequencer.play(music([{ pattern: 'C4 C4 C4 C4' }]), 0);
    ctx.run(0.5);
    const latest = Math.max(...ctx.melodicOscillators().map((osc) => osc.startedAt ?? 0));
    expect(latest).toBeLessThan(ctx.currentTime + 0.125);
  });

  it('respecte la durée des notes en pas', () => {
    const { ctx, sequencer } = setup();
    sequencer.play(music([{ pattern: 'C4:4' }], { loop: false }), 0);
    ctx.run(0.1);
    const osc = ctx.melodicOscillators()[0]!;
    // 4 pas de 0,125 s, plus la marge d'arrêt après l'enveloppe (0,05 s).
    expect(osc.stoppedAt! - osc.startedAt!).toBeCloseTo(0.55, 6);
  });

  it('termine un morceau sans boucle et prévient onEnded', () => {
    const { ctx, sequencer } = setup();
    const onEnded = vi.fn();
    sequencer.onEnded = onEnded;
    sequencer.play(music([{ pattern: 'C4 D4 E4 F4' }], { loop: false }), 0);
    ctx.run(0.5);
    expect(ctx.melodicOscillators()).toHaveLength(4);
    expect(onEnded).not.toHaveBeenCalled();
    ctx.run(2);
    expect(ctx.melodicOscillators()).toHaveLength(4);
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(sequencer.isPlaying).toBe(false);
  });

  it('s’arrête avec un fondu puis libère sa sortie', () => {
    const { ctx, sequencer } = setup();
    const onEnded = vi.fn();
    sequencer.onEnded = onEnded;
    sequencer.play(music([{ pattern: 'C4 C4 C4 C4' }]), 0);
    ctx.run(0.3);
    sequencer.stop(0.5);
    expect(sequencer.isPlaying).toBe(false);
    const output = sequencer.output as unknown as FakeGain;
    const ramp = output.gain.events.find((e) => e.type === 'linear' && e.value === 0);
    expect(ramp?.time).toBeCloseTo(0.3 + 0.5, 6);
    const scheduledBeforeStop = ctx.melodicOscillators().length;
    ctx.run(0.3);
    // Le morceau continue d'être planifié pendant le fondu.
    expect(ctx.melodicOscillators().length).toBeGreaterThan(scheduledBeforeStop);
    ctx.run(0.5);
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(output.outputs).toHaveLength(0);
    const total = ctx.melodicOscillators().length;
    ctx.run(0.5);
    expect(ctx.melodicOscillators()).toHaveLength(total);
  });

  it('pause et reprise décalent la grille sans perdre de notes', () => {
    const { ctx, sequencer } = setup();
    sequencer.play(music([{ pattern: 'C4 C4 C4 C4' }]), 0);
    ctx.run(0.3);
    sequencer.pause();
    const beforePause = ctx.melodicOscillators().length;
    ctx.run(1);
    expect(ctx.melodicOscillators()).toHaveLength(beforePause);
    sequencer.resume();
    ctx.run(0.3);
    const resumed = ctx.melodicOscillators().slice(beforePause);
    expect(resumed.length).toBeGreaterThan(0);
    expect(Math.min(...resumed.map((osc) => osc.startedAt ?? 0))).toBeGreaterThanOrEqual(1.3 - 1e-6);
  });

  it('joue les accords ensemble, ou arpégés si la piste le demande', () => {
    const together = setup();
    together.sequencer.play(music([{ pattern: '[C4 E4 G4]:4' }], { loop: false }), 0);
    together.ctx.run(0.1);
    const chord = together.ctx.melodicOscillators();
    expect(chord).toHaveLength(3);
    expect(new Set(chord.map((osc) => osc.startedAt)).size).toBe(1);

    const arpeggio = setup();
    arpeggio.sequencer.play(music([{ pattern: '[C4 E4 G4]:4', arpeggio: true }], { loop: false }), 0);
    arpeggio.ctx.run(0.1);
    const notes = arpeggio.ctx.melodicOscillators();
    // 0,5 s d'accord découpé en notes de 0,04 s.
    expect(notes).toHaveLength(12);
    expect(notes[1]!.startedAt! - notes[0]!.startedAt!).toBeCloseTo(0.04, 6);
    expect(notes.map((osc) => Math.round(osc.frequency.value)).slice(0, 3)).toEqual([262, 330, 392]);
  });

  it('transpose la piste avec octave', () => {
    const { ctx, sequencer } = setup();
    sequencer.play(music([{ pattern: 'C4', octave: 1 }], { loop: false }), 0);
    ctx.run(0.1);
    expect(ctx.melodicOscillators()[0]?.frequency.value).toBeCloseTo(C4 * 2, 1);
  });

  it('déclenche les percussions sur une source de bruit', () => {
    const { ctx, sequencer } = setup();
    sequencer.play(music([{ wave: 'noise', volume: 0.1, pattern: 'k s h .' }], { loop: false }), 0);
    ctx.run(0.5);
    expect(ctx.noises).toHaveLength(3);
    expect(ctx.filters.map((filter) => filter.type)).toEqual(['lowpass', 'bandpass', 'highpass']);
    // La grosse caisse ajoute un corps sinusoïdal grave.
    expect(ctx.oscillators.filter((osc) => osc.type === 'sine')).toHaveLength(1);
  });

  it('ignore un second play et laisse le gain de sortie piloter le volume', () => {
    const { ctx, sequencer } = setup();
    sequencer.play(music([{ pattern: 'C4 C4 C4 C4' }]), 0);
    sequencer.play(music([{ pattern: 'E4 E4 E4 E4' }]), 0);
    ctx.run(0.1);
    expect(startsOf(ctx, 329.63)).toHaveLength(0);
    sequencer.setVolume(0.5, 0.2);
    const last = (sequencer.output as unknown as FakeGain).gain.events.at(-1);
    expect(last).toMatchObject({ type: 'linear', value: 0.5 });
  });
});

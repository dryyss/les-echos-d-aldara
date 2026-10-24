/**
 * Faux contexte Web Audio minimal pour tester le moteur sans navigateur.
 * Il enregistre les nœuds créés et les automatisations de paramètres.
 */
import { vi } from 'vitest';

export interface ParamEvent {
  type: 'set' | 'linear' | 'exponential' | 'target';
  value: number;
  time: number;
}

export class FakeParam {
  value = 0;
  readonly events: ParamEvent[] = [];

  setValueAtTime(value: number, time: number): this {
    return this.record('set', value, time);
  }

  linearRampToValueAtTime(value: number, time: number): this {
    return this.record('linear', value, time);
  }

  exponentialRampToValueAtTime(value: number, time: number): this {
    return this.record('exponential', value, time);
  }

  setTargetAtTime(value: number, time: number): this {
    return this.record('target', value, time);
  }

  cancelScheduledValues(): this {
    return this;
  }

  private record(type: ParamEvent['type'], value: number, time: number): this {
    this.events.push({ type, value, time });
    this.value = value;
    return this;
  }
}

export class FakeNode {
  readonly outputs: unknown[] = [];
  connect(target: unknown): unknown {
    this.outputs.push(target);
    return target;
  }
  disconnect(): void {
    this.outputs.length = 0;
  }
}

export class FakeGain extends FakeNode {
  readonly gain = new FakeParam();
  constructor() {
    super();
    this.gain.value = 1;
  }
}

export class FakeSource extends FakeNode {
  startedAt: number | null = null;
  stoppedAt: number | null = null;
  offset = 0;
  onended: (() => void) | null = null;

  start(when = 0, offset = 0): void {
    this.startedAt = when;
    this.offset = offset;
  }

  stop(when = 0): void {
    this.stoppedAt = when;
  }
}

export class FakeOscillator extends FakeSource {
  type = 'sine';
  periodic = false;
  readonly frequency = new FakeParam();
  readonly detune = new FakeParam();
  setPeriodicWave(): void {
    this.periodic = true;
  }
}

export class FakeBufferSource extends FakeSource {
  buffer: unknown = null;
  loop = false;
}

export class FakeFilter extends FakeNode {
  type = 'lowpass';
  readonly frequency = new FakeParam();
  readonly Q = new FakeParam();
}

export class FakeCompressor extends FakeNode {
  readonly threshold = new FakeParam();
  readonly knee = new FakeParam();
  readonly ratio = new FakeParam();
  readonly attack = new FakeParam();
  readonly release = new FakeParam();
}

export class FakeAudioContext {
  currentTime = 0;
  readonly sampleRate = 44100;
  state: 'suspended' | 'running' | 'closed' = 'running';
  readonly destination = new FakeNode();
  readonly oscillators: FakeOscillator[] = [];
  readonly noises: FakeBufferSource[] = [];
  readonly gains: FakeGain[] = [];
  readonly filters: FakeFilter[] = [];
  resumeCalls = 0;
  suspendCalls = 0;

  createGain(): FakeGain {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }

  createOscillator(): FakeOscillator {
    const osc = new FakeOscillator();
    this.oscillators.push(osc);
    return osc;
  }

  createBufferSource(): FakeBufferSource {
    const source = new FakeBufferSource();
    this.noises.push(source);
    return source;
  }

  createBiquadFilter(): FakeFilter {
    const filter = new FakeFilter();
    this.filters.push(filter);
    return filter;
  }

  createDynamicsCompressor(): FakeCompressor {
    return new FakeCompressor();
  }

  createBuffer(_channels: number, length: number): { getChannelData(): Float32Array } {
    const data = new Float32Array(length);
    return { getChannelData: () => data };
  }

  createPeriodicWave(): object {
    return {};
  }

  resume(): Promise<void> {
    this.state = 'running';
    this.resumeCalls += 1;
    return Promise.resolve();
  }

  suspend(): Promise<void> {
    this.state = 'suspended';
    this.suspendCalls += 1;
    return Promise.resolve();
  }

  asContext(): AudioContext {
    return this as unknown as AudioContext;
  }

  /** Notes mélodiques (hors LFO de vibrato et corps de grosse caisse). */
  melodicOscillators(): FakeOscillator[] {
    return this.oscillators.filter((osc) => osc.frequency.value > 160);
  }

  /** Fait avancer l'horloge audio et les timers factices par pas de 25 ms. */
  run(seconds: number): void {
    const ticks = Math.round((seconds * 1000) / 25);
    for (let i = 0; i < ticks; i += 1) {
      this.currentTime += 0.025;
      vi.advanceTimersByTime(25);
    }
  }
}

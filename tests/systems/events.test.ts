import { describe, expect, it, vi } from 'vitest';
import { TypedEmitter } from '../../src/systems/events';

interface TestEvents {
  coins: { coins: number };
  ping: undefined;
}

describe('TypedEmitter', () => {
  it('appelle les écouteurs avec la charge utile', () => {
    const emitter = new TypedEmitter<TestEvents>();
    const listener = vi.fn();
    emitter.on('coins', listener);
    emitter.emit('coins', { coins: 12 });
    expect(listener).toHaveBeenCalledWith({ coins: 12 });
  });

  it('désabonne avec off ou avec la fonction renvoyée', () => {
    const emitter = new TypedEmitter<TestEvents>();
    const a = vi.fn();
    const b = vi.fn();
    const offA = emitter.on('coins', a);
    emitter.on('coins', b);
    offA();
    emitter.off('coins', b);
    emitter.emit('coins', { coins: 1 });
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
    expect(emitter.listenerCount('coins')).toBe(0);
  });

  it('once ne déclenche qu’une fois', () => {
    const emitter = new TypedEmitter<TestEvents>();
    const listener = vi.fn();
    emitter.once('ping', listener);
    emitter.emit('ping', undefined);
    emitter.emit('ping', undefined);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('supporte un désabonnement pendant l’émission', () => {
    const emitter = new TypedEmitter<TestEvents>();
    const second = vi.fn();
    emitter.on('ping', () => emitter.off('ping', second));
    emitter.on('ping', second);
    emitter.emit('ping', undefined);
    expect(second).toHaveBeenCalledTimes(1);
    emitter.emit('ping', undefined);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('émettre sans écouteur ne fait rien', () => {
    const emitter = new TypedEmitter<TestEvents>();
    expect(() => emitter.emit('coins', { coins: 0 })).not.toThrow();
    emitter.removeAllListeners();
  });
});

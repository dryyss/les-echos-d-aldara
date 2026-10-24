import { describe, expect, it } from 'vitest';
import { actionForKey, directionsFromAxes, dominantDirection } from '../../src/game/input/actions';
import { InputState } from '../../src/game/input/InputState';

describe('actions clavier', () => {
  it('lie les flèches et ZQSD aux directions', () => {
    expect(actionForKey('ArrowUp')).toBe('up');
    expect(actionForKey('KeyZ')).toBe('up');
    expect(actionForKey('KeyQ')).toBe('left');
    expect(actionForKey('KeyD')).toBe('right');
    expect(actionForKey('Space')).toBe('confirm');
    expect(actionForKey('Escape')).toBe('cancel');
    expect(actionForKey('Tab')).toBe('menu');
    expect(actionForKey('KeyR')).toBe('wheel');
    expect(actionForKey('Digit1')).toBe('shortcut1');
    expect(actionForKey('KeyP')).toBeNull();
  });

  it('convertit les axes du stick en directions', () => {
    expect(directionsFromAxes(0, 0)).toEqual([]);
    expect(directionsFromAxes(-1, 0)).toEqual(['left']);
    expect(directionsFromAxes(0.7, -0.9)).toEqual(['right', 'up']);
  });

  it('choisit la direction appuyée en dernier', () => {
    const pressed = new Set<'up' | 'left'>(['up', 'left']);
    expect(dominantDirection(pressed, ['up', 'left'])).toBe('left');
    expect(dominantDirection(pressed, ['left', 'up'])).toBe('up');
    expect(dominantDirection(new Set(), [])).toBeNull();
  });
});

describe('InputState', () => {
  it('distingue appui instantané et maintien', () => {
    const input = new InputState();
    input.press('confirm');
    expect(input.justPressed('confirm')).toBe(true);
    expect(input.isDown('confirm')).toBe(true);
    input.endFrame(16);
    expect(input.justPressed('confirm')).toBe(false);
    expect(input.isDown('confirm')).toBe(true);
    expect(input.heldDuration('confirm')).toBe(16);
    input.release('confirm');
    expect(input.isDown('confirm')).toBe(false);
    expect(input.justReleased('confirm')).toBe(true);
  });

  it('ignore les répétitions d’appui', () => {
    const input = new InputState();
    input.press('up');
    input.endFrame(16);
    input.press('up');
    expect(input.justPressed('up')).toBe(false);
  });

  it('donne la direction la plus récente', () => {
    const input = new InputState();
    input.press('up');
    input.press('right');
    expect(input.direction()).toBe('right');
    input.release('right');
    expect(input.direction()).toBe('up');
    input.release('up');
    expect(input.direction()).toBeNull();
  });

  it('réserve les appuis au contexte du haut de la pile', () => {
    const input = new InputState();
    input.pushContext('dialogue');
    input.press('confirm');
    expect(input.justPressed('confirm', 'world')).toBe(false);
    expect(input.justPressed('confirm', 'dialogue')).toBe(true);
    expect(input.justPressed('confirm')).toBe(true);
    input.popContext('menu');
    expect(input.currentContext).toBe('dialogue');
    input.popContext('dialogue');
    expect(input.currentContext).toBe('world');
    input.popContext();
    expect(input.currentContext).toBe('world');
  });

  it('efface les appuis en cours au changement de contexte', () => {
    const input = new InputState();
    input.press('confirm');
    input.pushContext('menu');
    expect(input.justPressed('confirm')).toBe(false);
    expect(input.isDown('confirm')).toBe(true);
  });

  it('se réinitialise à la perte de focus', () => {
    const input = new InputState();
    input.press('left');
    input.press('run');
    input.reset();
    expect(input.isDown('left')).toBe(false);
    expect(input.direction()).toBeNull();
  });
});

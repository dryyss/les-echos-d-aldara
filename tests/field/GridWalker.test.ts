import { describe, expect, it } from 'vitest';
import { FACE_DELAY_MS, GridWalker, RUN_MS, WALK_MS } from '../../src/field/GridWalker';

const open = (): boolean => false;
const wall = (): boolean => true;

describe('GridWalker', () => {
  it('se tourne tout de suite et n’avance qu’après le délai', () => {
    const walker = new GridWalker(2, 2, 'down');
    expect(walker.idleTick('left', false, 16, open)).toEqual({ type: 'face', direction: 'left' });
    expect(walker.direction).toBe('left');
    expect(walker.idleTick('left', false, FACE_DELAY_MS - 1, open)).toBeNull();
    expect(walker.idleTick('left', false, 2, open)).toMatchObject({
      type: 'step',
      x: 1,
      y: 2,
      direction: 'left',
      duration: WALK_MS,
    });
    expect(walker.moving).toBe(true);
    expect(walker.x).toBe(1);
  });

  it('refuse un mur et reste sur place', () => {
    const walker = new GridWalker(0, 0, 'down');
    walker.idleTick('up', false, 0, wall);
    const command = walker.idleTick('up', false, FACE_DELAY_MS, wall);
    expect(command).toEqual({ type: 'face', direction: 'up' });
    expect(walker.x).toBe(0);
    expect(walker.y).toBe(0);
    expect(walker.moving).toBe(false);
  });

  it('enchaîne le pas suivant sans nouveau délai', () => {
    const walker = new GridWalker(1, 1, 'right');
    walker.idleTick('right', true, 0, open);
    walker.idleTick('right', true, FACE_DELAY_MS, open);
    const next = walker.finishStep('right', true, open);
    expect(next).toMatchObject({ type: 'step', x: 3, y: 1, duration: RUN_MS });
  });

  it('garde une seule direction en file pendant le pas', () => {
    const walker = new GridWalker(0, 0, 'down');
    walker.idleTick('down', false, 0, open);
    walker.idleTick('down', false, FACE_DELAY_MS, open);
    walker.queue('left');
    walker.queue('right');
    expect(walker.queued).toBe('right');
  });
});

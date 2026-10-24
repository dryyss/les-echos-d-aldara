import { describe, expect, it } from 'vitest';
import { CollisionGrid } from '../../src/field/CollisionGrid';

describe('CollisionGrid', () => {
  it('bloque hors limites et les GID positifs', () => {
    const grid = CollisionGrid.fromCollisionGids(3, 2, [0, 4, 0, 1, 0, 0]);
    expect(grid.isBlocked(0, 0)).toBe(false);
    expect(grid.isBlocked(1, 0)).toBe(true);
    expect(grid.isBlocked(0, 1)).toBe(true);
    expect(grid.isBlocked(-1, 0)).toBe(true);
    expect(grid.isBlocked(3, 0)).toBe(true);
  });

  it('met à jour une case occupée', () => {
    const grid = new CollisionGrid(2, 2, [false, false, false, false]);
    grid.setBlocked(1, 1);
    expect(grid.isBlocked(1, 1)).toBe(true);
    grid.clear(1, 1);
    expect(grid.isBlocked(1, 1)).toBe(false);
  });
});

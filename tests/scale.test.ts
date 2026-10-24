import { describe, expect, it } from 'vitest';
import { computeIntegerZoom } from '../src/utils/scale';

describe('computeIntegerZoom', () => {
  it('retourne le plus grand facteur entier qui rentre dans la fenêtre', () => {
    expect(computeIntegerZoom(1920, 1080, 400, 240)).toBe(4);
    expect(computeIntegerZoom(1280, 720, 400, 240)).toBe(3);
    expect(computeIntegerZoom(800, 600, 400, 240)).toBe(2);
  });

  it('est limité par la plus petite dimension', () => {
    expect(computeIntegerZoom(4000, 500, 400, 240)).toBe(2);
    expect(computeIntegerZoom(500, 4000, 400, 240)).toBe(1);
  });

  it('retombe sur un facteur fractionnaire si ×1 ne rentre pas', () => {
    expect(computeIntegerZoom(200, 120, 400, 240)).toBeCloseTo(0.5);
  });

  it('retourne 1 sur des entrées invalides', () => {
    expect(computeIntegerZoom(0, 0, 400, 240)).toBe(1);
    expect(computeIntegerZoom(800, 600, 0, 240)).toBe(1);
  });
});

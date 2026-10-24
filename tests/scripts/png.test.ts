import { describe, expect, it } from 'vitest';
import { crc32, decodePng, encodePng, pixelAt } from '../../scripts/lib/png.mjs';

describe('crc32', () => {
  it('calcule la valeur de référence pour « 123456789 »', () => {
    expect(crc32(Buffer.from('123456789', 'latin1'))).toBe(0xcbf43926);
  });

  it('renvoie 0 pour un tampon vide', () => {
    expect(crc32(Buffer.alloc(0))).toBe(0);
  });
});

describe('encodePng', () => {
  it('produit un PNG RGBA valide que decodePng relit à l’identique', () => {
    const width = 3;
    const height = 2;
    const rgba = Buffer.alloc(width * height * 4);
    rgba.set([255, 0, 0, 255], 0); // (0,0) rouge
    rgba.set([0, 255, 0, 128], 4); // (1,0) vert semi-transparent
    rgba.set([0, 0, 255, 255], (1 * width + 2) * 4); // (2,1) bleu

    const png = encodePng(width, height, rgba);
    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(png.toString('latin1', 12, 16)).toBe('IHDR');
    expect(png.readUInt32BE(16)).toBe(width);
    expect(png.readUInt32BE(20)).toBe(height);
    expect(png[24]).toBe(8); // profondeur
    expect(png[25]).toBe(6); // RGBA
    expect(png.toString('latin1', png.length - 8, png.length - 4)).toBe('IEND');

    const decoded = decodePng(png);
    expect(decoded.width).toBe(width);
    expect(decoded.height).toBe(height);
    expect(pixelAt(decoded, 0, 0)).toEqual([255, 0, 0, 255]);
    expect(pixelAt(decoded, 1, 0)).toEqual([0, 255, 0, 128]);
    expect(pixelAt(decoded, 2, 1)).toEqual([0, 0, 255, 255]);
    expect(pixelAt(decoded, 0, 1)).toEqual([0, 0, 0, 0]);
  });

  it('refuse un tampon de mauvaise taille', () => {
    expect(() => encodePng(2, 2, Buffer.alloc(3))).toThrow(/16 attendus/);
    expect(() => encodePng(0, 2, Buffer.alloc(0))).toThrow(/dimensions invalides/);
  });
});

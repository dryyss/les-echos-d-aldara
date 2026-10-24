import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodePng, pixelAt } from '../../scripts/lib/png.mjs';
import {
  COMMON_TILES,
  parseTileset,
  renderCollisionTile,
  renderTileset,
} from '../../scripts/lib/tiles.mjs';

const FIXTURE = join(__dirname, '..', 'fixtures', 'art', 'tiles', 'mini.json');
const miniTileset = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, unknown>;

function parseOk(json: unknown) {
  const result = parseTileset(json, { file: 'mini.json' });
  expect(result.errors).toEqual([]);
  if (!result.tileset) throw new Error('tileset attendu');
  return result.tileset;
}

describe('parseTileset', () => {
  const tileset = parseOk(miniTileset);

  it('attribue les index dans l’ordre d’apparition, frames consécutives', () => {
    expect(tileset.tiles.map((t) => [t.name, t.index])).toEqual([
      ['herbe', 0],
      ['touffe', 1],
      ['mur', 2],
      ['arbre-haut', 3],
      ['eau', 4],
      ['vide', 6],
    ]);
    expect(tileset.tiles.find((t) => t.name === 'eau')?.frames).toEqual([4, 5]);
    expect(tileset.tileCount).toBe(7);
    expect(tileset.legend).toEqual({
      '.': 'herbe',
      ',': 'touffe',
      '#': 'mur',
      T: 'arbre-haut',
      '~': 'eau',
      '*': 'vide',
    });
  });

  it('lit les propriétés et met les autres à false', () => {
    const eau = tileset.tiles.find((t) => t.name === 'eau');
    expect(eau).toMatchObject({ solid: true, water: true, above: false, gap: false, ice: false });
  });

  it('avertit pour chaque tuile manquante du catalogue commun', () => {
    const result = parseTileset(miniTileset, { file: 'mini.json' });
    const missing = COMMON_TILES.filter((t) => !['.', ',', '#', 'T', '~', '*'].includes(t.char));
    expect(result.warnings).toHaveLength(missing.length);
    expect(result.warnings).toContain(
      'mini.json : tuile du catalogue commun manquante : « H » (mur-haut)',
    );
  });

  it('avertit quand une tuile du catalogue n’a pas la solidité attendue', () => {
    const json = structuredClone(miniTileset) as { tiles: Record<string, Record<string, unknown>> };
    json.tiles.mur!.solid = false;
    const result = parseTileset(json, { file: 'mini.json' });
    expect(result.warnings).toContain(
      'mini.json : tuile « mur » (« # ») : le catalogue commun la prévoit solide',
    );
  });

  it('refuse deux tuiles avec le même caractère', () => {
    const json = structuredClone(miniTileset) as { tiles: Record<string, Record<string, unknown>> };
    json.tiles.touffe!.char = '.';
    const result = parseTileset(json, { file: 'mini.json' });
    expect(result.tileset).toBeNull();
    expect(result.errors).toContain(
      'mini.json : tuile « touffe » : le caractère « . » est déjà utilisé par « herbe »',
    );
  });

  it('signale une ligne trop courte et un caractère inconnu avec la tuile et la ligne', () => {
    const json = structuredClone(miniTileset) as { tiles: Record<string, Record<string, unknown>> };
    json.tiles.mur!.rows = ['dddd', 'dkd', 'dkkd', 'dddd'];
    json.tiles.eau!.frames = [
      ['bbbb', 'bBbb', 'bbbb', 'bbBb'],
      ['bbbb', 'bbXb', 'bbbb', 'Bbbb'],
    ];
    const result = parseTileset(json, { file: 'mini.json' });
    expect(result.errors).toContain(
      'mini.json : tuile « mur », ligne 2 : 3 caractères au lieu de 4',
    );
    expect(result.errors).toContain(
      'mini.json : tuile « eau », image 2, ligne 2, colonne 3 : caractère « X » absent de la palette',
    );
  });

  it('refuse une tuile sans rows ni frames, ou avec une seule frame', () => {
    const json = structuredClone(miniTileset) as { tiles: Record<string, Record<string, unknown>> };
    json.tiles.vide = { char: '*' };
    json.tiles.eau = { char: '~', frames: [['bbbb', 'bbbb', 'bbbb', 'bbbb']] };
    const result = parseTileset(json, { file: 'mini.json' });
    expect(result.errors.some((e) => e.startsWith('mini.json : tuile « vide » : « rows »'))).toBe(
      true,
    );
    expect(result.errors.some((e) => e.startsWith('mini.json : tuile « eau » : « rows »'))).toBe(
      true,
    );
  });
});

describe('renderTileset', () => {
  const rendered = renderTileset(parseOk(miniTileset));

  it('produit une image de 16 colonnes et le JSON de correspondance', () => {
    const image = decodePng(rendered.png);
    expect(image.width).toBe(64);
    expect(image.height).toBe(4);
    expect(rendered.json).toMatchObject({
      id: 'mini',
      tileSize: 4,
      columns: 16,
      tileCount: 7,
      imageWidth: 64,
      imageHeight: 4,
    });
    expect(rendered.json.tiles.eau).toEqual({
      index: 4,
      char: '~',
      solid: true,
      above: false,
      water: true,
      lava: false,
      gap: false,
      climb: false,
      slow: false,
      ice: false,
      frames: [4, 5],
    });
    expect(rendered.json.tiles.vide?.frames).toBeUndefined();
    expect(rendered.json.legend['*']).toBe('vide');
  });

  it('peint chaque tuile à sa position', () => {
    const image = decodePng(rendered.png);
    expect(pixelAt(image, 0, 0)).toEqual([0x4f, 0x9d, 0x4a, 255]); // herbe « g »
    expect(pixelAt(image, 2 * 4 + 1, 1)).toEqual([0x2a, 0x24, 0x20, 255]); // mur « k »
    expect(pixelAt(image, 3 * 4, 0)).toEqual([0, 0, 0, 0]); // arbre-haut « . »
    expect(pixelAt(image, 4 * 4 + 1, 1)).toEqual([0x5b, 0x8f, 0xd0, 255]); // eau frame 1 « B »
    expect(pixelAt(image, 5 * 4 + 2, 1)).toEqual([0x5b, 0x8f, 0xd0, 255]); // eau frame 2 « B »
    expect(pixelAt(image, 6 * 4, 0)).toEqual([0x2a, 0x24, 0x20, 255]); // vide
    expect(pixelAt(image, 7 * 4, 0)).toEqual([0, 0, 0, 0]); // case vide de la grille
  });
});

describe('renderCollisionTile', () => {
  it('produit une tuile rouge semi-transparente de la taille demandée', () => {
    const image = decodePng(renderCollisionTile(16));
    expect(image.width).toBe(16);
    expect(image.height).toBe(16);
    const [r, g, b, a] = pixelAt(image, 8, 8);
    expect(r).toBe(255);
    expect(g).toBe(0);
    expect(b).toBe(0);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(255);
  });
});

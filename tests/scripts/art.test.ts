import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSprite, renderSprite } from '../../scripts/lib/art.mjs';
import { decodePng, pixelAt } from '../../scripts/lib/png.mjs';

const FIXTURES = join(__dirname, '..', 'fixtures', 'art', 'sprites');

function loadFixture(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(FIXTURES, `${name}.json`), 'utf8')) as Record<
    string,
    unknown
  >;
}

const miniHero = loadFixture('mini-hero');
const miniHeroRouge = loadFixture('mini-hero-rouge');
const resolveBase = (id: string): unknown => (id === 'mini-hero' ? miniHero : null);

function parseOk(json: unknown) {
  const result = parseSprite(json, resolveBase, { file: 'test.json' });
  expect(result.errors).toEqual([]);
  if (!result.sprite) throw new Error('sprite attendu');
  return result.sprite;
}

describe('parseSprite : sprite character complet', () => {
  const sprite = parseOk(miniHero);

  it('résout les 12 frames, dont mirror et copy', () => {
    expect(Object.keys(sprite.frames)).toHaveLength(12);
    expect(sprite.frames['right-0']?.rows).toEqual([
      '.hh.',
      '.shh',
      '.ss.',
      'gggg',
      '.kk.',
      '.k.k',
    ]);
    expect(sprite.frames['down-1']?.rows).toEqual(sprite.frames['down-0']?.rows);
  });

  it('propage la palette d’une copie jusqu’au miroir', () => {
    expect(sprite.frames['left-2']?.overrides).toEqual({ g: '#2a7d3a' });
    expect(sprite.frames['right-2']?.overrides).toEqual({ g: '#2a7d3a' });
    expect(sprite.frames['left-1']?.overrides).toEqual({});
  });

  it('génère idle et walk pour les 4 directions et garde les animations du fichier', () => {
    expect(sprite.animations['idle-down']).toEqual({
      frames: ['down-0'],
      frameRate: 1,
      repeat: -1,
    });
    expect(sprite.animations['walk-left']).toEqual({
      frames: ['left-1', 'left-0', 'left-2', 'left-0'],
      frameRate: 8,
      repeat: -1,
    });
    expect(Object.keys(sprite.animations).filter((n) => n.startsWith('walk-'))).toHaveLength(4);
    expect(sprite.animations.special).toEqual({
      frames: ['down-0', 'down-2'],
      frameRate: 6,
      repeat: 0,
    });
  });

  it('avertit quand la taille ne correspond pas au kind', () => {
    const result = parseSprite(miniHero, resolveBase, { file: 'test.json' });
    expect(result.warnings.some((w) => w.includes('4 × 6') && w.includes('16 × 24'))).toBe(true);
  });
});

describe('parseSprite : sprite dérivé par base', () => {
  const sprite = parseOk(miniHeroRouge);

  it('hérite kind, taille, frames et animations de la base', () => {
    expect(sprite.kind).toBe('character');
    expect(sprite.width).toBe(4);
    expect(sprite.height).toBe(6);
    expect(Object.keys(sprite.frames)).toHaveLength(12);
    expect(sprite.animations.special).toBeDefined();
    expect(sprite.animations['walk-up']).toBeDefined();
  });

  it('fusionne la palette et remplace les frames locales', () => {
    expect(sprite.palette.h).toBe('#c0392b');
    expect(sprite.palette.s).toBe('#f1c9a5');
    expect(sprite.frames['down-0']?.rows[0]).toBe('....');
    expect(sprite.frames['up-0']?.rows).toEqual(
      (miniHero.frames as Record<string, unknown>)['up-0'],
    );
  });

  it('signale une base introuvable et une base circulaire', () => {
    const missing = parseSprite({ ...miniHeroRouge, base: 'inconnu' }, resolveBase, {
      file: 'x.json',
    });
    expect(missing.sprite).toBeNull();
    expect(missing.errors).toContain('x.json : base « inconnu » introuvable');

    const self = parseSprite({ ...miniHero, base: 'mini-hero' }, resolveBase, { file: 'x.json' });
    expect(self.errors.some((e) => e.includes('circulaire'))).toBe(true);
  });
});

describe('parseSprite : erreurs précises', () => {
  it('indique la frame, la ligne et le nombre de caractères d’une ligne trop courte', () => {
    const json = structuredClone(miniHero) as { frames: Record<string, unknown> };
    json.frames['down-0'] = ['.hh.', 'hss', '.ss.', 'gggg', '.kk.', 'k..k'];
    const result = parseSprite(json, resolveBase, { file: 'art/sprites/kael.json' });
    expect(result.sprite).toBeNull();
    expect(result.errors).toContain(
      'art/sprites/kael.json : frame « down-0 », ligne 2 : 3 caractères au lieu de 4',
    );
  });

  it('indique la ligne, la colonne et le caractère absent de la palette', () => {
    const json = structuredClone(miniHero) as { frames: Record<string, unknown> };
    json.frames['up-0'] = ['.zh.', 'hhhh', '.hh.', 'gggg', '.kk.', 'k..k'];
    const result = parseSprite(json, resolveBase, { file: 'kael.json' });
    expect(result.errors).toContain(
      'kael.json : frame « up-0 », ligne 1, colonne 2 : caractère « z » absent de la palette',
    );
  });

  it('signale un mauvais nombre de lignes et les frames obligatoires manquantes', () => {
    const json = structuredClone(miniHero) as { frames: Record<string, unknown> };
    json.frames['left-0'] = ['.hh.', 'hhs.'];
    delete json.frames['up-2'];
    const result = parseSprite(json, resolveBase, { file: 'kael.json' });
    expect(result.errors).toContain('kael.json : frame « left-0 » : 2 lignes au lieu de 6');
    expect(
      result.errors.some((e) => e.includes('frames obligatoires manquantes') && e.includes('up-2')),
    ).toBe(true);
  });

  it('refuse le point dans la palette, une couleur invalide et une référence inconnue', () => {
    const json = structuredClone(miniHero) as {
      palette: Record<string, string>;
      frames: Record<string, unknown>;
    };
    json.palette['.'] = '#000000';
    json.palette.k = 'noir';
    json.frames['right-1'] = { mirror: 'nope' };
    const result = parseSprite(json, resolveBase, { file: 'kael.json' });
    expect(result.errors).toContain(
      'kael.json : palette : le caractère « . » est réservé à la transparence',
    );
    expect(result.errors).toContain(
      'kael.json : palette : couleur « noir » invalide pour « k » (#rrggbb attendu)',
    );
    expect(result.errors).toContain(
      'kael.json : frame « right-1 » : frame miroir « nope » introuvable',
    );
  });

  it('refuse une animation qui référence une frame inconnue', () => {
    const json = { ...miniHero, animations: { bad: { frames: ['down-9'] } } };
    const result = parseSprite(json, resolveBase, { file: 'kael.json' });
    expect(result.errors).toContain('kael.json : animation « bad » : frames inconnues : down-9');
  });
});

describe('parseSprite : animations par kind', () => {
  it('génère idle, attack et hurt pour un ennemi avec toutes les frames du préfixe', () => {
    const rows = ['..', '..'];
    const json = {
      id: 'blob',
      kind: 'enemy',
      width: 2,
      height: 2,
      palette: { k: '#000000' },
      frames: { 'idle-0': rows, 'idle-1': rows, 'idle-2': rows, 'attack-0': rows, 'hurt-0': rows },
    };
    const sprite = parseOk(json);
    expect(sprite.animations.idle).toEqual({
      frames: ['idle-0', 'idle-1', 'idle-2'],
      frameRate: 2,
      repeat: -1,
    });
    expect(sprite.animations.attack).toEqual({ frames: ['attack-0'], frameRate: 8, repeat: 0 });
    expect(sprite.animations.hurt?.frames).toEqual(['hurt-0']);
  });

  it('génère « on » pour un objet seulement si on-0 et on-1 existent', () => {
    const rows = ['..', '..'];
    const base = { id: 'torche', kind: 'object', width: 2, height: 2, palette: { k: '#000000' } };
    const single = parseOk({ ...base, frames: { 'idle-0': rows, 'on-0': rows } });
    expect(single.animations.on).toBeUndefined();
    const double = parseOk({ ...base, frames: { 'idle-0': rows, 'on-0': rows, 'on-1': rows } });
    expect(double.animations.on).toEqual({ frames: ['on-0', 'on-1'], frameRate: 4, repeat: -1 });
  });

  it('ne génère rien pour un portrait', () => {
    const sprite = parseOk({
      id: 'p',
      kind: 'portrait',
      width: 2,
      height: 2,
      palette: { k: '#000000' },
      frames: { neutre: ['kk', 'kk'] },
    });
    expect(sprite.animations).toEqual({});
  });
});

describe('renderSprite', () => {
  const sprite = parseOk(miniHero);
  const rendered = renderSprite(sprite);

  it('empile 12 frames de 4 × 6 dans une grille de 4 colonnes', () => {
    expect(rendered.layout).toEqual({ columns: 4, rows: 3, imageWidth: 16, imageHeight: 18 });
    const image = decodePng(rendered.png);
    expect(image.width).toBe(16);
    expect(image.height).toBe(18);
  });

  it('produit un atlas JSON hash avec les noms de frames du fichier', () => {
    expect(Object.keys(rendered.atlas.frames)).toEqual(Object.keys(miniHero.frames as object));
    expect(rendered.atlas.frames['down-0']).toEqual({
      frame: { x: 0, y: 0, w: 4, h: 6 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 4, h: 6 },
      sourceSize: { w: 4, h: 6 },
    });
    expect(rendered.atlas.frames['up-1']?.frame).toEqual({ x: 0, y: 6, w: 4, h: 6 });
    expect(rendered.atlas.meta).toMatchObject({
      image: 'mini-hero.png',
      size: { w: 16, h: 18 },
      scale: '1',
    });
  });

  it('peint les couleurs de la palette, la transparence et les remplacements de copy', () => {
    const image = decodePng(rendered.png);
    expect(pixelAt(image, 0, 0)).toEqual([0, 0, 0, 0]); // « . »
    expect(pixelAt(image, 1, 0)).toEqual([0x7a, 0x4a, 0x2a, 255]); // « h »
    // left-2 est la 9e frame (index 8) : colonne 0, ligne 2 ; sa ligne 4 est « gggg » recolorée.
    expect(pixelAt(image, 0, 12 + 3)).toEqual([0x2a, 0x7d, 0x3a, 255]);
    // left-1 (index 7) : colonne 3, ligne 1, « g » d'origine.
    expect(pixelAt(image, 12, 6 + 3)).toEqual([0x3f, 0xae, 0x5a, 255]);
  });

  it('produit l’entrée du manifeste', () => {
    expect(rendered.manifestEntry).toMatchObject({
      id: 'mini-hero',
      kind: 'character',
      width: 4,
      height: 6,
    });
    expect(rendered.manifestEntry.animations['walk-down']?.frames).toEqual([
      'down-1',
      'down-0',
      'down-2',
      'down-0',
    ]);
  });
});

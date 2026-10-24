import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { decodePng } from '../../scripts/lib/png.mjs';

const ROOT = join(__dirname, '..', '..');
const FIXTURES = join(__dirname, '..', 'fixtures');
const BUILD_ART = join(ROOT, 'scripts', 'build-art.mjs');
const BUILD_MAPS = join(ROOT, 'scripts', 'build-maps.mjs');

function run(script: string, root: string) {
  const result = spawnSync(process.execPath, [script, '--root', root], { encoding: 'utf8' });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

function readJson(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
}

describe('build-art.mjs et build-maps.mjs sur les fixtures', () => {
  let root: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'aldara-build-'));
    cpSync(FIXTURES, root, { recursive: true });
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('build-art génère sprites, tilesets, collision et manifestes avec le code 0', () => {
    const { status, output } = run(BUILD_ART, root);
    expect(output).toContain('2 sprites, 1 tilesets');
    expect(status).toBe(0);

    const sprites = join(root, 'assets', 'sprites');
    expect(existsSync(join(sprites, 'mini-hero.png'))).toBe(true);
    expect(existsSync(join(sprites, 'mini-hero.json'))).toBe(true);
    expect(existsSync(join(sprites, 'mini-hero-rouge.png'))).toBe(true);
    const manifest = readJson(join(sprites, 'manifest.json')) as { sprites: { id: string }[] };
    expect(manifest.sprites.map((s) => s.id)).toEqual(['mini-hero', 'mini-hero-rouge']);

    const tiles = join(root, 'assets', 'tiles');
    expect(decodePng(readFileSync(join(tiles, 'mini.png'))).width).toBe(64);
    expect(readJson(join(tiles, 'mini.json'))).toMatchObject({ id: 'mini', tileCount: 7 });
    expect(decodePng(readFileSync(join(tiles, 'collision.png')))).toMatchObject({
      width: 16,
      height: 16,
    });
    expect(readJson(join(tiles, 'manifest.json'))).toEqual({ tilesets: ['mini'] });
  });

  it('build-maps convertit les cartes en .tmj avec le code 0', () => {
    const { status, output } = run(BUILD_MAPS, root);
    expect(output).toContain('2 cartes');
    expect(status).toBe(0);
    const tmj = readJson(join(root, 'assets', 'maps', 'mini-carte.tmj')) as {
      layers: { name: string }[];
    };
    expect(tmj.layers.map((l) => l.name)).toEqual([
      'sol',
      'decor',
      'au-dessus',
      'collisions',
      'objets',
    ]);
    expect(existsSync(join(root, 'assets', 'maps', 'autre-carte.tmj'))).toBe(true);
    // Les tableaux de nombres restent sur une ligne pour garder le fichier lisible.
    expect(readFileSync(join(root, 'assets', 'maps', 'autre-carte.tmj'), 'utf8')).toContain(
      '"data": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]',
    );
  });

  it('build-art affiche toutes les erreurs et sort en 1 sans bloquer les autres fichiers', () => {
    const bad = {
      id: 'casse',
      kind: 'icon',
      width: 2,
      height: 2,
      palette: { k: '#000000' },
      frames: { 'idle-0': ['kk', 'kz'], 'idle-1': ['kk'] },
    };
    writeFileSync(join(root, 'art', 'sprites', 'casse.json'), JSON.stringify(bad));
    writeFileSync(
      join(root, 'art', 'sprites', 'doublon.json'),
      JSON.stringify({ ...bad, id: 'mini-hero' }),
    );
    const { status, output } = run(BUILD_ART, root);
    expect(status).toBe(1);
    expect(output).toContain(
      'art/sprites/casse.json : frame « idle-0 », ligne 2, colonne 2 : caractère « z » absent de la palette',
    );
    expect(output).toContain('art/sprites/casse.json : frame « idle-1 » : 1 lignes au lieu de 2');
    expect(output).toContain(
      'art/sprites/doublon.json : identifiant « mini-hero » déjà utilisé par art/sprites/mini-hero.json',
    );
    expect(output).not.toContain('frames obligatoires manquantes pour le kind « icon »');
    expect(output).toContain('2 sprites, 1 tilesets');
    expect(existsSync(join(root, 'assets', 'sprites', 'casse.png'))).toBe(false);
  });

  it('build-maps sort en 1 quand le tileset manque', () => {
    writeFileSync(
      join(root, 'maps', 'orpheline.json'),
      JSON.stringify({ id: 'orpheline', tileset: 'inconnu', ground: ['..'], objects: [] }),
    );
    const { status, output } = run(BUILD_MAPS, root);
    expect(status).toBe(1);
    expect(output).toContain(
      'maps/orpheline.json : tileset « inconnu » introuvable dans assets/tiles',
    );
    rmSync(join(root, 'maps', 'orpheline.json'));
  });
});

describe('build-art.mjs sur un dossier art/ vide', () => {
  it('écrit des manifestes vides et sort en 0', () => {
    const root = mkdtempSync(join(tmpdir(), 'aldara-empty-'));
    mkdirSync(join(root, 'art'), { recursive: true });
    try {
      const { status, output } = run(BUILD_ART, root);
      expect(status).toBe(0);
      expect(output).toContain('0 sprites, 0 tilesets');
      expect(readJson(join(root, 'assets', 'sprites', 'manifest.json'))).toEqual({ sprites: [] });
      expect(readJson(join(root, 'assets', 'tiles', 'manifest.json'))).toEqual({ tilesets: [] });
      expect(existsSync(join(root, 'assets', 'tiles', 'collision.png'))).toBe(true);
      const maps = run(BUILD_MAPS, root);
      expect(maps.status).toBe(0);
      expect(maps.output).toContain('0 cartes');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

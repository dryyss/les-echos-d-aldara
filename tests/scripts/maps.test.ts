import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { convertMap, toTiledProperty } from '../../scripts/lib/maps.mjs';
import type {
  TiledMap,
  TiledObjectLayer,
  TiledProperty,
  TiledTileLayer,
} from '../../scripts/lib/maps.mjs';
import { parseTileset, renderTileset } from '../../scripts/lib/tiles.mjs';

const FIXTURES = join(__dirname, '..', 'fixtures');

function loadJson(relative: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(FIXTURES, relative), 'utf8')) as Record<string, unknown>;
}

const miniCarte = loadJson('maps/mini-carte.json');
const autreCarte = loadJson('maps/autre-carte.json');
const tilesetSource = loadJson('art/tiles/mini.json');
const parsedTileset = parseTileset(tilesetSource).tileset;
if (!parsedTileset) throw new Error('fixture tileset invalide');
const tilesetJson = renderTileset(parsedTileset).json;

const COLLISION_GID = 8; // 7 tuiles dans le tileset → le tileset collision commence à 8
const loadMap = (id: string): unknown => (id === 'autre-carte' ? autreCarte : null);

function convertOk(json: unknown): TiledMap {
  const result = convertMap(
    json,
    tilesetJson,
    { tileSize: 4 },
    { file: 'maps/mini-carte.json', loadMap },
  );
  expect(result.errors).toEqual([]);
  if (!result.tmj) throw new Error('tmj attendu');
  return result.tmj;
}

function tileLayer(tmj: TiledMap, name: string): TiledTileLayer {
  const layer = tmj.layers.find((l) => l.name === name);
  if (!layer || layer.type !== 'tilelayer') throw new Error(`calque ${name} introuvable`);
  return layer;
}

function objectLayer(tmj: TiledMap): TiledObjectLayer {
  const layer = tmj.layers.find((l) => l.name === 'objets');
  if (!layer || layer.type !== 'objectgroup') throw new Error('calque objets introuvable');
  return layer;
}

function prop(properties: TiledProperty[], name: string): TiledProperty | undefined {
  return properties.find((p) => p.name === name);
}

describe('convertMap : structure Tiled', () => {
  const tmj = convertOk(miniCarte);

  it('produit une carte orthogonale 6 × 5 avec les 5 calques', () => {
    expect(tmj).toMatchObject({
      type: 'map',
      version: '1.10',
      orientation: 'orthogonal',
      width: 6,
      height: 5,
      tilewidth: 4,
      tileheight: 4,
      infinite: false,
      nextlayerid: 6,
      nextobjectid: 9,
    });
    expect(tmj.layers.map((l) => l.name)).toEqual([
      'sol',
      'decor',
      'au-dessus',
      'collisions',
      'objets',
    ]);
  });

  it('embarque le tileset de décor (firstgid 1) puis le tileset collision', () => {
    const [decor, collision] = tmj.tilesets;
    expect(decor).toMatchObject({
      firstgid: 1,
      name: 'mini',
      image: '../tiles/mini.png',
      columns: 16,
      tilecount: 7,
      tilewidth: 4,
      imagewidth: 64,
      imageheight: 4,
    });
    expect(decor?.tiles).toHaveLength(6);
    const eau = decor?.tiles.find((t) => t.id === 4);
    expect(eau?.animation).toEqual([
      { tileid: 4, duration: 250 },
      { tileid: 5, duration: 250 },
    ]);
    expect(prop(eau?.properties ?? [], 'water')).toEqual({
      name: 'water',
      type: 'bool',
      value: true,
    });
    expect(prop(eau?.properties ?? [], 'name')).toEqual({
      name: 'name',
      type: 'string',
      value: 'eau',
    });
    expect(collision).toMatchObject({
      firstgid: COLLISION_GID,
      name: 'collision',
      image: '../tiles/collision.png',
      tilecount: 1,
      tiles: [{ id: 0, properties: [{ name: 'collides', type: 'bool', value: true }] }],
    });
  });

  it('écrit les gids du sol et sépare le décor des tuiles « above »', () => {
    expect(tileLayer(tmj, 'sol').data).toEqual([
      ...[1, 1, 1, 1, 1, 1],
      ...[1, 2, 2, 1, 1, 1],
      ...[1, 1, 5, 5, 1, 1],
      ...[1, 1, 1, 1, 1, 1],
      ...[1, 1, 1, 7, 7, 1],
    ]);
    const decor = tileLayer(tmj, 'decor').data;
    const above = tileLayer(tmj, 'au-dessus').data;
    expect(decor[0]).toBe(0); // T est passé dans au-dessus
    expect(above[0]).toBe(4);
    expect(decor[6]).toBe(3); // mur en (0,1)
    expect(above[6]).toBe(0);
    expect(decor.filter((g) => g !== 0)).toHaveLength(1);
    expect(above.filter((g) => g !== 0)).toHaveLength(1);
  });

  it('déduit les collisions des tuiles solides puis applique « # » et « o »', () => {
    const C = COLLISION_GID;
    expect(tileLayer(tmj, 'collisions').data).toEqual([
      ...[C, 0, 0, 0, 0, 0], // arbre-haut (decor)
      ...[C, 0, 0, 0, 0, 0], // mur (decor)
      ...[0, 0, C, C, 0, 0], // eau (sol)
      ...[C, 0, 0, 0, 0, 0], // « # » forcé
      ...[0, 0, 0, C, 0, 0], // vide, dont un « o » forcé en (4,4)
    ]);
  });

  it('porte les propriétés de carte, dont encounters et puzzles en JSON', () => {
    expect(prop(tmj.properties, 'name')).toEqual({
      name: 'name',
      type: 'string',
      value: 'Mini carte',
    });
    expect(prop(tmj.properties, 'indoor')).toEqual({ name: 'indoor', type: 'bool', value: false });
    expect(prop(tmj.properties, 'tileset')?.value).toBe('mini');
    expect(prop(tmj.properties, 'music')?.value).toBe('test');
    expect(prop(tmj.properties, 'encounters')?.value).toBe('null');
    const puzzles = JSON.parse(String(prop(tmj.properties, 'puzzles')?.value)) as unknown[];
    expect(puzzles).toEqual(miniCarte.puzzles);
  });
});

describe('convertMap : objets', () => {
  const objects = objectLayer(convertOk(miniCarte)).objects;

  it('convertit la géométrie en pixels et numérote les objets', () => {
    expect(objects).toHaveLength(8);
    expect(objects.map((o) => o.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    const trigger = objects.find((o) => o.name === 'zone-1');
    expect(trigger).toMatchObject({
      type: 'trigger',
      x: 12,
      y: 12,
      width: 8,
      height: 8,
      visible: true,
      rotation: 0,
    });
    const spawn = objects.find((o) => o.name === 'defaut');
    expect(spawn).toMatchObject({ type: 'spawn', x: 4, y: 12, width: 4, height: 4 });
  });

  it('nomme un objet sans id d’après son type et sa position', () => {
    const warp = objects.find((o) => o.type === 'warp');
    expect(warp?.name).toBe('warp-5-0');
    expect(prop(warp?.properties ?? [], 'to')).toEqual({
      name: 'to',
      type: 'string',
      value: '{"map":"autre-carte","spawn":"entree"}',
    });
    expect(prop(warp?.properties ?? [], 'direction')?.value).toBe('up');
  });

  it('type les propriétés : string, int, bool et JSON pour les tableaux et objets', () => {
    const brasero = objects.find((o) => o.name === 'brasero-a');
    const props = brasero?.properties ?? [];
    expect(prop(props, 'sprite')).toEqual({ name: 'sprite', type: 'string', value: 'brasero' });
    expect(prop(props, 'reactsTo')).toEqual({
      name: 'reactsTo',
      type: 'string',
      value: '["braise"]',
    });
    expect(prop(props, 'solid')).toEqual({ name: 'solid', type: 'bool', value: true });
    expect(prop(props, 'props')).toEqual({
      name: 'props',
      type: 'string',
      value: '{"persist":false}',
    });
    expect(props.map((p) => p.name)).not.toContain('x');
    expect(props.map((p) => p.name)).not.toContain('type');

    const chest = objects.find((o) => o.name === 'coffre-1');
    expect(prop(chest?.properties ?? [], 'quantity')).toEqual({
      name: 'quantity',
      type: 'int',
      value: 2,
    });
    expect(prop(chest?.properties ?? [], 'si')?.value).toBe('{"flag":"test_flag"}');
  });

  it('toTiledProperty distingue int et float et ignore null', () => {
    expect(toTiledProperty('a', 1.5)).toEqual({ name: 'a', type: 'float', value: 1.5 });
    expect(toTiledProperty('a', 3)).toEqual({ name: 'a', type: 'int', value: 3 });
    expect(toTiledProperty('a', null)).toBeNull();
  });
});

describe('convertMap : validations', () => {
  const convert = (json: unknown, load = loadMap) =>
    convertMap(json, tilesetJson, { tileSize: 4 }, { file: 'maps/mini-carte.json', loadMap: load });

  it('signale une ligne trop courte avec son numéro', () => {
    const json = structuredClone(miniCarte) as { ground: string[]; decor: string[] };
    json.ground[1] = '.,,..';
    json.decor[4] = '.......';
    const result = convert(json);
    expect(result.tmj).toBeNull();
    expect(result.errors).toContain(
      'maps/mini-carte.json : « ground », ligne 2 : 5 caractères au lieu de 6',
    );
    expect(result.errors).toContain(
      'maps/mini-carte.json : « decor », ligne 5 : 7 caractères au lieu de 6',
    );
  });

  it('signale un caractère inconnu avec x, y et le caractère', () => {
    const json = structuredClone(miniCarte) as { ground: string[]; collisions: string[] };
    json.ground[0] = '..z...';
    json.collisions[2] = '.x....';
    const result = convert(json);
    expect(result.errors).toContain(
      'maps/mini-carte.json : ground (x=2, y=0) : caractère « z » inconnu dans le tileset « mini »',
    );
    expect(result.errors).toContain(
      'maps/mini-carte.json : collisions (x=1, y=2) : caractère « x » inconnu (« . », « # » ou « o » attendu)',
    );
  });

  it('refuse un objet hors carte, un type inconnu et un champ obligatoire manquant', () => {
    const json = structuredClone(miniCarte) as { objects: Record<string, unknown>[] };
    json.objects.push({ type: 'sign', texte: 'Loin', x: 6, y: 0 });
    json.objects.push({ type: 'pnj', id: 'x', x: 0, y: 0 });
    json.objects.push({ type: 'chest', id: 'coffre-2', x: 0, y: 0 });
    const result = convert(json);
    expect(result.errors).toContain(
      'maps/mini-carte.json : objet sign n°9 (6, 0, 1 × 1) : hors de la carte 6 × 5',
    );
    expect(result.errors.some((e) => e.includes('objet « x » : type « pnj » inconnu'))).toBe(true);
    expect(result.errors).toContain(
      'maps/mini-carte.json : objet « coffre-2 » : champ « item » obligatoire pour le type « chest »',
    );
  });

  it('refuse un puzzle qui référence un objet inconnu', () => {
    const json = structuredClone(miniCarte) as { puzzles: Record<string, unknown>[] };
    json.puzzles[0]!.objects = ['brasero-a', 'brasero-z'];
    const result = convert(json);
    expect(result.errors).toContain(
      'maps/mini-carte.json : puzzle « braseros-test » : « objects » référence l’objet inconnu « brasero-z »',
    );
  });

  it('avertit sans spawn « defaut » et pour un warp vers un spawn absent ou une carte inconnue', () => {
    const json = structuredClone(miniCarte) as { objects: Record<string, unknown>[] };
    json.objects = json.objects.filter((o) => o.id !== 'defaut');
    const result = convert(json, () => ({ ...autreCarte, objects: [] }));
    expect(result.tmj).not.toBeNull();
    expect(result.warnings).toContain(
      'maps/mini-carte.json : aucun spawn « defaut » : le joueur ne pourra pas arriver par défaut',
    );
    expect(result.warnings).toContain(
      'maps/mini-carte.json : warp vers « autre-carte » : spawn « entree » absent de la carte cible',
    );
    const unknown = convert(miniCarte, () => null);
    expect(unknown.warnings).toContain(
      'maps/mini-carte.json : warp vers « autre-carte » : carte cible introuvable',
    );
  });

  it('refuse un tileset qui ne correspond pas', () => {
    const result = convert({ ...miniCarte, tileset: 'village' });
    expect(result.errors).toContain(
      'maps/mini-carte.json : tileset « village » attendu, « mini » fourni',
    );
  });
});

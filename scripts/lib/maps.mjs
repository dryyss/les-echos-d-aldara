// Conversion des cartes ASCII (maps/*.json) en cartes Tiled JSON (.tmj).
// Voir docs/technique/format-cartes.md, section « Sortie Tiled ».
import { createDiagnostics, isPlainObject, isPositiveInteger } from './diagnostics.mjs';
import { COLLISION_TILESET_ID, TILE_FLAGS } from './tiles.mjs';

export const TILED_VERSION = '1.10';
export const TILED_EDITOR_VERSION = '1.10.2';
export const ANIMATION_FRAME_DURATION = 250;
export const DEFAULT_SPAWN = 'defaut';
export const DIRECTIONS = ['up', 'down', 'left', 'right'];

/** Champs obligatoires par type d'objet (format-cartes.md). */
export const OBJECT_TYPES = {
  spawn: ['id'],
  warp: ['to'],
  npc: ['id'],
  object: ['id', 'sprite'],
  trigger: ['id', 'scene'],
  chest: ['id', 'item'],
  lueur: ['id'],
  sign: ['texte'],
  save: [],
  inn: ['prix', 'npc'],
  shop: ['boutique'],
  forge: [],
  talk: ['id', 'scene'],
  examine: ['id', 'texte'],
};
export const PUZZLE_TYPES = ['all', 'sequence', 'positions', 'count', 'flags'];

/** Clés d'objet consommées par la géométrie Tiled ; les autres deviennent des propriétés. */
const GEOMETRY_KEYS = new Set(['id', 'type', 'x', 'y', 'w', 'h']);
const MAP_PROPERTY_KEYS = ['name', 'music', 'zone', 'indoor', 'encounters', 'puzzles', 'tileset'];

const LAYERS = {
  ground: 'sol',
  decor: 'decor',
  above: 'au-dessus',
  collisions: 'collisions',
  objects: 'objets',
};

function result(tmj, diag) {
  return { tmj: diag.hasErrors ? null : tmj, errors: diag.errors, warnings: diag.warnings };
}

/**
 * Convertit une carte ASCII en objet `.tmj` Tiled 1.10 orthogonal.
 * Renvoie `{ tmj, errors, warnings }` ; `tmj` vaut null dès qu'il y a une erreur.
 *
 * @param {unknown} mapJson contenu de maps/<id>.json
 * @param {object} tilesetJson contenu de assets/tiles/<tileset>.json (généré par build-art)
 * @param {{ image?: string, tileSize?: number }} [collisionInfo] tuile de collision
 * @param {{ file?: string, loadMap?: (id: string) => unknown }} [options]
 *   `loadMap` renvoie le JSON d'une autre carte pour vérifier les destinations des warps.
 */
export function convertMap(mapJson, tilesetJson, collisionInfo = {}, options = {}) {
  const fallbackName = isPlainObject(mapJson) && typeof mapJson.id === 'string' ? mapJson.id : '?';
  const diag = createDiagnostics(options.file ?? `carte « ${fallbackName} »`);
  if (!isPlainObject(mapJson)) {
    diag.error('le fichier doit contenir un objet JSON');
    return result(null, diag);
  }
  if (!isPlainObject(tilesetJson) || !isPlainObject(tilesetJson.tiles)) {
    diag.error('tileset invalide : JSON généré par build-art attendu');
    return result(null, diag);
  }
  if (typeof mapJson.id !== 'string' || mapJson.id.length === 0) {
    diag.error('propriété « id » manquante ou invalide');
  }
  if (mapJson.tileset !== tilesetJson.id) {
    diag.error(`tileset « ${String(mapJson.tileset)} » attendu, « ${tilesetJson.id} » fourni`);
  }

  const size = readGrid(mapJson, diag);
  if (!size) return result(null, diag);

  const tileset = indexTileset(tilesetJson);
  const layers = buildTileLayers(mapJson, size, tileset, diag);
  const objects = buildObjects(mapJson.objects, size, tileset.tileSize, diag);
  checkSpawns(objects, diag);
  checkWarps(mapJson.objects, options.loadMap, diag);
  checkPuzzles(mapJson.puzzles, objects, diag);

  const collisionFirstGid = tileset.tileCount + 1;
  const tmj = assembleTmj(mapJson, size, tileset, layers, objects, {
    firstgid: collisionFirstGid,
    image: collisionInfo.image ?? `../tiles/${COLLISION_TILESET_ID}.png`,
    tileSize: collisionInfo.tileSize ?? tileset.tileSize,
  });
  return result(tmj, diag);
}

// --- Grilles -----------------------------------------------------------------

function readGrid(mapJson, diag) {
  const ground = mapJson.ground;
  if (!Array.isArray(ground) || ground.length === 0 || typeof ground[0] !== 'string') {
    diag.error('« ground » doit être un tableau non vide de chaînes');
    return null;
  }
  const height = ground.length;
  const width = Array.from(ground[0]).length;
  if (width === 0) {
    diag.error('« ground » : la première ligne est vide');
    return null;
  }
  let ok = checkLayerRows('ground', ground, width, height, diag);
  for (const key of ['decor', 'collisions']) {
    if (mapJson[key] === undefined || mapJson[key] === null) continue;
    if (!Array.isArray(mapJson[key])) {
      diag.error(`« ${key} » doit être un tableau de chaînes`);
      ok = false;
    } else if (!checkLayerRows(key, mapJson[key], width, height, diag)) ok = false;
  }
  return ok ? { width, height } : null;
}

function checkLayerRows(key, rows, width, height, diag) {
  let ok = true;
  if (rows.length !== height) {
    diag.error(`« ${key} » : ${rows.length} lignes au lieu de ${height}`);
    ok = false;
  }
  rows.forEach((row, index) => {
    if (typeof row !== 'string') {
      diag.error(`« ${key} », ligne ${index + 1} : une chaîne est attendue`);
      ok = false;
      return;
    }
    const length = Array.from(row).length;
    if (length !== width) {
      diag.error(`« ${key} », ligne ${index + 1} : ${length} caractères au lieu de ${width}`);
      ok = false;
    }
  });
  return ok;
}

function indexTileset(tilesetJson) {
  const byChar = new Map();
  const byIndex = [];
  for (const [name, tile] of Object.entries(tilesetJson.tiles)) {
    const entry = { name, ...tile };
    byChar.set(tile.char, entry);
    byIndex.push(entry);
  }
  byIndex.sort((a, b) => a.index - b.index);
  return {
    id: tilesetJson.id,
    tileSize: tilesetJson.tileSize ?? 16,
    columns: tilesetJson.columns ?? 16,
    tileCount: tilesetJson.tileCount ?? byIndex.length,
    imageWidth: tilesetJson.imageWidth,
    imageHeight: tilesetJson.imageHeight,
    byChar,
    byIndex,
  };
}

function buildTileLayers(mapJson, size, tileset, diag) {
  const { width, height } = size;
  const cells = width * height;
  const ground = new Array(cells).fill(0);
  const decor = new Array(cells).fill(0);
  const above = new Array(cells).fill(0);
  const blocked = new Array(cells).fill(false);
  const decorRows = Array.isArray(mapJson.decor) ? mapJson.decor : null;
  const collisionRows = Array.isArray(mapJson.collisions) ? mapJson.collisions : null;

  const lookup = (layer, char, x, y) => {
    const tile = tileset.byChar.get(char);
    if (!tile) {
      diag.error(
        `${layer} (x=${x}, y=${y}) : caractère « ${char} » inconnu dans le tileset « ${tileset.id} »`,
      );
    }
    return tile ?? null;
  };

  for (let y = 0; y < height; y++) {
    const groundChars = Array.from(mapJson.ground[y]);
    const decorChars = decorRows ? Array.from(decorRows[y]) : null;
    const collisionChars = collisionRows ? Array.from(collisionRows[y]) : null;
    for (let x = 0; x < width; x++) {
      const cell = y * width + x;
      const groundTile = lookup('ground', groundChars[x], x, y);
      if (groundTile) {
        ground[cell] = groundTile.index + 1;
        if (groundTile.solid) blocked[cell] = true;
      }
      if (decorChars && decorChars[x] !== '.') {
        const decorTile = lookup('decor', decorChars[x], x, y);
        if (decorTile) {
          (decorTile.above ? above : decor)[cell] = decorTile.index + 1;
          if (decorTile.solid) blocked[cell] = true;
        }
      }
      if (collisionChars) applyCollisionOverride(collisionChars[x], blocked, cell, x, y, diag);
    }
  }
  return { ground, decor, above, blocked };
}

function applyCollisionOverride(char, blocked, cell, x, y, diag) {
  if (char === '#') blocked[cell] = true;
  else if (char === 'o') blocked[cell] = false;
  else if (char !== '.') {
    diag.error(
      `collisions (x=${x}, y=${y}) : caractère « ${char} » inconnu (« . », « # » ou « o » attendu)`,
    );
  }
}

// --- Objets ------------------------------------------------------------------

function buildObjects(rawObjects, size, tileSize, diag) {
  if (rawObjects === undefined) return [];
  if (!Array.isArray(rawObjects)) {
    diag.error('« objects » doit être un tableau');
    return [];
  }
  const seen = new Map();
  const objects = [];
  rawObjects.forEach((raw, index) => {
    const object = readObject(raw, index, size, tileSize, diag);
    if (!object) return;
    if (object.sourceId !== null) {
      const previous = seen.get(object.sourceId);
      if (previous !== undefined) {
        diag.error(
          `objet n°${index + 1} : identifiant « ${object.sourceId} » déjà utilisé par l’objet n°${previous + 1}`,
        );
      }
      seen.set(object.sourceId, index);
    }
    objects.push(object);
  });
  return objects;
}

function describeObject(raw, index) {
  if (isPlainObject(raw) && typeof raw.id === 'string') return `objet « ${raw.id} »`;
  if (isPlainObject(raw) && typeof raw.type === 'string') return `objet ${raw.type} n°${index + 1}`;
  return `objet n°${index + 1}`;
}

function readObject(raw, index, size, tileSize, diag) {
  const label = describeObject(raw, index);
  if (!isPlainObject(raw)) {
    diag.error(`${label} : un objet JSON est attendu`);
    return null;
  }
  const type = raw.type;
  if (typeof type !== 'string' || !(type in OBJECT_TYPES)) {
    diag.error(
      `${label} : type « ${String(type)} » inconnu (${Object.keys(OBJECT_TYPES).join(', ')})`,
    );
    return null;
  }
  const bounds = readBounds(raw, label, size, diag);
  if (!bounds) return null;
  checkRequiredFields(raw, type, label, diag);
  checkDirection(raw, label, diag);

  const sourceId = typeof raw.id === 'string' ? raw.id : null;
  const properties = Object.entries(raw)
    .filter(([key]) => !GEOMETRY_KEYS.has(key))
    .map(([key, value]) => toTiledProperty(key, value))
    .filter((property) => property !== null);

  return {
    id: index + 1,
    name: sourceId ?? `${type}-${bounds.x}-${bounds.y}`,
    type,
    x: bounds.x * tileSize,
    y: bounds.y * tileSize,
    width: bounds.w * tileSize,
    height: bounds.h * tileSize,
    visible: true,
    rotation: 0,
    properties,
    sourceId,
    tileX: bounds.x,
    tileY: bounds.y,
  };
}

function readBounds(raw, label, size, diag) {
  const { x, y } = raw;
  const w = raw.w ?? 1;
  const h = raw.h ?? 1;
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    diag.error(`${label} : « x » et « y » doivent être des entiers (en tuiles)`);
    return null;
  }
  if (!isPositiveInteger(w) || !isPositiveInteger(h)) {
    diag.error(`${label} : « w » et « h » doivent être des entiers positifs`);
    return null;
  }
  if (x < 0 || y < 0 || x + w > size.width || y + h > size.height) {
    diag.error(
      `${label} (${x}, ${y}, ${w} × ${h}) : hors de la carte ${size.width} × ${size.height}`,
    );
    return null;
  }
  return { x, y, w, h };
}

function checkRequiredFields(raw, type, label, diag) {
  for (const field of OBJECT_TYPES[type]) {
    if (raw[field] === undefined || raw[field] === null) {
      diag.error(`${label} : champ « ${field} » obligatoire pour le type « ${type} »`);
    }
  }
  if (type === 'warp' && isPlainObject(raw.to)) {
    for (const field of ['map', 'spawn']) {
      if (typeof raw.to[field] !== 'string')
        diag.error(`${label} : « to.${field} » doit être une chaîne`);
    }
  } else if (type === 'warp' && raw.to !== undefined) {
    diag.error(`${label} : « to » doit être un objet { "map", "spawn" }`);
  }
  if (type === 'object' && raw.reactsTo !== undefined && !Array.isArray(raw.reactsTo)) {
    diag.error(`${label} : « reactsTo » doit être un tableau de Résonances`);
  }
}

function checkDirection(raw, label, diag) {
  if (raw.direction !== undefined && !DIRECTIONS.includes(raw.direction)) {
    diag.error(
      `${label} : direction « ${String(raw.direction)} » invalide (${DIRECTIONS.join(', ')})`,
    );
  }
}

/** Convertit une valeur JSON en propriété Tiled ; tableaux et objets sont sérialisés en JSON. */
export function toTiledProperty(name, value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return { name, type: 'bool', value };
  if (typeof value === 'number') {
    return { name, type: Number.isInteger(value) ? 'int' : 'float', value };
  }
  if (typeof value === 'string') return { name, type: 'string', value };
  return { name, type: 'string', value: JSON.stringify(value) };
}

function checkSpawns(objects, diag) {
  const spawns = objects.filter((object) => object.type === 'spawn');
  if (!spawns.some((spawn) => spawn.sourceId === DEFAULT_SPAWN)) {
    diag.warn(`aucun spawn « ${DEFAULT_SPAWN} » : le joueur ne pourra pas arriver par défaut`);
  }
}

function checkWarps(rawObjects, loadMap, diag) {
  if (!Array.isArray(rawObjects) || typeof loadMap !== 'function') return;
  for (const raw of rawObjects) {
    if (!isPlainObject(raw) || raw.type !== 'warp' || !isPlainObject(raw.to)) continue;
    const { map, spawn } = raw.to;
    if (typeof map !== 'string' || typeof spawn !== 'string') continue;
    const label = `warp vers « ${map} »`;
    const target = loadMap(map);
    if (!isPlainObject(target)) {
      diag.warn(`${label} : carte cible introuvable`);
      continue;
    }
    const spawns = Array.isArray(target.objects) ? target.objects : [];
    const found = spawns.some((o) => isPlainObject(o) && o.type === 'spawn' && o.id === spawn);
    if (!found) diag.warn(`${label} : spawn « ${spawn} » absent de la carte cible`);
  }
}

// --- Puzzles -----------------------------------------------------------------

function checkPuzzles(rawPuzzles, objects, diag) {
  if (rawPuzzles === undefined || rawPuzzles === null) return;
  if (!Array.isArray(rawPuzzles)) {
    diag.error('« puzzles » doit être un tableau');
    return;
  }
  const objectIds = new Set(objects.map((object) => object.sourceId).filter((id) => id !== null));
  const seen = new Set();
  rawPuzzles.forEach((puzzle, index) => {
    const label =
      isPlainObject(puzzle) && typeof puzzle.id === 'string'
        ? `puzzle « ${puzzle.id} »`
        : `puzzle n°${index + 1}`;
    if (!isPlainObject(puzzle)) {
      diag.error(`${label} : un objet JSON est attendu`);
      return;
    }
    if (typeof puzzle.id !== 'string') diag.error(`${label} : « id » manquant`);
    else if (seen.has(puzzle.id)) diag.error(`${label} : identifiant en double`);
    seen.add(puzzle.id);
    if (!PUZZLE_TYPES.includes(puzzle.type)) {
      diag.error(`${label} : type « ${String(puzzle.type)} » inconnu (${PUZZLE_TYPES.join(', ')})`);
    }
    checkPuzzleReferences(puzzle, label, objectIds, diag);
  });
}

function checkPuzzleReferences(puzzle, label, objectIds, diag) {
  const check = (ids, field) => {
    if (!Array.isArray(ids)) return;
    for (const id of ids) {
      if (!objectIds.has(id))
        diag.error(`${label} : « ${field} » référence l’objet inconnu « ${String(id)} »`);
    }
  };
  check(puzzle.objects, 'objects');
  check(puzzle.order, 'order');
  if (Array.isArray(puzzle.targets)) {
    check(
      puzzle.targets.map((target) => (isPlainObject(target) ? target.object : target)),
      'targets',
    );
  }
  if (puzzle.type === 'count' && !isPositiveInteger(puzzle.count)) {
    diag.error(`${label} : « count » doit être un entier positif`);
  }
  if (puzzle.type === 'flags' && !Array.isArray(puzzle.flags)) {
    diag.error(`${label} : « flags » doit être un tableau de drapeaux`);
  }
  const setMapState = puzzle.onSolved?.setMapState;
  if (isPlainObject(setMapState)) {
    for (const id of Object.keys(setMapState)) {
      if (!objectIds.has(id))
        diag.warn(`${label} : « onSolved.setMapState » vise l’objet inconnu « ${id} »`);
    }
  }
}

// --- Assemblage Tiled --------------------------------------------------------

function tileLayer(id, name, data, size) {
  return {
    data,
    height: size.height,
    id,
    name,
    opacity: 1,
    type: 'tilelayer',
    visible: true,
    width: size.width,
    x: 0,
    y: 0,
  };
}

function objectLayer(id, objects) {
  return {
    draworder: 'topdown',
    id,
    name: LAYERS.objects,
    objects: objects.map(({ sourceId: _s, tileX: _x, tileY: _y, ...object }) => object),
    opacity: 1,
    type: 'objectgroup',
    visible: true,
    x: 0,
    y: 0,
  };
}

function decorTilesetEntry(tileset) {
  const tiles = tileset.byIndex.map((tile) => {
    const entry = {
      id: tile.index,
      properties: [
        toTiledProperty('name', tile.name),
        toTiledProperty('char', tile.char),
        ...TILE_FLAGS.map((flag) => toTiledProperty(flag, tile[flag] === true)),
      ],
    };
    if (Array.isArray(tile.frames) && tile.frames.length > 1) {
      entry.animation = tile.frames.map((tileid) => ({
        tileid,
        duration: ANIMATION_FRAME_DURATION,
      }));
    }
    return entry;
  });
  const rows = Math.max(1, Math.ceil(tileset.tileCount / tileset.columns));
  return {
    columns: tileset.columns,
    firstgid: 1,
    image: `../tiles/${tileset.id}.png`,
    imageheight: tileset.imageHeight ?? rows * tileset.tileSize,
    imagewidth: tileset.imageWidth ?? tileset.columns * tileset.tileSize,
    margin: 0,
    name: tileset.id,
    spacing: 0,
    tilecount: tileset.tileCount,
    tileheight: tileset.tileSize,
    tilewidth: tileset.tileSize,
    tiles,
  };
}

function collisionTilesetEntry(collision) {
  return {
    columns: 1,
    firstgid: collision.firstgid,
    image: collision.image,
    imageheight: collision.tileSize,
    imagewidth: collision.tileSize,
    margin: 0,
    name: COLLISION_TILESET_ID,
    spacing: 0,
    tilecount: 1,
    tileheight: collision.tileSize,
    tilewidth: collision.tileSize,
    tiles: [{ id: 0, properties: [toTiledProperty('collides', true)] }],
  };
}

function mapProperties(mapJson) {
  const properties = [toTiledProperty('id', mapJson.id)];
  for (const key of MAP_PROPERTY_KEYS) {
    let value = mapJson[key];
    if (key === 'encounters') value = JSON.stringify(value ?? null);
    if (key === 'puzzles') value = JSON.stringify(value ?? []);
    if (key === 'name' && value === undefined) value = mapJson.id;
    if (key === 'indoor' && value === undefined) value = false;
    const property = toTiledProperty(key, value);
    if (property) properties.push(property);
  }
  return properties;
}

function assembleTmj(mapJson, size, tileset, layers, objects, collision) {
  const collisionData = layers.blocked.map((blocked) => (blocked ? collision.firstgid : 0));
  return {
    compressionlevel: -1,
    height: size.height,
    infinite: false,
    layers: [
      tileLayer(1, LAYERS.ground, layers.ground, size),
      tileLayer(2, LAYERS.decor, layers.decor, size),
      tileLayer(3, LAYERS.above, layers.above, size),
      tileLayer(4, LAYERS.collisions, collisionData, size),
      objectLayer(5, objects),
    ],
    nextlayerid: 6,
    nextobjectid: objects.length + 1,
    orientation: 'orthogonal',
    properties: mapProperties(mapJson),
    renderorder: 'right-down',
    tiledversion: TILED_EDITOR_VERSION,
    tileheight: tileset.tileSize,
    tilesets: [decorTilesetEntry(tileset), collisionTilesetEntry(collision)],
    tilewidth: tileset.tileSize,
    type: 'map',
    version: TILED_VERSION,
    width: size.width,
  };
}

// Conversion des tilesets texte (art/tiles) en PNG + description JSON.
// Voir docs/technique/format-art.md, section « Fichier tileset ».
import { createDiagnostics, isPlainObject, isPositiveInteger } from './diagnostics.mjs';
import { paintRows, validatePalette, validateRows } from './pixels.mjs';
import { encodePng } from './png.mjs';

export const TILESET_COLUMNS = 16;
export const DEFAULT_TILE_SIZE = 16;
export const COLLISION_TILESET_ID = 'collision';
export const TILE_FLAGS = ['solid', 'above', 'water', 'lava', 'gap', 'climb', 'slow', 'ice'];
const MAX_ANIMATION_FRAMES = 4;
const KNOWN_TILE_KEYS = new Set([...TILE_FLAGS, 'char', 'rows', 'frames']);

/** Catalogue commun obligatoire (format-art.md). Les tuiles absentes donnent un avertissement. */
export const COMMON_TILES = [
  { char: '.', name: 'sol', solid: false },
  { char: ',', name: 'sol-2', solid: false },
  { char: ':', name: 'sol-3', solid: false },
  { char: '=', name: 'chemin', solid: false },
  { char: '-', name: 'chemin-bord', solid: false },
  { char: '_', name: 'plancher', solid: false },
  { char: '#', name: 'mur', solid: true },
  { char: 'H', name: 'mur-haut', solid: true, above: true },
  { char: '^', name: 'falaise', solid: true },
  { char: 'T', name: 'arbre-haut', solid: true, above: true },
  { char: 't', name: 'arbre-bas', solid: true },
  { char: 'b', name: 'buisson', solid: true },
  { char: 'r', name: 'rocher', solid: true },
  { char: '~', name: 'eau', solid: true, water: true },
  { char: 'w', name: 'eau-bord', solid: true, water: true },
  { char: '*', name: 'vide', solid: true, gap: true },
  { char: '%', name: 'lave', solid: true, lava: true },
  { char: 'i', name: 'glace', solid: false, ice: true },
  { char: 's', name: 'escalier', solid: false },
  { char: 'p', name: 'pont', solid: false },
  { char: '|', name: 'barriere', solid: true },
  { char: 'D', name: 'porte', solid: true },
  { char: 'W', name: 'mur-maison', solid: true },
  { char: 'F', name: 'fenetre', solid: true },
  { char: 'R', name: 'toit', solid: true, above: true },
  { char: 'Q', name: 'toit-bord', solid: true, above: true },
  { char: 'U', name: 'meuble', solid: true },
  { char: 'A', name: 'table', solid: true },
  { char: 'B', name: 'lit', solid: true },
  { char: 'E', name: 'etagere', solid: true },
  { char: 'K', name: 'tonneau', solid: true },
  { char: 'o', name: 'tapis', solid: false },
  { char: 'L', name: 'lampe', solid: true },
  { char: 'P', name: 'pilier', solid: true },
  { char: 'S', name: 'statue', solid: true },
  { char: 'c', name: 'colonne-haut', solid: true, above: true },
  { char: 'g', name: 'herbe-haute', solid: false, slow: true },
  { char: 'x', name: 'debris', solid: false },
  { char: '!', name: 'panneau', solid: true },
];

function result(tileset, diag) {
  return { tileset: diag.hasErrors ? null : tileset, errors: diag.errors, warnings: diag.warnings };
}

/**
 * Analyse un fichier tileset et renvoie `{ tileset, errors, warnings }`.
 * Les index sont attribués dans l'ordre d'apparition ; une tuile animée occupe autant
 * d'index consécutifs que de frames, le premier étant son index nominal.
 *
 * @param {unknown} json
 * @param {{ file?: string }} [options]
 */
export function parseTileset(json, options = {}) {
  const fallbackName = isPlainObject(json) && typeof json.id === 'string' ? json.id : '?';
  const diag = createDiagnostics(options.file ?? `tileset « ${fallbackName} »`);
  if (!isPlainObject(json)) {
    diag.error('le fichier doit contenir un objet JSON');
    return result(null, diag);
  }

  const id = typeof json.id === 'string' && json.id.length > 0 ? json.id : null;
  if (!id) diag.error('propriété « id » manquante ou invalide');
  const tileSize = readTileSize(json, diag);
  const palette = validatePalette(json.palette, diag, { required: true });
  if (!isPlainObject(json.tiles) || Object.keys(json.tiles).length === 0) {
    diag.error('« tiles » doit être un objet non vide { "nom": { "char": ..., "rows": [...] } }');
    return result(null, diag);
  }
  if (!tileSize) return result(null, diag);

  const tiles = [];
  const legend = {};
  const owners = new Map();
  let nextIndex = 0;
  for (const [name, def] of Object.entries(json.tiles)) {
    const tile = readTile(name, def, { tileSize, palette }, diag);
    if (!tile) continue;
    const owner = owners.get(tile.char);
    if (owner)
      diag.error(
        `tuile « ${name} » : le caractère « ${tile.char} » est déjà utilisé par « ${owner} »`,
      );
    owners.set(tile.char, name);
    tile.index = nextIndex;
    if (tile.frames) tile.frames = tile.images.map((_, i) => nextIndex + i);
    nextIndex += tile.images.length;
    tiles.push(tile);
    legend[tile.char] = name;
  }

  checkCommonCatalogue(tiles, diag);
  return result({ id, tileSize, palette, tiles, legend, tileCount: nextIndex }, diag);
}

function readTileSize(json, diag) {
  const tileSize = json.tileSize ?? DEFAULT_TILE_SIZE;
  if (!isPositiveInteger(tileSize)) {
    diag.error(`« tileSize » doit être un entier positif (reçu ${String(tileSize)})`);
    return null;
  }
  return tileSize;
}

function readTile(name, def, spec, diag) {
  const label = `tuile « ${name} »`;
  if (!isPlainObject(def)) {
    diag.error(`${label} : un objet { "char": ..., "rows": [...] } est attendu`);
    return null;
  }
  for (const key of Object.keys(def)) {
    if (!KNOWN_TILE_KEYS.has(key)) diag.warn(`${label} : propriété « ${key} » inconnue, ignorée`);
  }
  const char = readTileChar(def.char, label, diag);
  const flags = readTileFlags(def, label, diag);
  const images = readTileImages(def, label, spec, diag);
  if (!char || !images) return null;
  return { name, char, ...flags, images, frames: def.frames !== undefined ? [] : undefined };
}

function readTileChar(char, label, diag) {
  if (typeof char !== 'string' || Array.from(char).length !== 1) {
    diag.error(`${label} : « char » doit être un seul caractère`);
    return null;
  }
  return char;
}

function readTileFlags(def, label, diag) {
  const flags = {};
  for (const flag of TILE_FLAGS) {
    const value = def[flag];
    if (value !== undefined && typeof value !== 'boolean') {
      diag.error(`${label} : « ${flag} » doit être un booléen`);
    }
    flags[flag] = value === true;
  }
  return flags;
}

function readTileImages(def, label, spec, diag) {
  const { tileSize, palette } = spec;
  if (def.rows !== undefined && def.frames !== undefined) {
    diag.error(`${label} : « rows » et « frames » sont exclusifs`);
    return null;
  }
  if (def.rows !== undefined) {
    return validateRows(def.rows, tileSize, tileSize, palette, diag, label)
      ? [[...def.rows]]
      : null;
  }
  if (!Array.isArray(def.frames) || def.frames.length < 2) {
    diag.error(
      `${label} : « rows » (tuile fixe) ou « frames » (2 à ${MAX_ANIMATION_FRAMES} images) attendu`,
    );
    return null;
  }
  if (def.frames.length > MAX_ANIMATION_FRAMES) {
    diag.warn(
      `${label} : ${def.frames.length} frames, ${MAX_ANIMATION_FRAMES} au maximum sont conseillées`,
    );
  }
  let ok = true;
  const images = def.frames.map((rows, i) => {
    if (!validateRows(rows, tileSize, tileSize, palette, diag, `${label}, image ${i + 1}`))
      ok = false;
    return Array.isArray(rows) ? [...rows] : [];
  });
  return ok ? images : null;
}

function checkCommonCatalogue(tiles, diag) {
  const byChar = new Map(tiles.map((tile) => [tile.char, tile]));
  for (const expected of COMMON_TILES) {
    const tile = byChar.get(expected.char);
    if (!tile) {
      diag.warn(`tuile du catalogue commun manquante : « ${expected.char} » (${expected.name})`);
      continue;
    }
    if (tile.solid !== expected.solid) {
      const wording = expected.solid ? 'solide' : 'non solide';
      diag.warn(
        `tuile « ${tile.name} » (« ${tile.char} ») : le catalogue commun la prévoit ${wording}`,
      );
    }
    if (expected.above && !tile.above) {
      diag.warn(
        `tuile « ${tile.name} » (« ${tile.char} ») : le catalogue commun la prévoit « above »`,
      );
    }
  }
}

function tileProperties(tile) {
  const props = {};
  for (const flag of TILE_FLAGS) props[flag] = tile[flag];
  return props;
}

/**
 * Rend un tileset analysé : PNG (grille de 16 colonnes) et JSON de correspondance.
 * @param {NonNullable<ReturnType<typeof parseTileset>['tileset']>} tileset
 */
export function renderTileset(tileset) {
  const { tileSize, tileCount } = tileset;
  const rows = Math.max(1, Math.ceil(tileCount / TILESET_COLUMNS));
  const imageWidth = TILESET_COLUMNS * tileSize;
  const imageHeight = rows * tileSize;
  const rgba = Buffer.alloc(imageWidth * imageHeight * 4);
  const tiles = {};

  for (const tile of tileset.tiles) {
    tile.images.forEach((image, i) => {
      const index = tile.index + i;
      const x = (index % TILESET_COLUMNS) * tileSize;
      const y = Math.floor(index / TILESET_COLUMNS) * tileSize;
      paintRows(rgba, imageWidth, x, y, image, tileset.palette);
    });
    tiles[tile.name] = { index: tile.index, char: tile.char, ...tileProperties(tile) };
    if (tile.frames) tiles[tile.name].frames = [...tile.frames];
  }

  const json = {
    id: tileset.id,
    tileSize,
    columns: TILESET_COLUMNS,
    tileCount,
    imageWidth,
    imageHeight,
    tiles,
    legend: { ...tileset.legend },
  };
  return { png: encodePng(imageWidth, imageHeight, rgba), json };
}

/** Tuile rouge semi-transparente utilisée par le calque « collisions » dans Tiled. */
export function renderCollisionTile(tileSize = DEFAULT_TILE_SIZE) {
  const rgba = Buffer.alloc(tileSize * tileSize * 4);
  for (let y = 0; y < tileSize; y++) {
    for (let x = 0; x < tileSize; x++) {
      const border = x === 0 || y === 0 || x === tileSize - 1 || y === tileSize - 1;
      const offset = (y * tileSize + x) * 4;
      rgba[offset] = 255;
      rgba[offset + 1] = border ? 40 : 0;
      rgba[offset + 2] = border ? 40 : 0;
      rgba[offset + 3] = border ? 200 : 96;
    }
  }
  return encodePng(tileSize, tileSize, rgba);
}

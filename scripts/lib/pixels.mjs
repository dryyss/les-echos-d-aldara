// Helpers partagés par les sprites et les tilesets : palette, grilles de caractères, peinture RGBA.
import { isPlainObject } from './diagnostics.mjs';

export const TRANSPARENT_CHAR = '.';
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/;

/** Convertit « #rrggbb » ou « #rrggbbaa » en [r, g, b, a]. */
export function parseColor(hex) {
  const value = hex.slice(1);
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const a = value.length === 8 ? parseInt(value.slice(6, 8), 16) : 255;
  return [r, g, b, a];
}

/**
 * Valide une palette `{ "c": "#rrggbb" }` et renvoie seulement les entrées correctes.
 * @param {unknown} palette
 * @param {ReturnType<typeof import('./diagnostics.mjs').createDiagnostics>} diag
 * @param {{ label?: string, required?: boolean }} [options]
 */
export function validatePalette(palette, diag, options = {}) {
  const label = options.label ?? 'palette';
  if (palette === undefined) {
    if (options.required) diag.error(`« ${label} » manquante`);
    return {};
  }
  if (!isPlainObject(palette)) {
    diag.error(`« ${label} » doit être un objet { "caractère": "#rrggbb" }`);
    return {};
  }
  const valid = {};
  for (const [char, color] of Object.entries(palette)) {
    if (Array.from(char).length !== 1) {
      diag.error(`${label} : la clé « ${char} » doit être un seul caractère`);
    } else if (char === TRANSPARENT_CHAR) {
      diag.error(`${label} : le caractère « . » est réservé à la transparence`);
    } else if (typeof color !== 'string' || !COLOR_PATTERN.test(color)) {
      diag.error(
        `${label} : couleur « ${String(color)} » invalide pour « ${char} » (#rrggbb attendu)`,
      );
    } else {
      valid[char] = color;
    }
  }
  return valid;
}

/**
 * Vérifie qu'une grille de caractères fait exactement width × height et que chaque
 * caractère est « . » ou une couleur de la palette. Renvoie true si tout est correct.
 */
export function validateRows(rows, width, height, palette, diag, label) {
  if (!Array.isArray(rows)) {
    diag.error(`${label} : un tableau de ${height} lignes est attendu`);
    return false;
  }
  let ok = true;
  if (rows.length !== height) {
    diag.error(`${label} : ${rows.length} lignes au lieu de ${height}`);
    ok = false;
  }
  const reported = new Set();
  rows.forEach((row, index) => {
    const line = index + 1;
    if (typeof row !== 'string') {
      diag.error(`${label}, ligne ${line} : une chaîne de ${width} caractères est attendue`);
      ok = false;
      return;
    }
    const chars = Array.from(row);
    if (chars.length !== width) {
      diag.error(`${label}, ligne ${line} : ${chars.length} caractères au lieu de ${width}`);
      ok = false;
    }
    chars.forEach((char, column) => {
      if (char === TRANSPARENT_CHAR || char in palette || reported.has(char)) return;
      reported.add(char);
      diag.error(
        `${label}, ligne ${line}, colonne ${column + 1} : caractère « ${char} » absent de la palette`,
      );
      ok = false;
    });
  });
  return ok;
}

/** Miroir horizontal d'une grille de caractères. */
export function mirrorRows(rows) {
  return rows.map((row) => Array.from(row).reverse().join(''));
}

/**
 * Peint une grille de caractères dans un tampon RGBA à la position donnée.
 * Les caractères inconnus et « . » restent transparents.
 */
export function paintRows(target, targetWidth, offsetX, offsetY, rows, palette) {
  const colors = new Map(Object.entries(palette).map(([char, hex]) => [char, parseColor(hex)]));
  rows.forEach((row, y) => {
    Array.from(row).forEach((char, x) => {
      const color = colors.get(char);
      if (!color) return;
      const offset = ((offsetY + y) * targetWidth + offsetX + x) * 4;
      target[offset] = color[0];
      target[offset + 1] = color[1];
      target[offset + 2] = color[2];
      target[offset + 3] = color[3];
    });
  });
}

/** Nombre de colonnes d'une grille d'images, pour une grille à peu près carrée. */
export function squareColumns(count) {
  return Math.max(1, Math.ceil(Math.sqrt(count)));
}

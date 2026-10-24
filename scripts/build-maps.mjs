#!/usr/bin/env node
// Convertit maps/*.json en assets/maps/*.tmj (Tiled 1.10) à partir des tilesets déjà
// générés dans assets/tiles par build-art. Voir docs/technique/format-cartes.md.
//
// Usage : node scripts/build-maps.mjs [--root <dossier du projet>]
// Code de sortie 1 s'il y a au moins une erreur ; toutes les erreurs sont affichées.
import path from 'node:path';
import {
  baseName,
  displayPath,
  listJsonFiles,
  readJson,
  resolveRoot,
  writeFile,
} from './lib/fs.mjs';
import { toJsonFile } from './lib/json.mjs';
import { convertMap } from './lib/maps.mjs';
import { COLLISION_TILESET_ID } from './lib/tiles.mjs';

const TAG = '[build-maps]';

function loadTilesets(root, report) {
  const tilesets = new Map();
  for (const file of listJsonFiles(path.join(root, 'assets', 'tiles'))) {
    if (baseName(file) === 'manifest') continue;
    const { json, error } = readJson(file);
    if (error || !json || typeof json.id !== 'string') {
      report.errors.push(
        `${displayPath(root, file)} : tileset généré illisible (${error ?? 'id manquant'})`,
      );
      continue;
    }
    tilesets.set(json.id, json);
  }
  return tilesets;
}

function loadMaps(root, report) {
  const maps = [];
  const byId = new Map();
  for (const file of listJsonFiles(path.join(root, 'maps'))) {
    const display = displayPath(root, file);
    const { json, error } = readJson(file);
    if (error) {
      report.errors.push(`${display} : JSON invalide (${error})`);
      continue;
    }
    const id = json && typeof json.id === 'string' ? json.id : baseName(file);
    if (id !== baseName(file))
      report.warnings.push(`${display} : l’id « ${id} » diffère du nom du fichier`);
    if (byId.has(id))
      report.errors.push(
        `${display} : identifiant « ${id} » déjà utilisé par ${byId.get(id).display}`,
      );
    const entry = { id, json, file, display };
    byId.set(id, entry);
    maps.push(entry);
  }
  return { maps, byId };
}

function buildMaps(root, report) {
  const tilesets = loadTilesets(root, report);
  const { maps, byId } = loadMaps(root, report);
  const loadMap = (id) => byId.get(id)?.json ?? null;
  const mapsDir = path.join(root, 'maps');
  const outDir = path.join(root, 'assets', 'maps');
  let count = 0;

  for (const map of maps) {
    const tilesetId = map.json?.tileset;
    const tileset = typeof tilesetId === 'string' ? tilesets.get(tilesetId) : undefined;
    if (!tileset) {
      report.errors.push(
        `${map.display} : tileset « ${String(tilesetId)} » introuvable dans assets/tiles (lance d’abord node scripts/build-art.mjs)`,
      );
      continue;
    }
    const converted = convertMap(
      map.json,
      tileset,
      { image: `../tiles/${COLLISION_TILESET_ID}.png`, tileSize: tileset.tileSize },
      { file: map.display, loadMap },
    );
    report.errors.push(...converted.errors);
    report.warnings.push(...converted.warnings);
    if (!converted.tmj) continue;
    const relative = path.relative(mapsDir, map.file).replace(/\.json$/, '.tmj');
    writeFile(path.join(outDir, relative), toJsonFile(converted.tmj));
    count += 1;
  }
  return count;
}

function printList(title, items) {
  if (items.length === 0) return;
  console.info(`${TAG} ${items.length} ${title} :`);
  for (const item of items) console.info(`  - ${item}`);
}

function main() {
  const root = resolveRoot();
  const report = { errors: [], warnings: [] };
  const count = buildMaps(root, report);

  console.info(`${TAG} ${count} cartes`);
  printList('avertissement(s)', report.warnings);
  printList('erreur(s)', report.errors);
  if (report.errors.length > 0) {
    console.error(`${TAG} échec : corrige les erreurs ci-dessus.`);
    process.exitCode = 1;
  }
}

main();

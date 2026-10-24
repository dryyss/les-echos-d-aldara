#!/usr/bin/env node
// Génère assets/sprites (PNG + atlas + manifest) et assets/tiles (PNG + JSON + manifest)
// depuis les sources texte de art/. Voir docs/technique/format-art.md.
//
// Usage : node scripts/build-art.mjs [--root <dossier du projet>]
// Code de sortie 1 s'il y a au moins une erreur ; toutes les erreurs sont affichées.
import path from 'node:path';
import { parseSprite, renderSprite } from './lib/art.mjs';
import {
  baseName,
  displayPath,
  listJsonFiles,
  readJson,
  resolveRoot,
  writeFile,
} from './lib/fs.mjs';
import { toJsonFile } from './lib/json.mjs';
import {
  COLLISION_TILESET_ID,
  parseTileset,
  renderCollisionTile,
  renderTileset,
} from './lib/tiles.mjs';

const SPRITE_DIRS = ['sprites', 'portraits', 'ui'];
const TAG = '[build-art]';

/** Charge les fichiers JSON d'une liste, indexés par id (l'id doit être unique). */
function loadSources(files, root, report) {
  const sources = new Map();
  for (const file of files) {
    const display = displayPath(root, file);
    const { json, error } = readJson(file);
    if (error) {
      report.errors.push(`${display} : JSON invalide (${error})`);
      continue;
    }
    const id = json && typeof json.id === 'string' ? json.id : null;
    if (!id) {
      report.errors.push(`${display} : propriété « id » manquante ou invalide`);
      continue;
    }
    if (id !== baseName(file)) {
      report.warnings.push(`${display} : l’id « ${id} » diffère du nom du fichier`);
    }
    const source = { json, file, display, matchesName: id === baseName(file) };
    const existing = sources.get(id);
    if (!existing) {
      sources.set(id, source);
      continue;
    }
    // En cas de doublon, le fichier dont le nom correspond à l'id est conservé.
    const [kept, rejected] =
      source.matchesName && !existing.matchesName ? [source, existing] : [existing, source];
    sources.set(id, kept);
    report.errors.push(
      `${rejected.display} : identifiant « ${id} » déjà utilisé par ${kept.display}`,
    );
  }
  return sources;
}

function buildSprites(root, outDir, report) {
  const files = SPRITE_DIRS.flatMap((dir) => listJsonFiles(path.join(root, 'art', dir)));
  const sources = loadSources(files, root, report);
  const resolveBase = (id) => sources.get(id)?.json ?? null;
  const baseFile = (id) => sources.get(id)?.display;
  const manifest = [];

  for (const [id, source] of sources) {
    const parsed = parseSprite(source.json, resolveBase, { file: source.display, baseFile });
    report.errors.push(...parsed.errors);
    report.warnings.push(...parsed.warnings);
    if (!parsed.sprite) continue;
    const rendered = renderSprite(parsed.sprite);
    writeFile(path.join(outDir, `${id}.png`), rendered.png);
    writeFile(path.join(outDir, `${id}.json`), toJsonFile(rendered.atlas));
    manifest.push(rendered.manifestEntry);
  }

  manifest.sort((a, b) => a.id.localeCompare(b.id));
  writeFile(path.join(outDir, 'manifest.json'), toJsonFile({ sprites: manifest }));
  return manifest.length;
}

function buildTilesets(root, outDir, report) {
  const files = listJsonFiles(path.join(root, 'art', 'tiles'));
  const sources = loadSources(files, root, report);
  const ids = [];

  for (const [id, source] of sources) {
    if (id === COLLISION_TILESET_ID) {
      report.errors.push(
        `${source.display} : l’identifiant « ${COLLISION_TILESET_ID} » est réservé`,
      );
      continue;
    }
    const parsed = parseTileset(source.json, { file: source.display });
    report.errors.push(...parsed.errors);
    report.warnings.push(...parsed.warnings);
    if (!parsed.tileset) continue;
    const rendered = renderTileset(parsed.tileset);
    writeFile(path.join(outDir, `${id}.png`), rendered.png);
    writeFile(path.join(outDir, `${id}.json`), toJsonFile(rendered.json));
    ids.push(id);
  }

  ids.sort((a, b) => a.localeCompare(b));
  writeFile(path.join(outDir, `${COLLISION_TILESET_ID}.png`), renderCollisionTile());
  writeFile(path.join(outDir, 'manifest.json'), toJsonFile({ tilesets: ids }));
  return ids.length;
}

function printList(title, items) {
  if (items.length === 0) return;
  console.info(`${TAG} ${items.length} ${title} :`);
  for (const item of items) console.info(`  - ${item}`);
}

function main() {
  const root = resolveRoot();
  const report = { errors: [], warnings: [] };
  const spriteCount = buildSprites(root, path.join(root, 'assets', 'sprites'), report);
  const tilesetCount = buildTilesets(root, path.join(root, 'assets', 'tiles'), report);

  console.info(`${TAG} ${spriteCount} sprites, ${tilesetCount} tilesets`);
  printList('avertissement(s)', report.warnings);
  printList('erreur(s)', report.errors);
  if (report.errors.length > 0) {
    console.error(`${TAG} échec : corrige les erreurs ci-dessus.`);
    process.exitCode = 1;
  }
}

main();

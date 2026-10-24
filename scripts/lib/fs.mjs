// Accès fichiers partagés par les scripts de génération.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Racine du projet (dossier parent de scripts/), sauf si `--root <dossier>` est passé. */
export function resolveRoot(argv = process.argv.slice(2)) {
  const index = argv.indexOf('--root');
  if (index !== -1 && argv[index + 1]) return path.resolve(argv[index + 1]);
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
}

/** Liste récursive et triée des fichiers .json d'un dossier (vide si le dossier n'existe pas). */
export function listJsonFiles(dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...listJsonFiles(full));
    else if (entry.endsWith('.json')) files.push(full);
  }
  return files;
}

/** Lit un fichier JSON : `{ json }` ou `{ error }` avec un message lisible. */
export function readJson(file) {
  try {
    return { json: JSON.parse(readFileSync(file, 'utf8')), error: null };
  } catch (error) {
    return { json: null, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Écrit un fichier en créant les dossiers manquants. */
export function writeFile(file, data) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, data);
}

export function toPosix(p) {
  return p.split(path.sep).join('/');
}

/** Chemin relatif à la racine, avec des « / », pour les messages. */
export function displayPath(root, file) {
  return toPosix(path.relative(root, file));
}

export function baseName(file) {
  return path.basename(file, '.json');
}

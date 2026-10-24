/**
 * Version du format de sauvegarde et migrations entre versions.
 *
 * Pour changer le format : incrémente SAVE_VERSION et ajoute une migration
 * `{ from: ancienne, migrate }` qui transforme un fichier de `from` en `from + 1`.
 */
import type { SaveFile } from '../../data/types';

export const SAVE_VERSION = 1;

export interface Migration {
  /** Version du fichier que cette migration accepte. */
  from: number;
  migrate: (file: SaveFile) => SaveFile;
}

/** Migrations connues, dans l'ordre des versions. Vide tant que le format est en version 1. */
export const MIGRATIONS: readonly Migration[] = [];

/**
 * Applique les migrations nécessaires pour amener `file` à `targetVersion`.
 * Lance une erreur si une migration manque ou si le fichier vient d'une version plus récente.
 */
export function migrateSaveFile(
  file: SaveFile,
  migrations: readonly Migration[] = MIGRATIONS,
  targetVersion: number = SAVE_VERSION,
): SaveFile {
  if (file.saveVersion > targetVersion) {
    throw new Error(
      `Sauvegarde en version ${file.saveVersion}, plus récente que le jeu (version ${targetVersion}).`,
    );
  }
  let current = file;
  while (current.saveVersion < targetVersion) {
    const version = current.saveVersion;
    const migration = migrations.find((m) => m.from === version);
    if (!migration) {
      throw new Error(`Aucune migration de sauvegarde depuis la version ${version}.`);
    }
    current = { ...migration.migrate(current), saveVersion: version + 1 };
  }
  return current;
}

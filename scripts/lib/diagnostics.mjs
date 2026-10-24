/**
 * Collecte les erreurs et avertissements d'un fichier source.
 * Chaque message est préfixé par le nom du fichier pour rester lisible une fois agrégé.
 */
export function createDiagnostics(file) {
  const errors = [];
  const warnings = [];
  const prefix = file ? `${file} : ` : '';
  return {
    file,
    errors,
    warnings,
    error(message) {
      errors.push(prefix + message);
    },
    warn(message) {
      warnings.push(prefix + message);
    },
    get hasErrors() {
      return errors.length > 0;
    },
  };
}

export function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

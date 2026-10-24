// Sérialisation JSON lisible : indentée, mais les tableaux de nombres restent sur une ligne
// (les calques Tiled contiennent des milliers d'entiers).

function isNumberArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'number');
}

export function stringifyCompact(value, indent = '') {
  if (isNumberArray(value)) return `[${value.join(', ')}]`;
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const inner = indent + '  ';
    const items = value.map((item) => inner + stringifyCompact(item, inner));
    return `[\n${items.join(',\n')}\n${indent}]`;
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return '{}';
    const inner = indent + '  ';
    const items = entries.map(
      ([key, v]) => `${inner}${JSON.stringify(key)}: ${stringifyCompact(v, inner)}`,
    );
    return `{\n${items.join(',\n')}\n${indent}}`;
  }
  return JSON.stringify(value);
}

export function toJsonFile(value) {
  return `${stringifyCompact(value)}\n`;
}

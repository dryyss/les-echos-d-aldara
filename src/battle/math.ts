/** Arrondi inférieur tolérant aux erreurs de virgule flottante (1,12 × 100 = 111,999…). */
export function floorSafe(value: number): number {
  return Math.floor(value + 1e-9);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function average(values: readonly number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

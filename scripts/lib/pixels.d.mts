import type { createDiagnostics } from './diagnostics.mjs';

export const TRANSPARENT_CHAR: string;
export function parseColor(hex: string): [number, number, number, number];
export function validatePalette(
  palette: unknown,
  diag: ReturnType<typeof createDiagnostics>,
  options?: { label?: string; required?: boolean },
): Record<string, string>;
export function validateRows(
  rows: unknown,
  width: number,
  height: number,
  palette: Record<string, string>,
  diag: ReturnType<typeof createDiagnostics>,
  label: string,
): boolean;
export function mirrorRows(rows: string[]): string[];
export function paintRows(
  target: Uint8Array,
  targetWidth: number,
  offsetX: number,
  offsetY: number,
  rows: string[],
  palette: Record<string, string>,
): void;
export function squareColumns(count: number): number;

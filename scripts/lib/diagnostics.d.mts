export interface Diagnostics {
  file: string | undefined;
  errors: string[];
  warnings: string[];
  error(message: string): void;
  warn(message: string): void;
  readonly hasErrors: boolean;
}

export function createDiagnostics(file?: string): Diagnostics;
export function isPlainObject(value: unknown): value is Record<string, unknown>;
export function isPositiveInteger(value: unknown): value is number;

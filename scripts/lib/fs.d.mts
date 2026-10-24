export function resolveRoot(argv?: string[]): string;
export function listJsonFiles(dir: string): string[];
export function readJson(file: string): { json: unknown; error: string | null };
export function writeFile(file: string, data: string | Uint8Array): void;
export function toPosix(p: string): string;
export function displayPath(root: string, file: string): string;
export function baseName(file: string): string;

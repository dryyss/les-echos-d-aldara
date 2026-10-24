import type { Buffer } from 'node:buffer';

export type SpriteKind =
  'character' | 'battle' | 'enemy' | 'portrait' | 'object' | 'icon' | 'effect' | 'background';

export interface SpriteAnimation {
  frames: string[];
  frameRate: number;
  repeat: number;
}

export interface ResolvedFrame {
  rows: string[];
  overrides: Record<string, string>;
}

export interface ParsedSprite {
  id: string;
  kind: SpriteKind;
  width: number;
  height: number;
  palette: Record<string, string>;
  frames: Record<string, ResolvedFrame>;
  animations: Record<string, SpriteAnimation>;
  customAnimations: Record<string, SpriteAnimation>;
}

export interface ParseSpriteResult {
  sprite: ParsedSprite | null;
  errors: string[];
  warnings: string[];
}

export interface ParseSpriteOptions {
  file?: string;
  baseFile?: (id: string) => string | undefined;
  chain?: string[];
}

export interface AtlasFrame {
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
}

export interface Atlas {
  frames: Record<string, AtlasFrame>;
  meta: { image: string; format: string; size: { w: number; h: number }; scale: string };
}

export interface ManifestEntry {
  id: string;
  kind: SpriteKind;
  width: number;
  height: number;
  animations: Record<string, SpriteAnimation>;
}

export interface SpriteLayout {
  columns: number;
  rows: number;
  imageWidth: number;
  imageHeight: number;
}

export interface RenderedSprite {
  png: Buffer;
  atlas: Atlas;
  manifestEntry: ManifestEntry;
  layout: SpriteLayout;
}

export const SPRITE_KINDS: readonly SpriteKind[];
export const KIND_RULES: Record<SpriteKind, unknown>;

export function parseSprite(
  json: unknown,
  resolveBase?: (id: string) => unknown,
  options?: ParseSpriteOptions,
): ParseSpriteResult;
export function generateAnimations(
  kind: SpriteKind,
  frames: Record<string, unknown>,
): Record<string, SpriteAnimation>;
export function spriteLayout(frameCount: number, width: number, height: number): SpriteLayout;
export function renderSprite(sprite: ParsedSprite): RenderedSprite;

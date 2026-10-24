import type { Buffer } from 'node:buffer';

export type TileFlag = 'solid' | 'above' | 'water' | 'lava' | 'gap' | 'climb' | 'slow' | 'ice';

export interface ParsedTile extends Record<TileFlag, boolean> {
  name: string;
  char: string;
  index: number;
  images: string[][];
  frames?: number[];
}

export interface ParsedTileset {
  id: string;
  tileSize: number;
  palette: Record<string, string>;
  tiles: ParsedTile[];
  legend: Record<string, string>;
  tileCount: number;
}

export interface ParseTilesetResult {
  tileset: ParsedTileset | null;
  errors: string[];
  warnings: string[];
}

export interface TilesetTileJson extends Record<TileFlag, boolean> {
  index: number;
  char: string;
  frames?: number[];
}

export interface TilesetJson {
  id: string;
  tileSize: number;
  columns: number;
  tileCount: number;
  imageWidth: number;
  imageHeight: number;
  tiles: Record<string, TilesetTileJson>;
  legend: Record<string, string>;
}

export interface CommonTile {
  char: string;
  name: string;
  solid: boolean;
  above?: boolean;
  water?: boolean;
  gap?: boolean;
  lava?: boolean;
  ice?: boolean;
  slow?: boolean;
}

export const TILESET_COLUMNS: number;
export const DEFAULT_TILE_SIZE: number;
export const COLLISION_TILESET_ID: string;
export const TILE_FLAGS: readonly TileFlag[];
export const COMMON_TILES: readonly CommonTile[];

export function parseTileset(json: unknown, options?: { file?: string }): ParseTilesetResult;
export function renderTileset(tileset: ParsedTileset): { png: Buffer; json: TilesetJson };
export function renderCollisionTile(tileSize?: number): Buffer;

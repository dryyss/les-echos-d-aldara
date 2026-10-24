export interface TiledProperty {
  name: string;
  type: 'string' | 'int' | 'float' | 'bool';
  value: string | number | boolean;
}

export interface TiledTileLayer {
  data: number[];
  height: number;
  id: number;
  name: string;
  opacity: number;
  type: 'tilelayer';
  visible: boolean;
  width: number;
  x: number;
  y: number;
}

export interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  rotation: number;
  properties: TiledProperty[];
}

export interface TiledObjectLayer {
  draworder: string;
  id: number;
  name: string;
  objects: TiledObject[];
  opacity: number;
  type: 'objectgroup';
  visible: boolean;
  x: number;
  y: number;
}

export interface TiledTilesetTile {
  id: number;
  properties: TiledProperty[];
  animation?: { tileid: number; duration: number }[];
}

export interface TiledTileset {
  columns: number;
  firstgid: number;
  image: string;
  imageheight: number;
  imagewidth: number;
  margin: number;
  name: string;
  spacing: number;
  tilecount: number;
  tileheight: number;
  tilewidth: number;
  tiles: TiledTilesetTile[];
}

export interface TiledMap {
  compressionlevel: number;
  height: number;
  infinite: boolean;
  layers: (TiledTileLayer | TiledObjectLayer)[];
  nextlayerid: number;
  nextobjectid: number;
  orientation: 'orthogonal';
  properties: TiledProperty[];
  renderorder: string;
  tiledversion: string;
  tileheight: number;
  tilesets: TiledTileset[];
  tilewidth: number;
  type: 'map';
  version: string;
  width: number;
}

export interface ConvertMapResult {
  tmj: TiledMap | null;
  errors: string[];
  warnings: string[];
}

export interface CollisionInfo {
  image?: string;
  tileSize?: number;
}

export interface ConvertMapOptions {
  file?: string;
  loadMap?: (id: string) => unknown;
}

export const TILED_VERSION: string;
export const TILED_EDITOR_VERSION: string;
export const ANIMATION_FRAME_DURATION: number;
export const DEFAULT_SPAWN: string;
export const DIRECTIONS: readonly string[];
export const OBJECT_TYPES: Record<string, string[]>;
export const PUZZLE_TYPES: readonly string[];

export function convertMap(
  mapJson: unknown,
  tilesetJson: unknown,
  collisionInfo?: CollisionInfo,
  options?: ConvertMapOptions,
): ConvertMapResult;
export function toTiledProperty(name: string, value: unknown): TiledProperty | null;

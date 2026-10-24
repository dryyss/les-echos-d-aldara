import type { Direction } from '../data/types';

export interface TiledProperty {
  name: string;
  type?: string;
  value: unknown;
}

export interface TiledObject {
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: TiledProperty[] | Record<string, unknown>;
}

export function tiledProp(object: TiledObject, name: string): unknown {
  const props = object.properties;
  if (Array.isArray(props)) return props.find((prop) => prop.name === name)?.value;
  if (props && typeof props === 'object') return props[name];
  return undefined;
}

export function tiledProps(map: { properties?: unknown }, name: string): unknown {
  const props = map.properties;
  if (Array.isArray(props)) {
    const found = props.find((prop) => isTiledProperty(prop) && prop.name === name);
    return isTiledProperty(found) ? found.value : undefined;
  }
  if (props && typeof props === 'object') return (props as Record<string, unknown>)[name];
  return undefined;
}

function isTiledProperty(value: unknown): value is TiledProperty {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof (value as TiledProperty).name === 'string'
  );
}

export function parseJsonProp<T>(value: unknown): T | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'object') return value as T;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function asDirection(value: unknown, fallback: Direction = 'down'): Direction {
  return value === 'up' || value === 'down' || value === 'left' || value === 'right'
    ? value
    : fallback;
}

export function objectTile(object: TiledObject, tileSize: number): { x: number; y: number } {
  return {
    x: Math.floor(object.x / tileSize),
    y: Math.floor(object.y / tileSize),
  };
}

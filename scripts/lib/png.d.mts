import type { Buffer } from 'node:buffer';

export interface DecodedPng {
  width: number;
  height: number;
  data: Buffer;
}

export function crc32(bytes: Uint8Array): number;
export function encodePng(width: number, height: number, rgba: Uint8Array): Buffer;
export function decodePng(bytes: Uint8Array): DecodedPng;
export function pixelAt(image: DecodedPng, x: number, y: number): [number, number, number, number];

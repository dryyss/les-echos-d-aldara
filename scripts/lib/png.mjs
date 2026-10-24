// Encodeur et décodeur PNG minimalistes (RGBA 8 bits, filtre 0, sans dépendance).
import { deflateSync, inflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const COLOR_TYPE_RGBA = 6;
const BIT_DEPTH = 8;
const BYTES_PER_PIXEL = 4;

const CRC_TABLE = buildCrcTable();

function buildCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

/** CRC32 standard (ISO 3309), tel qu'utilisé par les chunks PNG. */
export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

function buildHeader(width, height) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = BIT_DEPTH;
  ihdr[9] = COLOR_TYPE_RGBA;
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filtre
  ihdr[12] = 0; // pas d'entrelacement
  return ihdr;
}

function toBuffer(bytes) {
  if (Buffer.isBuffer(bytes)) return bytes;
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

/**
 * Encode une image RGBA (4 octets par pixel, lignes de haut en bas) en PNG.
 * @param {number} width
 * @param {number} height
 * @param {Uint8Array} rgba
 * @returns {Buffer}
 */
export function encodePng(width, height, rgba) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error(`encodePng : dimensions invalides (${width} × ${height})`);
  }
  const pixels = toBuffer(rgba);
  const expected = width * height * BYTES_PER_PIXEL;
  if (pixels.length !== expected) {
    throw new Error(
      `encodePng : ${pixels.length} octets reçus, ${expected} attendus pour ${width} × ${height} RGBA`,
    );
  }

  const stride = width * BYTES_PER_PIXEL;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const offset = y * (stride + 1);
    raw[offset] = 0; // filtre « None »
    pixels.copy(raw, offset + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    SIGNATURE,
    writeChunk('IHDR', buildHeader(width, height)),
    writeChunk('IDAT', deflateSync(raw, { level: 9 })),
    writeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function readChunks(buffer) {
  const chunks = [];
  let offset = SIGNATURE.length;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('latin1', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 12 + length;
    if (type === 'IEND') break;
  }
  return chunks;
}

/**
 * Décode un PNG produit par encodePng (RGBA 8 bits, filtre 0 uniquement).
 * Sert aux tests et aux vérifications : ce n'est pas un décodeur général.
 * @param {Uint8Array} bytes
 * @returns {{ width: number, height: number, data: Buffer }}
 */
export function decodePng(bytes) {
  const buffer = toBuffer(bytes);
  if (!buffer.subarray(0, 8).equals(SIGNATURE)) {
    throw new Error('decodePng : signature PNG absente');
  }
  const chunks = readChunks(buffer);
  const ihdr = chunks.find((chunk) => chunk.type === 'IHDR');
  if (!ihdr) throw new Error('decodePng : chunk IHDR absent');
  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  if (ihdr.data[8] !== BIT_DEPTH || ihdr.data[9] !== COLOR_TYPE_RGBA) {
    throw new Error('decodePng : seul le format RGBA 8 bits est pris en charge');
  }

  const idat = Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data));
  const raw = inflateSync(idat);
  const stride = width * BYTES_PER_PIXEL;
  const data = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const offset = y * (stride + 1);
    if (raw[offset] !== 0) {
      throw new Error(`decodePng : filtre ${raw[offset]} non pris en charge (ligne ${y})`);
    }
    raw.copy(data, y * stride, offset + 1, offset + 1 + stride);
  }
  return { width, height, data };
}

/** Lit un pixel [r, g, b, a] d'une image décodée. */
export function pixelAt(image, x, y) {
  const offset = (y * image.width + x) * BYTES_PER_PIXEL;
  return [
    image.data[offset],
    image.data[offset + 1],
    image.data[offset + 2],
    image.data[offset + 3],
  ];
}

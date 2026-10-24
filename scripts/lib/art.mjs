// Conversion des sprites texte (art/sprites, art/portraits, art/ui) en PNG + atlas Phaser.
// Voir docs/technique/format-art.md.
import { createDiagnostics, isPlainObject, isPositiveInteger } from './diagnostics.mjs';
import { mirrorRows, paintRows, squareColumns, validatePalette, validateRows } from './pixels.mjs';
import { encodePng } from './png.mjs';

export const SPRITE_KINDS = [
  'character',
  'battle',
  'enemy',
  'portrait',
  'object',
  'icon',
  'effect',
  'background',
];

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DIRECTIONS = ['down', 'up', 'left', 'right'];
const WALK_CYCLE = [1, 0, 2, 0];

/**
 * Règles par `kind` : tailles attendues (avertissement si différent), frames obligatoires
 * (erreur si absentes) et animations générées automatiquement.
 * Une animation est soit une liste explicite de frames, soit un préfixe : toutes les frames
 * `<prefix>-N` sont prises dans l'ordre numérique (au moins `min`, 1 par défaut).
 */
export const KIND_RULES = {
  character: {
    sizes: [{ width: 16, height: 24 }],
    required: DIRECTIONS.flatMap((dir) => [0, 1, 2].map((i) => `${dir}-${i}`)),
    animations: DIRECTIONS.flatMap((dir) => [
      { name: `idle-${dir}`, frames: [`${dir}-0`], frameRate: 1, repeat: -1 },
      {
        name: `walk-${dir}`,
        frames: WALK_CYCLE.map((i) => `${dir}-${i}`),
        frameRate: 8,
        repeat: -1,
      },
    ]),
  },
  battle: {
    sizes: [{ width: 32, height: 48 }],
    required: [
      'idle-0',
      'idle-1',
      'attack-0',
      'attack-1',
      'cast-0',
      'cast-1',
      'hurt-0',
      'ko-0',
      'victory-0',
    ],
    animations: [
      { name: 'idle', prefix: 'idle', frameRate: 2, repeat: -1 },
      { name: 'attack', prefix: 'attack', frameRate: 8, repeat: 0 },
      { name: 'cast', prefix: 'cast', frameRate: 8, repeat: 0 },
      { name: 'hurt', prefix: 'hurt', frameRate: 8, repeat: 0 },
      { name: 'ko', prefix: 'ko', frameRate: 4, repeat: 0 },
      { name: 'victory', prefix: 'victory', frameRate: 4, repeat: 0 },
    ],
  },
  enemy: {
    sizes: 'multiple-of-8',
    required: ['idle-0', 'idle-1', 'attack-0', 'hurt-0'],
    animations: [
      { name: 'idle', prefix: 'idle', frameRate: 2, repeat: -1 },
      { name: 'attack', prefix: 'attack', frameRate: 8, repeat: 0 },
      { name: 'hurt', prefix: 'hurt', frameRate: 8, repeat: 0 },
    ],
  },
  portrait: {
    sizes: [{ width: 48, height: 48 }],
    required: ['neutre'],
    animations: [],
  },
  object: {
    sizes: [
      { width: 16, height: 16 },
      { width: 16, height: 24 },
    ],
    required: ['idle-0'],
    animations: [
      { name: 'on', prefix: 'on', min: 2, frameRate: 4, repeat: -1 },
      // Extension : les objets à plusieurs frames idle (Lueurs, moulin) obtiennent une boucle.
      { name: 'idle', prefix: 'idle', min: 2, frameRate: 4, repeat: -1 },
    ],
  },
  icon: {
    sizes: [{ width: 16, height: 16 }],
    required: ['idle-0'],
    animations: [{ name: 'idle', prefix: 'idle', frameRate: 4, repeat: -1 }],
  },
  effect: {
    sizes: null,
    required: ['idle-0'],
    animations: [{ name: 'idle', prefix: 'idle', frameRate: 8, repeat: 0 }],
  },
  background: {
    sizes: [{ width: 200, height: 60 }],
    required: ['idle-0'],
    animations: [{ name: 'idle', prefix: 'idle', frameRate: 4, repeat: -1 }],
  },
};

function describeSprite(json) {
  const id = isPlainObject(json) && typeof json.id === 'string' ? json.id : '?';
  return `sprite « ${id} »`;
}

function result(sprite, diag) {
  return { sprite: diag.hasErrors ? null : sprite, errors: diag.errors, warnings: diag.warnings };
}

/**
 * Analyse un fichier sprite et renvoie `{ sprite, errors, warnings }`.
 * `sprite` vaut null dès qu'il y a une erreur.
 *
 * @param {unknown} json contenu du fichier
 * @param {(id: string) => unknown} resolveBase renvoie le JSON du sprite `base` demandé (ou null)
 * @param {{ file?: string, baseFile?: (id: string) => string | undefined, chain?: string[] }} [options]
 */
export function parseSprite(json, resolveBase = () => null, options = {}) {
  const diag = createDiagnostics(options.file ?? describeSprite(json));
  if (!isPlainObject(json)) {
    diag.error('le fichier doit contenir un objet JSON');
    return result(null, diag);
  }

  const id = readId(json, diag);
  const base = resolveSpriteBase(json, resolveBase, options, diag);
  if (json.base !== undefined && !base) return result(null, diag);

  const kind = readKind(json, base, diag);
  const { width, height } = readSize(json, base, diag);
  const palette = {
    ...(base?.palette ?? {}),
    ...validatePalette(json.palette, diag, { required: !base }),
  };
  if (!kind || !width || !height) return result(null, diag);

  const { frames, failed } = resolveFrames(
    json.frames,
    base?.frames ?? {},
    { width, height, palette },
    diag,
  );
  checkRequiredFrames(kind, frames, failed, diag);
  checkKindSize(kind, width, height, diag);

  const customAnimations = {
    ...(base?.customAnimations ?? {}),
    ...readAnimations(json.animations, frames, diag),
  };
  const animations = { ...generateAnimations(kind, frames), ...customAnimations };

  return result({ id, kind, width, height, palette, frames, animations, customAnimations }, diag);
}

function readId(json, diag) {
  if (typeof json.id !== 'string' || json.id.length === 0) {
    diag.error('propriété « id » manquante ou invalide');
    return null;
  }
  if (!ID_PATTERN.test(json.id)) {
    diag.warn(`identifiant « ${json.id} » : kebab-case attendu (minuscules, chiffres, tirets)`);
  }
  return json.id;
}

function resolveSpriteBase(json, resolveBase, options, diag) {
  if (json.base === undefined) return null;
  if (typeof json.base !== 'string') {
    diag.error('« base » doit être l’identifiant d’un autre sprite');
    return null;
  }
  const chain = options.chain ?? [];
  const selfId = typeof json.id === 'string' ? json.id : '?';
  if (json.base === selfId || chain.includes(json.base)) {
    diag.error(`dépendance circulaire sur la base « ${json.base} »`);
    return null;
  }
  const baseJson = resolveBase(json.base);
  if (!baseJson) {
    diag.error(`base « ${json.base} » introuvable`);
    return null;
  }
  const parsed = parseSprite(baseJson, resolveBase, {
    ...options,
    file: options.baseFile?.(json.base) ?? `base « ${json.base} »`,
    chain: [...chain, selfId],
  });
  if (!parsed.sprite) {
    diag.error(`la base « ${json.base} » est invalide (${parsed.errors.length} erreur(s))`);
    return null;
  }
  return parsed.sprite;
}

function readKind(json, base, diag) {
  const kind = json.kind ?? base?.kind;
  if (kind === undefined) {
    diag.error('propriété « kind » manquante');
    return null;
  }
  if (!SPRITE_KINDS.includes(kind)) {
    diag.error(`kind « ${String(kind)} » inconnu (${SPRITE_KINDS.join(', ')})`);
    return null;
  }
  return kind;
}

function readDimension(json, base, key, diag) {
  const value = json[key] ?? base?.[key];
  if (value === undefined) {
    diag.error(`propriété « ${key} » manquante`);
    return null;
  }
  if (!isPositiveInteger(value)) {
    diag.error(`« ${key} » doit être un entier positif (reçu ${String(value)})`);
    return null;
  }
  if (base && json[key] !== undefined && json[key] !== base[key]) {
    diag.error(`« ${key} » (${json[key]}) diffère de la base (${base[key]})`);
    return null;
  }
  return value;
}

function readSize(json, base, diag) {
  return {
    width: readDimension(json, base, 'width', diag),
    height: readDimension(json, base, 'height', diag),
  };
}

/**
 * Résout les frames locales (lignes, mirror, copy) par-dessus les frames héritées de la base.
 * Une frame résolue est `{ rows, overrides }` : `overrides` contient les couleurs remplacées
 * par un `copy`, appliquées par-dessus la palette du sprite au moment du rendu.
 */
function resolveFrames(rawFrames, inherited, spec, diag) {
  if (rawFrames !== undefined && !isPlainObject(rawFrames)) {
    diag.error('« frames » doit être un objet { "nom": [...] }');
  }
  const raw = isPlainObject(rawFrames) ? rawFrames : {};
  const resolved = { ...inherited };
  const done = new Map();
  const exists = (name) => name in raw || name in inherited;

  const resolve = (name, trail) => {
    if (done.has(name)) return done.get(name);
    if (!(name in raw)) return inherited[name] ?? null;
    if (trail.includes(name)) {
      diag.error(`frame « ${name} » : référence circulaire (${[...trail, name].join(' → ')})`);
      return null;
    }
    const frame = resolveOne(name, raw[name], [...trail, name]);
    done.set(name, frame);
    return frame;
  };

  const resolveReference = (name, target, label, trail) => {
    const source = resolve(target, trail);
    if (!source && !exists(target)) {
      diag.error(`frame « ${name} » : ${label} « ${target} » introuvable`);
    }
    return source;
  };

  const resolveOne = (name, def, trail) => {
    const label = `frame « ${name} »`;
    if (Array.isArray(def)) {
      const ok = validateRows(def, spec.width, spec.height, spec.palette, diag, label);
      return ok ? { rows: [...def], overrides: {} } : null;
    }
    if (isPlainObject(def) && typeof def.mirror === 'string') {
      const source = resolveReference(name, def.mirror, 'frame miroir', trail);
      return source ? { rows: mirrorRows(source.rows), overrides: source.overrides } : null;
    }
    if (isPlainObject(def) && typeof def.copy === 'string') {
      const source = resolveReference(name, def.copy, 'frame copiée', trail);
      const overrides = validatePalette(def.palette, diag, { label: `${label}, palette` });
      return source
        ? { rows: source.rows, overrides: { ...source.overrides, ...overrides } }
        : null;
    }
    diag.error(
      `${label} : format invalide (tableau de lignes, { "mirror": "..." } ou { "copy": "...", "palette": {} } attendu)`,
    );
    return null;
  };

  const failed = new Set();
  for (const name of Object.keys(raw)) {
    const frame = resolve(name, []);
    if (frame) {
      resolved[name] = frame;
    } else {
      delete resolved[name];
      failed.add(name);
    }
  }
  return { frames: resolved, failed };
}

/** Les frames définies mais invalides sont déjà signalées : on ne les compte pas comme manquantes. */
function checkRequiredFrames(kind, frames, failed, diag) {
  const missing = KIND_RULES[kind].required.filter(
    (name) => !(name in frames) && !failed.has(name),
  );
  if (missing.length > 0) {
    diag.error(`frames obligatoires manquantes pour le kind « ${kind} » : ${missing.join(', ')}`);
  }
}

function checkKindSize(kind, width, height, diag) {
  const sizes = KIND_RULES[kind].sizes;
  if (!sizes) return;
  if (sizes === 'multiple-of-8') {
    if (width % 8 !== 0 || height % 8 !== 0) {
      diag.warn(
        `taille ${width} × ${height} : un ennemi devrait avoir des dimensions multiples de 8`,
      );
    }
    return;
  }
  if (!sizes.some((size) => size.width === width && size.height === height)) {
    const expected = sizes.map((size) => `${size.width} × ${size.height}`).join(' ou ');
    diag.warn(
      `taille ${width} × ${height} inhabituelle pour le kind « ${kind} » (attendu : ${expected})`,
    );
  }
}

function readAnimations(raw, frames, diag) {
  if (raw === undefined) return {};
  if (!isPlainObject(raw)) {
    diag.error('« animations » doit être un objet');
    return {};
  }
  const animations = {};
  for (const [name, def] of Object.entries(raw)) {
    const animation = readAnimation(name, def, frames, diag);
    if (animation) animations[name] = animation;
  }
  return animations;
}

function readAnimation(name, def, frames, diag) {
  const label = `animation « ${name} »`;
  if (!isPlainObject(def) || !Array.isArray(def.frames) || def.frames.length === 0) {
    diag.error(`${label} : « frames » doit être un tableau non vide`);
    return null;
  }
  const missing = def.frames.filter((frame) => typeof frame !== 'string' || !(frame in frames));
  if (missing.length > 0) {
    diag.error(`${label} : frames inconnues : ${missing.map(String).join(', ')}`);
    return null;
  }
  const frameRate = def.frameRate ?? 8;
  const repeat = def.repeat ?? -1;
  if (typeof frameRate !== 'number' || !(frameRate > 0)) {
    diag.error(`${label} : « frameRate » doit être un nombre positif`);
    return null;
  }
  if (!Number.isInteger(repeat) || repeat < -1) {
    diag.error(`${label} : « repeat » doit être -1 (boucle) ou un entier positif`);
    return null;
  }
  return { frames: [...def.frames], frameRate, repeat };
}

/** Frames `<prefix>-N` existantes, triées par N. */
function framesWithPrefix(frames, prefix) {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  return Object.keys(frames)
    .map((name) => ({ name, index: Number(pattern.exec(name)?.[1]) }))
    .filter((entry) => !Number.isNaN(entry.index))
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.name);
}

export function generateAnimations(kind, frames) {
  const animations = {};
  for (const rule of KIND_RULES[kind].animations) {
    const list = rule.frames
      ? rule.frames.every((name) => name in frames)
        ? rule.frames
        : []
      : framesWithPrefix(frames, rule.prefix);
    if (list.length === 0 || list.length < (rule.min ?? 1)) continue;
    animations[rule.name] = { frames: [...list], frameRate: rule.frameRate, repeat: rule.repeat };
  }
  return animations;
}

/** Disposition des frames dans l'image : grille à peu près carrée. */
export function spriteLayout(frameCount, width, height) {
  const columns = squareColumns(frameCount);
  const rows = Math.max(1, Math.ceil(frameCount / columns));
  return { columns, rows, imageWidth: columns * width, imageHeight: rows * height };
}

/**
 * Rend un sprite analysé : PNG, atlas Phaser (« JSON hash ») et entrée du manifeste.
 * @param {NonNullable<ReturnType<typeof parseSprite>['sprite']>} sprite
 */
export function renderSprite(sprite) {
  const names = Object.keys(sprite.frames);
  const { width, height } = sprite;
  const layout = spriteLayout(names.length, width, height);
  const rgba = Buffer.alloc(layout.imageWidth * layout.imageHeight * 4);
  const atlasFrames = {};

  names.forEach((name, index) => {
    const frame = sprite.frames[name];
    const x = (index % layout.columns) * width;
    const y = Math.floor(index / layout.columns) * height;
    paintRows(rgba, layout.imageWidth, x, y, frame.rows, { ...sprite.palette, ...frame.overrides });
    atlasFrames[name] = {
      frame: { x, y, w: width, h: height },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: width, h: height },
      sourceSize: { w: width, h: height },
    };
  });

  const atlas = {
    frames: atlasFrames,
    meta: {
      image: `${sprite.id}.png`,
      format: 'RGBA8888',
      size: { w: layout.imageWidth, h: layout.imageHeight },
      scale: '1',
    },
  };
  const manifestEntry = {
    id: sprite.id,
    kind: sprite.kind,
    width,
    height,
    animations: sprite.animations,
  };
  return {
    png: encodePng(layout.imageWidth, layout.imageHeight, rgba),
    atlas,
    manifestEntry,
    layout,
  };
}

import type { Direction } from '../data/types';

export const FACE_DELAY_MS = 80;
export const WALK_MS = 150;
export const RUN_MS = 100;

export const OFFSETS: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export function neighbor(x: number, y: number, direction: Direction): { x: number; y: number } {
  const offset = OFFSETS[direction];
  return { x: x + offset.dx, y: y + offset.dy };
}

export type GridCommand =
  | { type: 'face'; direction: Direction }
  | { type: 'step'; x: number; y: number; direction: Direction; duration: number };

/**
 * Déplacement case par case : un tap tourne, un maintien démarre le pas,
 * une entrée est mise en file pendant le tween.
 */
export class GridWalker {
  x: number;
  y: number;
  direction: Direction;
  moving = false;
  queued: Direction | null = null;
  private facingHeld: Direction | null = null;
  private faceElapsed = 0;

  constructor(x: number, y: number, direction: Direction) {
    this.x = x;
    this.y = y;
    this.direction = direction;
  }

  /** Pendant un pas : mémorise au plus une direction. */
  queue(held: Direction | null): void {
    if (held) this.queued = held;
  }

  /** À l’arrêt : tourne tout de suite, avance après FACE_DELAY_MS. */
  idleTick(
    held: Direction | null,
    running: boolean,
    deltaMs: number,
    isBlocked: (x: number, y: number) => boolean,
  ): GridCommand | null {
    if (this.moving) return null;
    if (!held) {
      this.facingHeld = null;
      this.faceElapsed = 0;
      return null;
    }
    if (held !== this.facingHeld) {
      this.facingHeld = held;
      this.faceElapsed = 0;
      this.direction = held;
      return { type: 'face', direction: held };
    }
    this.faceElapsed += deltaMs;
    if (this.faceElapsed < FACE_DELAY_MS) return null;
    return this.tryStep(held, running, isBlocked);
  }

  /** Fin de tween : enchaîne si une direction est encore tenue ou en file. */
  finishStep(
    held: Direction | null,
    running: boolean,
    isBlocked: (x: number, y: number) => boolean,
  ): GridCommand | null {
    this.moving = false;
    const next = this.queued ?? held;
    this.queued = null;
    if (!next) {
      this.facingHeld = held;
      this.faceElapsed = held ? FACE_DELAY_MS : 0;
      return null;
    }
    this.direction = next;
    this.facingHeld = next;
    this.faceElapsed = FACE_DELAY_MS;
    return this.tryStep(next, running, isBlocked);
  }

  private tryStep(
    direction: Direction,
    running: boolean,
    isBlocked: (x: number, y: number) => boolean,
  ): GridCommand {
    const dest = neighbor(this.x, this.y, direction);
    this.direction = direction;
    if (isBlocked(dest.x, dest.y)) return { type: 'face', direction };
    this.moving = true;
    this.x = dest.x;
    this.y = dest.y;
    return {
      type: 'step',
      x: dest.x,
      y: dest.y,
      direction,
      duration: running ? RUN_MS : WALK_MS,
    };
  }
}

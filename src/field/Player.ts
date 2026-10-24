import Phaser from 'phaser';
import type { Direction } from '../data/types';
import { TILE_SIZE } from '../config';
import { GridWalker, type GridCommand } from './GridWalker';

const FALLBACK_COLOR = 0x46b85c;

export function tileToWorld(x: number, y: number): { x: number; y: number } {
  return { x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE };
}

/**
 * Kaël sur la carte : sprite 16 × 24, pieds au bas de la case, animations idle/walk.
 */
export class Player {
  readonly walker: GridWalker;
  readonly sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  private readonly scene: Phaser.Scene;
  private readonly atlas: string;
  private stepTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, direction: Direction, atlas = 'kael') {
    this.scene = scene;
    this.atlas = atlas;
    this.walker = new GridWalker(x, y, direction);
    const pos = tileToWorld(x, y);
    if (scene.textures.exists(atlas)) {
      const sprite = scene.add.sprite(pos.x, pos.y, atlas);
      sprite.setOrigin(0.5, 1);
      this.sprite = sprite;
    } else {
      const body = scene.add.rectangle(pos.x, pos.y, 16, 24, FALLBACK_COLOR);
      body.setOrigin(0.5, 1);
      this.sprite = body;
    }
    this.face(direction);
    this.syncDepth();
  }

  get tileX(): number {
    return this.walker.x;
  }

  get tileY(): number {
    return this.walker.y;
  }

  get direction(): Direction {
    return this.walker.direction;
  }

  get moving(): boolean {
    return this.walker.moving;
  }

  face(direction: Direction): void {
    this.walker.direction = direction;
    this.playIdle(direction);
  }

  startStep(
    command: Pick<Extract<GridCommand, { type: 'step' }>, 'x' | 'y' | 'direction' | 'duration'>,
    onComplete: () => void,
  ): void {
    const dest = tileToWorld(command.x, command.y);
    this.playWalk(command.direction);
    this.stepTween?.stop();
    this.stepTween = this.scene.tweens.add({
      targets: this.sprite,
      x: dest.x,
      y: dest.y,
      duration: command.duration,
      ease: 'Linear',
      onUpdate: () => this.syncDepth(),
      onComplete: () => {
        this.stepTween = null;
        this.syncDepth();
        onComplete();
      },
    });
  }

  playIdle(direction: Direction = this.direction): void {
    this.playAnim(`idle-${direction}`);
  }

  destroy(): void {
    this.stepTween?.stop();
    this.sprite.destroy();
  }

  private playWalk(direction: Direction): void {
    this.playAnim(`walk-${direction}`);
  }

  private playAnim(name: string): void {
    const sprite = this.sprite;
    if (!(sprite instanceof Phaser.GameObjects.Sprite)) return;
    const key = `${this.atlas}/${name}`;
    if (!this.scene.anims.exists(key)) return;
    if (sprite.anims.currentAnim?.key === key) return;
    sprite.play(key);
  }

  private syncDepth(): void {
    this.sprite.setDepth(this.sprite.y);
  }
}

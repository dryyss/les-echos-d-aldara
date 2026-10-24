import Phaser from 'phaser';

/** Taille des coins du cadre 9-slice (sprite `cadre`, 24 × 24). */
const CORNER = 8;

export type PanelStyle = 'cadre' | 'cadre-clair';

/**
 * Cadre de menu ou de dialogue en 9-slice. Repli sur un rectangle plein si la
 * texture n'est pas chargée (placeholders du début du projet).
 */
export class Panel extends Phaser.GameObjects.Container {
  private readonly frame: Phaser.GameObjects.NineSlice | Phaser.GameObjects.Rectangle;
  readonly panelWidth: number;
  readonly panelHeight: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    style: PanelStyle = 'cadre',
  ) {
    super(scene, x, y);
    this.panelWidth = width;
    this.panelHeight = height;
    if (scene.textures.exists(style)) {
      this.frame = scene.add
        .nineslice(0, 0, style, 'idle-0', width, height, CORNER, CORNER, CORNER, CORNER)
        .setOrigin(0);
    } else {
      this.frame = scene.add
        .rectangle(0, 0, width, height, 0x141a30, 0.92)
        .setOrigin(0)
        .setStrokeStyle(1, 0xe0a84a);
    }
    this.add(this.frame);
    scene.add.existing(this);
  }

  /** Zone intérieure utile (marge des coins). */
  get inner(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      CORNER,
      CORNER,
      this.panelWidth - CORNER * 2,
      this.panelHeight - CORNER * 2,
    );
  }
}

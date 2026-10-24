import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PIXEL_FONT, SCENES } from '../config';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SCENES.title);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 12, 'Les Échos d’Aldara', {
      fontFamily: PIXEL_FONT,
      fontSize: '16px',
      color: COLORS.title,
      resolution: 1,
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 16, 'Prototype', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: COLORS.subtitle,
      resolution: 1,
    });
    subtitle.setOrigin(0.5);

    this.tweens.add({
      targets: subtitle,
      alpha: { from: 1, to: 0.3 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
  }
}

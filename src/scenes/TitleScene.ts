import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PIXEL_FONT, SCENES } from '../config';
import { services, startNewGame } from '../game/services';

export class TitleScene extends Phaser.Scene {
  private started = false;
  private readyAt = 0;

  constructor() {
    super(SCENES.title);
  }

  create(): void {
    this.started = false;
    this.readyAt = this.time.now + 250;
    services.input.state.reset();
    this.cameras.main.setBackgroundColor(COLORS.background);
    services.audio.playMusic('titre', { fade: 0.8 });

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 16, 'Les Échos d’Aldara', {
      fontFamily: PIXEL_FONT,
      fontSize: '16px',
      color: COLORS.title,
      resolution: 1,
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 16, 'Appuyez sur une touche', {
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

  override update(_time: number, delta: number): void {
    if (!this.started && this.time.now >= this.readyAt && services.input.anyJustPressed()) {
      this.startGame();
    }
    services.input.update(delta);
  }

  private startGame(): void {
    this.started = true;
    startNewGame();
    this.scene.start(SCENES.world);
  }
}

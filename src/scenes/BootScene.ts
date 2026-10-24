import Phaser from 'phaser';
import { PIXEL_FONT, SCENES } from '../config';

/**
 * Première scène : attend la police pixel puis lance l'écran titre.
 * Les placeholders graphiques générés seront ajoutés ici au fil des étapes.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    void this.waitForFont().then(() => this.scene.start(SCENES.title));
  }

  private async waitForFont(): Promise<void> {
    if (!('fonts' in document)) return;
    try {
      await Promise.race([
        document.fonts.load(`8px ${PIXEL_FONT}`),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    } catch {
      // Sans réseau, on continue avec la police de secours.
    }
  }
}

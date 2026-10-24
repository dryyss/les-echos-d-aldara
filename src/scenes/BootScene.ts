import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PIXEL_FONT, SCENES, TILESETS } from '../config';

/** Entrée du manifeste produit par scripts/build-art.mjs. */
interface ManifestAnimation {
  frames: string[];
  frameRate: number;
  repeat: number;
}

interface ManifestSprite {
  id: string;
  kind: string;
  width: number;
  height: number;
  animations: Record<string, ManifestAnimation>;
}

interface SpriteManifest {
  sprites: ManifestSprite[];
}

/**
 * Première scène : charge la police, le manifeste des sprites, les atlas et
 * les tilesets, crée les animations, puis lance l'écran titre.
 * Les services du jeu (données, audio, sauvegarde) sont initialisés ici.
 */
export class BootScene extends Phaser.Scene {
  private barFill?: Phaser.GameObjects.Rectangle;
  private label?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.boot);
  }

  preload(): void {
    this.drawLoadingBar();
    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => this.setProgress(value));
    this.load.json('sprite-manifest', '/sprites/manifest.json');
    for (const id of TILESETS) {
      this.load.image(`tiles-${id}`, `/tiles/${id}.png`);
      this.load.json(`tiles-${id}-data`, `/tiles/${id}.json`);
    }
    // Un asset manquant ne doit pas bloquer le démarrage (début de projet).
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`Asset introuvable : ${file.key}`);
    });
  }

  create(): void {
    void this.waitForFont().then(() => this.loadAtlases());
  }

  private loadAtlases(): void {
    const manifest = this.cache.json.get('sprite-manifest') as SpriteManifest | undefined;
    const sprites = manifest?.sprites ?? [];
    for (const sprite of sprites) {
      this.load.atlas(sprite.id, `/sprites/${sprite.id}.png`, `/sprites/${sprite.id}.json`);
    }
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.createAnimations(sprites);
      this.scene.start(SCENES.title);
    });
    if (sprites.length === 0) {
      this.scene.start(SCENES.title);
      return;
    }
    this.label?.setText('Chargement des sprites…');
    this.load.start();
  }

  private createAnimations(sprites: ManifestSprite[]): void {
    for (const sprite of sprites) {
      if (!this.textures.exists(sprite.id)) continue;
      for (const [name, anim] of Object.entries(sprite.animations)) {
        const key = `${sprite.id}/${name}`;
        if (this.anims.exists(key)) continue;
        this.anims.create({
          key,
          frames: anim.frames.map((frame) => ({ key: sprite.id, frame })),
          frameRate: anim.frameRate,
          repeat: anim.repeat,
        });
      }
    }
  }

  private drawLoadingBar(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    const width = 160;
    const x = (GAME_WIDTH - width) / 2;
    const y = GAME_HEIGHT / 2;
    this.add.rectangle(x, y, width, 6, 0x2a2a44).setOrigin(0, 0.5);
    this.barFill = this.add.rectangle(x + 1, y, 0, 4, 0xe0a84a).setOrigin(0, 0.5);
    this.label = this.add
      .text(GAME_WIDTH / 2, y - 14, 'Chargement…', {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: COLORS.subtitle,
        resolution: 1,
      })
      .setOrigin(0.5);
  }

  private setProgress(value: number): void {
    this.barFill?.setSize(Math.floor(158 * value), 4);
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

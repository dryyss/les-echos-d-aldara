import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldScene } from './scenes/WorldScene';
import { computeIntegerZoom } from './utils/scale';

function currentZoom(): number {
  return computeIntegerZoom(window.innerWidth, window.innerHeight, GAME_WIDTH, GAME_HEIGHT);
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.background,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: currentZoom(),
  },
  scene: [BootScene, TitleScene, WorldScene],
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
  game.scale.setZoom(currentZoom());
});

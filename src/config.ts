/** Résolution interne du jeu (style GBA élargi). */
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 240;

/** Taille d'une tuile de la grille. */
export const TILE_SIZE = 16;

/** Dimensions des sprites. */
export const SPRITE_FIELD = { width: 16, height: 24 } as const;
export const SPRITE_BATTLE = { width: 32, height: 48 } as const;
export const PORTRAIT_SIZE = 48;

/** Police pixel utilisée pour tous les textes du jeu. */
export const PIXEL_FONT = '"Press Start 2P", monospace';

/** Clés des scènes Phaser. */
export const SCENES = {
  boot: 'BootScene',
  title: 'TitleScene',
  world: 'WorldScene',
  battle: 'BattleScene',
  menu: 'MenuScene',
  dialogue: 'DialogueScene',
} as const;

/** Palette de base (placeholders). */
export const COLORS = {
  background: 0x0b0a12,
  title: '#f4e9c8',
  subtitle: '#9aa5c4',
  accent: '#e0a84a',
} as const;

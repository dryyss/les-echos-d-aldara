import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, PIXEL_FONT, SCENES, TILE_SIZE } from '../config';
import type { Direction, HeroId } from '../data/types';
import { CollisionGrid } from '../field/CollisionGrid';
import { Player, tileToWorld } from '../field/Player';
import {
  asDirection,
  objectTile,
  parseJsonProp,
  tiledProp,
  tiledProps,
  type TiledObject,
} from '../field/tiled';
import { services } from '../game/services';
import { maxStatsAt } from '../systems/GameStateFactory';

const ABOVE_DEPTH = 10_000;
const HUD_DEPTH = 20_000;
const FADE_MS = 200;
const NPC_FALLBACK = 0xc4a574;

export interface WorldSceneData {
  map?: string;
  spawn?: string;
}

interface Warp {
  x: number;
  y: number;
  w: number;
  h: number;
  map: string;
  spawn: string;
}

/**
 * Exploration : charge une carte Tiled, pose Kaël, les PNJ, et déplace
 * case par case. Les collisions viennent du calque « collisions ».
 */
export class WorldScene extends Phaser.Scene {
  private mapId = 'brumeval-forge';
  private spawnId = 'defaut';
  private collisions?: CollisionGrid;
  private player?: Player;
  private warps: Warp[] = [];
  private busy = false;

  constructor() {
    super(SCENES.world);
  }

  init(data: WorldSceneData): void {
    const position = services.state?.position;
    this.mapId = data.map ?? position?.map ?? 'brumeval-forge';
    this.spawnId = data.spawn ?? 'defaut';
  }

  preload(): void {
    if (!this.cache.tilemap.exists(this.mapId)) {
      this.load.tilemapTiledJSON(this.mapId, `/maps/${this.mapId}.tmj`);
    }
    this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`Carte introuvable : ${file.key}`);
    });
  }

  create(): void {
    if (!this.cache.tilemap.exists(this.mapId)) {
      this.add
        .text(GAME_WIDTH / 2, 80, `Carte manquante : ${this.mapId}`, {
          fontFamily: PIXEL_FONT,
          fontSize: '8px',
          color: COLORS.subtitle,
          resolution: 1,
        })
        .setOrigin(0.5);
      return;
    }

    const tilemap = this.make.tilemap({ key: this.mapId });
    const tilesetName = visualTilesetName(tilemap);
    if (!tilesetName || !this.textures.exists(`tiles-${tilesetName}`)) {
      console.warn(`Tileset « ${tilesetName ?? '?'} » non chargé`);
    }
    if (tilesetName) tilemap.addTilesetImage(tilesetName, `tiles-${tilesetName}`);

    const ground = tilemap.createLayer('sol', tilesetName ?? '', 0, 0);
    const decor = tilemap.createLayer('decor', tilesetName ?? '', 0, 0);
    const above = tilemap.createLayer('au-dessus', tilesetName ?? '', 0, 0);
    ground?.setDepth(0);
    decor?.setDepth(1);
    above?.setDepth(ABOVE_DEPTH);

    this.collisions = readCollisions(tilemap);
    const objects = (tilemap.getObjectLayer('objets')?.objects ?? []) as TiledObject[];
    this.warps = readWarps(objects, tilemap.tileWidth || TILE_SIZE);

    const spawn = this.resolveSpawn(objects, tilemap.tileWidth || TILE_SIZE);
    this.player = new Player(this, spawn.x, spawn.y, spawn.direction);
    this.placeNpcs(objects, tilemap.tileWidth || TILE_SIZE);

    this.cameras.main.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.startFollow(this.player.sprite, true, 1, 1);
    this.cameras.main.fadeIn(FADE_MS);

    const mapName = String(tiledProps(tilemap, 'name') ?? this.mapId);
    this.add
      .text(8, 8, mapName, {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: COLORS.title,
        resolution: 1,
      })
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH);

    const music = tiledProps(tilemap, 'music');
    if (typeof music === 'string' && music.length > 0) {
      services.audio.playMusic(music, { fade: 0.8 });
    }

    const state = services.state;
    if (state) {
      state.setPosition({
        map: this.mapId,
        x: spawn.x,
        y: spawn.y,
        direction: spawn.direction,
      });
      services.quests?.onReachMap(this.mapId);
      void services.saves.autoSave(state, mapName);
    }
  }

  override update(_time: number, delta: number): void {
    const player = this.player;
    const collisions = this.collisions;
    if (!player || !collisions || this.busy) {
      services.input.update(delta);
      return;
    }

    const held = services.input.direction('world');
    const running = services.input.isDown('run', 'world');
    const blocked = (x: number, y: number) => collisions.isBlocked(x, y);

    if (player.moving) {
      player.walker.queue(held);
    } else {
      const command = player.walker.idleTick(held, running, delta, blocked);
      if (command?.type === 'face') player.face(command.direction);
      if (command?.type === 'step') this.beginStep(command);
    }

    services.input.update(delta);
  }

  private beginStep(command: { x: number; y: number; direction: Direction; duration: number }): void {
    const player = this.player;
    if (!player) return;
    services.audio.playSfx(this.mapId === 'brumeval-forge' ? 'pas-bois' : 'pas-herbe');
    player.startStep(command, () => this.afterStep());
  }

  private afterStep(): void {
    const player = this.player;
    if (!player) return;
    const state = services.state;
    if (state) {
      state.setPosition({
        map: this.mapId,
        x: player.tileX,
        y: player.tileY,
        direction: player.direction,
      });
      const maxPr: Partial<Record<HeroId, number>> = {};
      for (const id of state.partyIds()) {
        const data = services.data.heroes.get(id);
        const hero = state.getHero(id);
        if (data && hero) maxPr[id] = maxStatsAt(data, hero.level).pr;
      }
      state.addStep({ maxPr, encounter: null });
    }

    const warp = this.warps.find(
      (entry) =>
        player.tileX >= entry.x &&
        player.tileX < entry.x + entry.w &&
        player.tileY >= entry.y &&
        player.tileY < entry.y + entry.h,
    );
    if (warp) {
      this.enterWarp(warp);
      return;
    }

    const held = services.input.direction('world');
    const running = services.input.isDown('run', 'world');
    const collisions = this.collisions;
    if (!collisions) {
      player.playIdle();
      return;
    }
    const next = player.walker.finishStep(held, running, (x, y) => collisions.isBlocked(x, y));
    if (next?.type === 'step') {
      this.beginStep(next);
      return;
    }
    if (next?.type === 'face') player.face(next.direction);
    else player.playIdle();
  }

  private enterWarp(warp: Warp): void {
    if (this.busy) return;
    this.busy = true;
    services.audio.playSfx('porte');
    this.cameras.main.fadeOut(FADE_MS);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({ map: warp.map, spawn: warp.spawn });
    });
  }

  private resolveSpawn(
    objects: TiledObject[],
    tileSize: number,
  ): { x: number; y: number; direction: Direction } {
    const wanted = this.spawnId;
    const fallback = objects.find((object) => object.type === 'spawn' && object.name === 'defaut');
    const match =
      objects.find((object) => object.type === 'spawn' && object.name === wanted) ?? fallback;
    if (!match) {
      const position = services.state?.position;
      if (position && position.map === this.mapId) {
        return { x: position.x, y: position.y, direction: position.direction };
      }
      return { x: 1, y: 1, direction: 'down' };
    }
    const tile = objectTile(match, tileSize);
    return { ...tile, direction: asDirection(tiledProp(match, 'direction')) };
  }

  private placeNpcs(objects: TiledObject[], tileSize: number): void {
    for (const object of objects) {
      if (object.type !== 'npc') continue;
      const tile = objectTile(object, tileSize);
      const id = object.name;
      const direction = asDirection(tiledProp(object, 'direction'));
      const pos = tileToWorld(tile.x, tile.y);
      if (this.textures.exists(id)) {
        const sprite = this.add.sprite(pos.x, pos.y, id);
        sprite.setOrigin(0.5, 1);
        sprite.setDepth(pos.y);
        const idle = `${id}/idle-${direction}`;
        if (this.anims.exists(idle)) sprite.play(idle);
      } else {
        this.add.rectangle(pos.x, pos.y, 16, 24, NPC_FALLBACK).setOrigin(0.5, 1).setDepth(pos.y);
      }
      this.collisions?.setBlocked(tile.x, tile.y, true);
    }
  }
}

function visualTilesetName(map: Phaser.Tilemaps.Tilemap): string | null {
  const tileset = map.tilesets.find((entry) => entry.name !== 'collision');
  return tileset?.name ?? null;
}

function readCollisions(map: Phaser.Tilemaps.Tilemap): CollisionGrid {
  const layer = map.getLayer('collisions');
  const width = map.width;
  const height = map.height;
  const gids: number[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tile = layer?.data[y]?.[x];
      gids.push(tile && tile.index > 0 ? tile.index : 0);
    }
  }
  return CollisionGrid.fromCollisionGids(width, height, gids);
}

function readWarps(objects: TiledObject[], tileSize: number): Warp[] {
  const warps: Warp[] = [];
  for (const object of objects) {
    if (object.type !== 'warp') continue;
    const dest = parseJsonProp<{ map: string; spawn: string }>(tiledProp(object, 'to'));
    if (!dest?.map || !dest.spawn) continue;
    const tile = objectTile(object, tileSize);
    warps.push({
      x: tile.x,
      y: tile.y,
      w: Math.max(1, Math.round(object.width / tileSize)),
      h: Math.max(1, Math.round(object.height / tileSize)),
      map: dest.map,
      spawn: dest.spawn,
    });
  }
  return warps;
}

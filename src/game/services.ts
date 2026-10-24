import sfxDefs from '../../data/audio/sfx.json';
import { getRegistry, type DataRegistry } from '../data/registry';
import { InputManager } from './input/InputManager';
import { GameState } from '../systems/GameState';
import { QuestManager } from '../systems/QuestManager';
import { SaveManager } from '../systems/SaveManager';
import { LocalSaveBackend } from '../systems/save/SaveBackend';
import { audio, type AudioManager } from '../systems/audio/AudioManager';
import type { MusicData } from '../systems/audio/patterns';
import type { SfxDef } from '../systems/audio/sfx';

export interface GameServices {
  data: DataRegistry;
  state: GameState | null;
  quests: QuestManager | null;
  saves: SaveManager;
  audio: AudioManager;
  input: InputManager;
}

export const services: GameServices = {
  data: getRegistry(),
  state: null,
  quests: null,
  saves: new SaveManager(new LocalSaveBackend()),
  audio,
  input: new InputManager(),
};

/** Charge les données audio et branche le clavier. À appeler une fois au boot. */
export function bootServices(): void {
  services.audio.init();
  const music: Record<string, MusicData> = {};
  for (const [id, track] of services.data.music) {
    music[id] = track as MusicData;
  }
  services.audio.loadMusic(music);
  services.audio.loadSfx(sfxDefs as Record<string, SfxDef>);
  services.input.attach();
}

export function startNewGame(): GameState {
  const state = GameState.newGame(services.data.allHeroes());
  services.state = state;
  services.quests = new QuestManager(state, services.data.allQuests());
  return state;
}

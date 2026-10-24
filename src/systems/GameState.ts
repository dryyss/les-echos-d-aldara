/**
 * État complet d'une partie : équipe, Lueurs, sac, pièces, drapeaux, missions,
 * position. Aucune scène ne garde d'état : tout passe par cette classe, qui
 * émet des événements typés à chaque changement.
 */
import type {
  Act,
  EventCondition,
  GameOptions,
  GameStateData,
  HeroData,
  HeroId,
  HeroState,
  LueurOwnership,
  LueurState,
  MapStateValue,
  Position,
  QuestProgress,
  ResonanceId,
} from '../data/types';
import { evaluateCondition } from './EventConditions';
import { TypedEmitter } from './events';
import {
  createHeroState,
  deepClone,
  LUEURS_27_COUNT,
  LUEURS_27_FLAG,
  maxStatsAt,
  newGameData,
  normalizeStateData,
  PRISME_LUEUR_ID,
  STEPS_PER_PR,
} from './GameStateFactory';

export type Shortcuts = [ResonanceId | null, ResonanceId | null];

export interface GameStateEvents {
  flag: { flag: string; value: boolean };
  item: { item: string; count: number; delta: number };
  coins: { coins: number; delta: number };
  party: { party: HeroId[]; added: HeroId | null; removed: HeroId | null };
  lueur: { lueur: string; ownership: LueurOwnership };
  resonance: { resonances: ResonanceId[]; learned: ResonanceId | null; shortcuts: Shortcuts };
  position: Position;
  quest: { quest: string; progress: QuestProgress | null };
  mapState: { map: string; key: string; value: MapStateValue };
  hero: { hero: HeroId; state: HeroState };
}

export interface StepOptions {
  /** PR maximum de chaque héros (calculé par le moteur avec équipement et Lueurs). */
  maxPr: Partial<Record<HeroId, number>>;
  /** Bornes du tirage de rencontre, ou null sur une carte sans combats. */
  encounter?: { min: number; max: number } | null;
  rng?: () => number;
}

export interface StepResult {
  prRecharged: HeroId[];
  encounter: boolean;
}

export type HeroMaxima = Partial<Record<HeroId, { hp: number; pr: number }>>;

export class GameState {
  readonly events = new TypedEmitter<GameStateEvents>();
  private data: GameStateData;
  private readonly heroData = new Map<HeroId, HeroData>();

  private constructor(data: GameStateData, heroes: HeroData[]) {
    this.data = data;
    for (const hero of heroes) this.heroData.set(hero.id, hero);
  }

  static newGame(heroes: HeroData[], options: Partial<GameOptions> = {}): GameState {
    return new GameState(newGameData(heroes, options), heroes);
  }

  static fromData(data: GameStateData, heroes: HeroData[]): GameState {
    return new GameState(normalizeStateData(data), heroes);
  }

  toData(): GameStateData {
    return deepClone(this.data);
  }

  // --- Lecture générale -----------------------------------------------------

  get coins(): number {
    return this.data.coins;
  }
  get act(): Act | 5 {
    return this.data.act;
  }
  get position(): Readonly<Position> {
    return this.data.position;
  }
  get options(): Readonly<GameOptions> {
    return this.data.options;
  }
  get playTimeMs(): number {
    return this.data.playTimeMs;
  }
  get repelSteps(): number {
    return this.data.repelSteps;
  }
  get resonances(): readonly ResonanceId[] {
    return this.data.resonances;
  }
  get shortcuts(): Readonly<Shortcuts> {
    return this.data.shortcuts;
  }
  get lore(): readonly string[] {
    return this.data.lore;
  }
  get flags(): Readonly<Record<string, boolean>> {
    return this.data.flags;
  }
  get inventory(): Readonly<Record<string, number>> {
    return this.data.inventory;
  }
  get lueurs(): Readonly<Record<string, LueurOwnership>> {
    return this.data.lueurs;
  }
  get quests(): Readonly<Record<string, QuestProgress>> {
    return this.data.quests;
  }

  setAct(act: Act | 5): void {
    this.data.act = act;
  }

  setOptions(patch: Partial<GameOptions>): void {
    this.data.options = { ...this.data.options, ...patch };
  }

  addPlayTime(ms: number): void {
    this.data.playTimeMs += Math.max(0, ms);
  }

  // --- Drapeaux -------------------------------------------------------------

  setFlag(flag: string, value = true): void {
    this.data.flags[flag] = value;
    this.events.emit('flag', { flag, value });
  }

  hasFlag(flag: string): boolean {
    return this.data.flags[flag] === true;
  }

  clearFlag(flag: string): void {
    if (!(flag in this.data.flags)) return;
    delete this.data.flags[flag];
    this.events.emit('flag', { flag, value: false });
  }

  // --- Objets ---------------------------------------------------------------

  addItem(id: string, qty = 1): void {
    if (qty <= 0) return;
    const count = this.countItem(id) + qty;
    this.data.inventory[id] = count;
    this.events.emit('item', { item: id, count, delta: qty });
  }

  removeItem(id: string, qty = 1): boolean {
    if (qty <= 0) return true;
    const current = this.countItem(id);
    if (current < qty) return false;
    const count = current - qty;
    if (count === 0) delete this.data.inventory[id];
    else this.data.inventory[id] = count;
    this.events.emit('item', { item: id, count, delta: -qty });
    return true;
  }

  countItem(id: string): number {
    return this.data.inventory[id] ?? 0;
  }

  hasItem(id: string, min = 1): boolean {
    return this.countItem(id) >= min;
  }

  // --- Pièces ---------------------------------------------------------------

  addCoins(amount: number): void {
    if (amount <= 0) return;
    this.data.coins += amount;
    this.events.emit('coins', { coins: this.data.coins, delta: amount });
  }

  spendCoins(amount: number): boolean {
    if (amount < 0 || this.data.coins < amount) return false;
    this.data.coins -= amount;
    this.events.emit('coins', { coins: this.data.coins, delta: -amount });
    return true;
  }

  /** Défaite : on garde la moitié des pièces (arrondie à l'inférieur). Renvoie la perte. */
  loseHalfCoins(): number {
    const lost = Math.ceil(this.data.coins / 2);
    this.data.coins -= lost;
    if (lost > 0) this.events.emit('coins', { coins: this.data.coins, delta: -lost });
    return lost;
  }

  // --- Équipe ---------------------------------------------------------------

  partyIds(): HeroId[] {
    return [...this.data.party];
  }

  isInParty(heroId: HeroId): boolean {
    return this.data.party.includes(heroId);
  }

  getHero(heroId: HeroId): HeroState | undefined {
    return this.data.heroes[heroId];
  }

  /** Niveau moyen de l'équipe (arrondi), 1 si l'équipe est vide. */
  averageLevel(): number {
    const levels = this.data.party.map((id) => this.data.heroes[id]?.level ?? 1);
    if (levels.length === 0) return 1;
    return Math.max(1, Math.round(levels.reduce((a, b) => a + b, 0) / levels.length));
  }

  /** Ajoute un héros à l'équipe, au niveau moyen de l'équipe s'il est nouveau. */
  recruit(heroId: HeroId, heroData: HeroData): void {
    this.heroData.set(heroId, heroData);
    let state = this.data.heroes[heroId];
    if (!state) {
      state = createHeroState(heroData, this.averageLevel());
      this.data.heroes[heroId] = state;
      if (heroData.startingLueur) this.findLueur(heroData.startingLueur, heroId);
      this.events.emit('hero', { hero: heroId, state });
    }
    if (this.isInParty(heroId)) return;
    this.data.party.push(heroId);
    this.events.emit('party', { party: this.partyIds(), added: heroId, removed: null });
  }

  /** Retire un héros de l'équipe active sans oublier sa progression. */
  leaveParty(heroId: HeroId): void {
    if (!this.isInParty(heroId)) return;
    this.data.party = this.data.party.filter((id) => id !== heroId);
    this.events.emit('party', { party: this.partyIds(), added: null, removed: heroId });
  }

  updateHero(heroId: HeroId, patch: Partial<Omit<HeroState, 'id'>>): HeroState | undefined {
    const current = this.data.heroes[heroId];
    if (!current) return undefined;
    const state: HeroState = { ...current, ...patch, id: heroId };
    this.data.heroes[heroId] = state;
    this.events.emit('hero', { hero: heroId, state });
    return state;
  }

  /**
   * Soin complet de l'équipe. Le moteur peut passer les vrais maxima (équipement,
   * Lueurs) ; sinon on utilise les stats de base au niveau du héros.
   */
  healAll(maxima: HeroMaxima = {}): void {
    for (const heroId of this.data.party) {
      const state = this.data.heroes[heroId];
      const hero = this.heroData.get(heroId);
      if (!state || !hero) continue;
      const base = maxStatsAt(hero, state.level);
      const max = maxima[heroId] ?? {
        hp: base.hp + (state.permanentBonus.hp ?? 0),
        pr: base.pr + (state.permanentBonus.pr ?? 0),
      };
      this.updateHero(heroId, { hp: max.hp, pr: max.pr });
    }
  }

  // --- Lueurs ---------------------------------------------------------------

  isLueurFound(id: string): boolean {
    return this.data.lueurs[id]?.found === true;
  }

  /** Marque une Lueur trouvée (non assignée par défaut) et gère le drapeau des 27. */
  findLueur(id: string, hero: HeroId | null = null): void {
    if (this.isLueurFound(id)) return;
    const ownership: LueurOwnership = { found: true, hero, state: 'liee' };
    this.data.lueurs[id] = ownership;
    this.events.emit('lueur', { lueur: id, ownership });
    if (this.foundLueurCount() >= LUEURS_27_COUNT && !this.hasFlag(LUEURS_27_FLAG)) {
      this.setFlag(LUEURS_27_FLAG);
    }
  }

  assignLueur(id: string, heroId: HeroId | null): boolean {
    const current = this.data.lueurs[id];
    if (!current?.found) return false;
    if (heroId !== null && !this.data.heroes[heroId]) return false;
    const ownership: LueurOwnership = { ...current, hero: heroId, state: 'liee' };
    this.data.lueurs[id] = ownership;
    this.events.emit('lueur', { lueur: id, ownership });
    return true;
  }

  setLueurState(id: string, state: LueurState): boolean {
    const current = this.data.lueurs[id];
    if (!current?.found) return false;
    const ownership: LueurOwnership = { ...current, state };
    this.data.lueurs[id] = ownership;
    this.events.emit('lueur', { lueur: id, ownership });
    return true;
  }

  /** Toutes les Lueurs assignées à un héros, quel que soit leur état. */
  lueursOf(heroId: HeroId): string[] {
    return Object.entries(this.data.lueurs)
      .filter(([, o]) => o.found && o.hero === heroId)
      .map(([id]) => id);
  }

  /** Lueurs Liées d'un héros (celles qui comptent pour sa classe et ses bonus). */
  linkedLueurIds(heroId: HeroId): string[] {
    return this.lueursOf(heroId).filter((id) => this.data.lueurs[id]?.state === 'liee');
  }

  /** Nombre de Lueurs trouvées, hors Prisme. */
  foundLueurCount(): number {
    return Object.entries(this.data.lueurs).filter(
      ([id, o]) => o.found && id !== PRISME_LUEUR_ID,
    ).length;
  }

  // --- Résonances -----------------------------------------------------------

  learnResonance(id: ResonanceId): boolean {
    if (this.hasResonance(id)) return false;
    this.data.resonances.push(id);
    this.emitResonance(id);
    return true;
  }

  hasResonance(id: ResonanceId): boolean {
    return this.data.resonances.includes(id);
  }

  setShortcut(slot: 0 | 1, id: ResonanceId | null): boolean {
    if (id !== null && !this.hasResonance(id)) return false;
    this.data.shortcuts[slot] = id;
    this.emitResonance(null);
    return true;
  }

  private emitResonance(learned: ResonanceId | null): void {
    this.events.emit('resonance', {
      resonances: [...this.data.resonances],
      learned,
      shortcuts: [...this.data.shortcuts],
    });
  }

  // --- Position, pas et PR --------------------------------------------------

  setPosition(position: Position): void {
    this.data.position = { ...position };
    this.events.emit('position', { ...position });
  }

  addRepelSteps(steps: number): void {
    this.data.repelSteps = Math.max(0, this.data.repelSteps + steps);
  }

  /** Un pas : recharge 1 PR tous les 4 pas et tire une éventuelle rencontre. */
  addStep(options: StepOptions): StepResult {
    const prRecharged = this.rechargeStep(options.maxPr);
    return { prRecharged, encounter: this.encounterStep(options) };
  }

  private rechargeStep(maxPr: Partial<Record<HeroId, number>>): HeroId[] {
    this.data.steps += 1;
    if (this.data.steps < STEPS_PER_PR) return [];
    this.data.steps = 0;
    const recharged: HeroId[] = [];
    for (const heroId of this.data.party) {
      const state = this.data.heroes[heroId];
      const max = maxPr[heroId];
      if (!state || max === undefined || state.pr >= max) continue;
      this.updateHero(heroId, { pr: state.pr + 1 });
      recharged.push(heroId);
    }
    return recharged;
  }

  private encounterStep(options: StepOptions): boolean {
    if (this.data.repelSteps > 0) {
      this.data.repelSteps -= 1;
      return false;
    }
    const range = options.encounter;
    if (!range) return false;
    this.data.stepsSinceEncounter += 1;
    const rng = options.rng ?? (() => 0.5);
    const threshold = range.min + Math.floor(rng() * (range.max - range.min + 1));
    if (this.data.stepsSinceEncounter < threshold) return false;
    this.data.stepsSinceEncounter = 0;
    return true;
  }

  useResonancePr(heroId: HeroId, cost: number): boolean {
    const state = this.data.heroes[heroId];
    if (!state || state.pr < cost) return false;
    this.updateHero(heroId, { pr: state.pr - cost });
    return true;
  }

  // --- Cartes, lore, missions ----------------------------------------------

  getMapState(map: string, key: string): MapStateValue | undefined {
    return this.data.mapState[map]?.[key];
  }

  setMapState(map: string, key: string, value: MapStateValue): void {
    const states = this.data.mapState[map] ?? {};
    states[key] = value;
    this.data.mapState[map] = states;
    this.events.emit('mapState', { map, key, value });
  }

  addLore(id: string): boolean {
    if (this.data.lore.includes(id)) return false;
    this.data.lore.push(id);
    return true;
  }

  getQuestProgress(id: string): QuestProgress | undefined {
    return this.data.quests[id];
  }

  setQuestProgress(id: string, progress: QuestProgress | null): void {
    if (progress === null) delete this.data.quests[id];
    else this.data.quests[id] = { ...progress, counts: { ...progress.counts } };
    this.events.emit('quest', { quest: id, progress: progress ? { ...progress } : null });
  }

  // --- Conditions -----------------------------------------------------------

  evaluate(condition: EventCondition): boolean {
    return evaluateCondition(this, condition);
  }
}

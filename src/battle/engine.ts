/**
 * Cœur du combat au tour par tour, sans Phaser.
 * Déroulement d'un tour : commandes des héros (submitCommand), puis resolveTurn() :
 * IA des ennemis, tri par Vitesse, exécution une par une, fin de tour, issue.
 * Tout est déterministe pour un rng donné.
 */
import { chooseEnemyAction } from './ai';
import { createContext } from './combatants';
import { availableCommands, isCommandAllowed } from './commands';
import { runEndOfTurn } from './endOfTurn';
import { executeEnemyAction } from './enemyActions';
import { executeHeroCommand, isFirstStrike } from './heroActions';
import { effectiveStats } from './modifiers';
import { computeRewards } from './rewards';
import { buildSnapshot } from './snapshot';
import { canAct } from './status';
import { isAlive } from './targeting';
import { orderBySpeed } from './turnOrder';
import type {
  ActionCommand,
  AvailableCommand,
  BattleCommand,
  BattleContext,
  BattleEvent,
  BattleResult,
  BattleRewards,
  BattleSetup,
  BattleSnapshot,
  BattleStatus,
  Combatant,
  Rng,
} from './types';

interface PlannedAction {
  actor: Combatant;
  speed: number;
  firstStrike: boolean;
  command: ActionCommand;
}

export class BattleEngine {
  private readonly ctx: BattleContext;
  private readonly pending = new Map<number, BattleCommand>();
  private status: BattleStatus = { over: false };
  private rewards: BattleRewards | null = null;

  constructor(setup: BattleSetup, rng: Rng) {
    this.ctx = createContext(setup, rng);
  }

  getSnapshot(): BattleSnapshot {
    return buildSnapshot(this.ctx);
  }

  getAvailableCommands(heroIndex: number): AvailableCommand[] {
    return availableCommands(this.ctx, heroIndex);
  }

  isOver(): BattleStatus {
    return { ...this.status };
  }

  /** État à persister une fois le combat terminé (PV, PR, XP, niveau, Lueurs, inventaire). */
  getResult(): BattleResult {
    return {
      outcome: this.status.outcome ?? null,
      heroes: this.ctx.heroes.map((hero) => ({
        id: hero.data.id,
        state: { ...hero.state, hp: hero.hp, pr: hero.pr },
        lueurs: hero.lueurs.map((lueur) => ({ id: lueur.data.id, state: 'liee' as const })),
      })),
      inventory: { ...this.ctx.inventory },
      rewards: this.rewards,
    };
  }

  /** Enregistre la commande d'un héros vivant et capable d'agir. Lève une erreur sinon. */
  submitCommand(heroIndex: number, command: BattleCommand): void {
    if (this.status.over) throw new Error('Le combat est terminé.');
    const hero = this.ctx.heroes[heroIndex];
    if (!hero) throw new Error(`Héros ${heroIndex} inconnu.`);
    if (!isAlive(hero) || !canAct(hero.statuses)) {
      throw new Error(`${hero.name} ne peut pas agir ce tour.`);
    }
    if (!isCommandAllowed(this.getAvailableCommands(heroIndex), command)) {
      throw new Error(`Commande ${command.kind} invalide pour ${hero.name}.`);
    }
    this.pending.set(heroIndex, command);
  }

  /** Joue le tour complet et renvoie la liste ordonnée des événements. */
  resolveTurn(): BattleEvent[] {
    if (this.status.over) throw new Error('Le combat est terminé.');
    const { ctx } = this;
    const events: BattleEvent[] = [{ type: 'turn-start', turn: ctx.turn }];
    const actions = orderBySpeed(this.planActions(), ctx.rng);
    for (const action of actions) {
      if (this.status.over) break;
      this.execute(action, events);
      this.checkOutcome(events);
    }
    if (!this.status.over) {
      runEndOfTurn(ctx, events);
      events.push({ type: 'turn-end', turn: ctx.turn });
      this.checkOutcome(events);
    }
    if (!this.status.over) this.checkScripted(events);
    this.pending.clear();
    ctx.turn += 1;
    return events;
  }

  private planActions(): PlannedAction[] {
    const { ctx } = this;
    const actions: PlannedAction[] = [];
    ctx.heroes.forEach((hero, index) => {
      if (!isAlive(hero) || !canAct(hero.statuses)) return;
      const command = this.pending.get(index);
      if (!command) throw new Error(`Aucune commande soumise pour ${hero.name}.`);
      actions.push({
        actor: hero,
        speed: effectiveStats(hero).speed,
        firstStrike: isFirstStrike(hero, command),
        command,
      });
    });
    const snapshot = buildSnapshot(ctx);
    for (const enemy of ctx.enemies) {
      if (!isAlive(enemy) || !canAct(enemy.statuses)) continue;
      actions.push({
        actor: enemy,
        speed: effectiveStats(enemy).speed,
        firstStrike: false,
        command: chooseEnemyAction(enemy, snapshot, ctx.rng),
      });
    }
    return actions;
  }

  private execute(action: PlannedAction, events: BattleEvent[]): void {
    const { actor, command } = action;
    // Un acteur tombé K.O. ou endormi plus tôt dans le tour passe son action.
    if (!isAlive(actor) || !canAct(actor.statuses)) return;
    // La Défense tient jusqu'à la prochaine action du défenseur.
    actor.defending = false;
    if (actor.side === 'hero' && command.kind !== 'skill') {
      executeHeroCommand(this.ctx, actor, command, events);
    } else if (actor.side === 'enemy' && command.kind === 'skill') {
      executeEnemyAction(this.ctx, actor, command, events);
    }
  }

  private checkOutcome(events: BattleEvent[]): void {
    const { ctx } = this;
    if (ctx.fled) {
      this.status = { over: true, outcome: 'fled' };
      return;
    }
    if (!ctx.enemies.some(isAlive)) {
      this.rewards = computeRewards(ctx);
      events.push({ type: 'victory', ...this.rewards });
      this.status = { over: true, outcome: 'victory' };
      return;
    }
    if (!ctx.heroes.some(isAlive)) {
      const continues = ctx.scripted?.defeatContinues === true;
      events.push({ type: 'defeat', continues });
      this.status = { over: true, outcome: 'defeat', continues };
    }
  }

  private checkScripted(events: BattleEvent[]): void {
    const limit = this.ctx.scripted?.loseAfterTurns;
    if (limit === undefined || this.ctx.turn < limit) return;
    events.push({ type: 'scripted-end', reason: 'loseAfterTurns' });
    this.status = { over: true, outcome: 'scripted' };
  }
}

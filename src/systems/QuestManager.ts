/**
 * Journal de missions : démarrage, validation des tâches, récompenses et
 * déclencheurs automatiques appelés par le moteur (arrivée sur une carte,
 * dialogue, puzzle, combat...). La progression vit dans GameState.quests.
 */
import type {
  HeroId,
  QuestData,
  QuestProgress,
  QuestRewards,
  QuestTask,
  QuestTaskType,
  QuestType,
} from '../data/types';
import { TypedEmitter } from './events';
import type { GameState } from './GameState';

export interface QuestManagerEvents {
  started: { quest: string };
  taskCompleted: { quest: string; task: number };
  completed: { quest: string };
  /** L'XP est appliquée par le moteur (le calcul de niveau est dans src/battle). */
  xpReward: { quest: string; amount: number };
  /** Le moteur joue l'écran « X a rejoint l'équipe » et appelle GameState.recruit. */
  recruitRequest: { quest: string; hero: HeroId };
}

export interface QuestTaskSummary {
  index: number;
  texte: string;
  done: boolean;
}

export interface QuestSummary {
  id: string;
  type: QuestType;
  titre: string;
  resume: string;
  status: QuestProgress['status'];
  zone?: string;
  /** Tâches faites, plus la suivante seulement (les autres restent cachées). */
  tasks: QuestTaskSummary[];
}

const TYPE_ORDER: Record<QuestType, number> = { principale: 0, annexe: 1, lueur: 2 };

/** `m1-01` → `m1_01_fini`, posé automatiquement à la fin d'une mission principale. */
export function mainQuestDoneFlag(questId: string): string {
  return `${questId.replace(/-/g, '_')}_fini`;
}

export class QuestManager {
  readonly events = new TypedEmitter<QuestManagerEvents>();
  private readonly quests = new Map<string, QuestData>();

  constructor(
    private readonly state: GameState,
    quests: QuestData[],
  ) {
    for (const quest of quests) this.quests.set(quest.id, quest);
  }

  // --- Lecture --------------------------------------------------------------

  get(id: string): QuestData | undefined {
    return this.quests.get(id);
  }

  isActive(id: string): boolean {
    return this.state.getQuestProgress(id)?.status === 'active';
  }

  isDone(id: string): boolean {
    return this.state.getQuestProgress(id)?.status === 'done';
  }

  currentTask(id: string): QuestTask | undefined {
    const progress = this.state.getQuestProgress(id);
    if (progress?.status !== 'active') return undefined;
    return this.quests.get(id)?.taches[progress.task];
  }

  activeQuests(): QuestData[] {
    return this.sorted([...this.quests.values()].filter((q) => this.isActive(q.id)));
  }

  /** Missions terminées (onglet Souvenirs). */
  completedQuests(): QuestData[] {
    return this.sorted([...this.quests.values()].filter((q) => this.isDone(q.id)));
  }

  /** Missions non commencées dont les prérequis sont remplis. */
  availableQuests(): QuestData[] {
    return this.sorted(
      [...this.quests.values()].filter(
        (q) => !this.state.getQuestProgress(q.id) && this.prerequisitesMet(q),
      ),
    );
  }

  private prerequisitesMet(quest: QuestData): boolean {
    return (quest.prerequis ?? []).every((flag) => this.state.hasFlag(flag));
  }

  private sorted(quests: QuestData[]): QuestData[] {
    return quests.sort(
      (a, b) =>
        TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.acte - b.acte || a.id.localeCompare(b.id),
    );
  }

  // --- Progression ----------------------------------------------------------

  /** Démarre une mission. Ignorée si déjà active ou finie, ou prérequis manquants. */
  start(id: string): boolean {
    const quest = this.quests.get(id);
    if (!quest || this.state.getQuestProgress(id) || !this.prerequisitesMet(quest)) return false;
    this.state.setQuestProgress(id, { status: 'active', task: 0, counts: {} });
    this.events.emit('started', { quest: id });
    if (quest.taches.length === 0) this.finish(quest);
    return true;
  }

  /** Valide la tâche d'index donné si c'est la tâche courante. Renvoie vrai si la mission a avancé. */
  completeTask(id: string, index: number): boolean {
    const quest = this.quests.get(id);
    const progress = this.state.getQuestProgress(id);
    if (!quest || progress?.status !== 'active' || progress.task !== index) return false;
    const next = index + 1;
    this.state.setQuestProgress(id, { ...progress, task: next });
    this.events.emit('taskCompleted', { quest: id, task: index });
    if (next >= quest.taches.length) this.finish(quest);
    return true;
  }

  /** Termine la mission d'un coup (action `quest complete` des scènes). */
  complete(id: string): boolean {
    const quest = this.quests.get(id);
    const progress = this.state.getQuestProgress(id);
    if (!quest || progress?.status !== 'active') return false;
    this.state.setQuestProgress(id, { ...progress, task: quest.taches.length });
    this.finish(quest);
    return true;
  }

  private finish(quest: QuestData): void {
    const progress = this.state.getQuestProgress(quest.id);
    if (!progress) return;
    this.state.setQuestProgress(quest.id, { ...progress, status: 'done' });
    this.applyRewards(quest.id, quest.recompenses);
    if (quest.drapeauFin) this.state.setFlag(quest.drapeauFin);
    if (quest.type === 'principale') this.state.setFlag(mainQuestDoneFlag(quest.id));
    this.events.emit('completed', { quest: quest.id });
    if (quest.suivante) this.start(quest.suivante);
  }

  private applyRewards(questId: string, rewards: QuestRewards | undefined): void {
    if (!rewards) return;
    if (rewards.xp) this.events.emit('xpReward', { quest: questId, amount: rewards.xp });
    if (rewards.pieces) this.state.addCoins(rewards.pieces);
    for (const { id, quantite } of rewards.objets ?? []) this.state.addItem(id, quantite);
    if (rewards.resonance) this.state.learnResonance(rewards.resonance);
    if (rewards.lueur) this.state.findLueur(rewards.lueur);
    if (rewards.equipe) this.events.emit('recruitRequest', { quest: questId, hero: rewards.equipe });
  }

  private updateCounts(id: string, counts: Record<string, number>): void {
    const progress = this.state.getQuestProgress(id);
    if (progress) this.state.setQuestProgress(id, { ...progress, counts });
  }

  // --- Déclencheurs du moteur -----------------------------------------------

  /**
   * Parcourt les tâches courantes du type donné dont la cible correspond et
   * les valide (ou les fait progresser via `advance`). Renvoie les missions avancées.
   */
  private trigger(
    type: QuestTaskType,
    matches: (task: QuestTask) => boolean,
    advance?: (quest: QuestData, task: QuestTask, progress: QuestProgress) => boolean,
  ): string[] {
    const advanced: string[] = [];
    for (const quest of this.activeQuests()) {
      const progress = this.state.getQuestProgress(quest.id);
      const task = this.currentTask(quest.id);
      if (!progress || !task || task.type !== type || !matches(task)) continue;
      if (advance && !advance(quest, task, progress)) continue;
      if (this.completeTask(quest.id, progress.task)) advanced.push(quest.id);
    }
    return advanced;
  }

  onReachMap(mapId: string): string[] {
    return this.trigger('aller', (t) => t.cible === mapId);
  }

  /**
   * Dialogue avec un PNJ. `groups` : identifiants de groupe du PNJ (ex. `brumeval-villageois`)
   * pour les tâches « parler à 3 villageois », qui comptent les PNJ distincts.
   */
  onTalk(npcId: string, groups: string[] = []): string[] {
    return this.trigger(
      'parler',
      (t) => t.cible === npcId || groups.includes(t.cible),
      (quest, task, progress) => this.countDistinct(quest.id, task, progress, npcId),
    );
  }

  onListen(npcId: string, groups: string[] = []): string[] {
    return this.trigger(
      'ecouter',
      (t) => t.cible === npcId || groups.includes(t.cible),
      (quest, task, progress) => this.countDistinct(quest.id, task, progress, npcId),
    );
  }

  onPuzzleSolved(puzzleId: string): string[] {
    return this.trigger('resoudre', (t) => t.cible === puzzleId);
  }

  onBattleWon(groupId: string): string[] {
    return this.trigger(
      'vaincre',
      (t) => t.cible === groupId,
      (quest, task, progress) => {
        const count = (progress.counts[task.cible] ?? 0) + 1;
        this.updateCounts(quest.id, { ...progress.counts, [task.cible]: count });
        return count >= (task.quantite ?? 1);
      },
    );
  }

  /** À appeler quand l'inventaire change : valide les tâches « trouver ». */
  onItemChanged(itemId: string): string[] {
    return this.trigger(
      'trouver',
      (t) => t.cible === itemId,
      (quest, task, progress) => {
        const count = this.state.countItem(itemId);
        this.updateCounts(quest.id, { ...progress.counts, [task.cible]: count });
        return count >= (task.quantite ?? 1);
      },
    );
  }

  /** Tâches « choisir » : la cible est le drapeau posé par le choix. */
  onFlag(flag: string): string[] {
    return this.trigger('choisir', (t) => t.cible === flag);
  }

  /**
   * Livraison d'un objet à un PNJ. La cible de la tâche est le PNJ (ou l'objet,
   * ou `pnj:objet`). Les objets ne sont pas retirés : c'est le rôle de la scène.
   */
  onDeliver(npcId: string, itemId: string): string[] {
    return this.trigger(
      'livrer',
      (t) => t.cible === npcId || t.cible === itemId || t.cible === `${npcId}:${itemId}`,
      (_quest, task) => this.state.countItem(itemId) >= (task.quantite ?? 1),
    );
  }

  private countDistinct(
    questId: string,
    task: QuestTask,
    progress: QuestProgress,
    npcId: string,
  ): boolean {
    const required = task.quantite ?? 1;
    if (required <= 1) return true;
    const key = `${task.cible}/${npcId}`;
    const counts = { ...progress.counts, [key]: 1 };
    this.updateCounts(questId, counts);
    const prefix = `${task.cible}/`;
    return Object.keys(counts).filter((k) => k.startsWith(prefix)).length >= required;
  }

  // --- Journal --------------------------------------------------------------

  summary(status: QuestProgress['status'] = 'active'): QuestSummary[] {
    const quests = status === 'active' ? this.activeQuests() : this.completedQuests();
    return quests.map((quest) => this.summarize(quest));
  }

  private summarize(quest: QuestData): QuestSummary {
    const progress = this.state.getQuestProgress(quest.id);
    const current = progress?.status === 'done' ? quest.taches.length : (progress?.task ?? 0);
    const tasks = quest.taches
      .map((task, index) => ({ index, texte: task.texte, done: index < current }))
      .filter((task) => task.done || task.index === current);
    return {
      id: quest.id,
      type: quest.type,
      titre: quest.titre,
      resume: quest.resume,
      status: progress?.status ?? 'active',
      ...(quest.zone ? { zone: quest.zone } : {}),
      tasks,
    };
  }
}

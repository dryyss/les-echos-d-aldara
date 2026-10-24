import type { DirectionAction, InputAction } from './actions';
import { dominantDirection } from './actions';

/**
 * État logique des entrées, sans dépendance au navigateur : reçoit des
 * événements press/release et expose isDown / justPressed par contexte.
 * Le contexte du haut de la pile est le seul à recevoir les appuis.
 */
export class InputState {
  private readonly down = new Set<InputAction>();
  private readonly pressedThisFrame = new Set<InputAction>();
  private readonly releasedThisFrame = new Set<InputAction>();
  private readonly directionOrder: DirectionAction[] = [];
  private readonly contexts: string[] = ['world'];
  /** Durée d'appui en millisecondes par action, pour distinguer tap et maintien. */
  private readonly heldFor = new Map<InputAction, number>();

  press(action: InputAction): void {
    if (this.down.has(action)) return;
    this.down.add(action);
    this.pressedThisFrame.add(action);
    this.heldFor.set(action, 0);
    if (isDirection(action)) {
      this.removeDirection(action);
      this.directionOrder.push(action);
    }
  }

  release(action: InputAction): void {
    if (!this.down.has(action)) return;
    this.down.delete(action);
    this.releasedThisFrame.add(action);
    this.heldFor.delete(action);
    if (isDirection(action)) this.removeDirection(action);
  }

  /** À appeler une fois par image, après que les scènes ont lu les entrées. */
  endFrame(deltaMs: number): void {
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();
    for (const action of this.down) {
      this.heldFor.set(action, (this.heldFor.get(action) ?? 0) + deltaMs);
    }
  }

  /** Relâche tout (perte de focus, changement de scène). */
  reset(): void {
    this.down.clear();
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();
    this.directionOrder.length = 0;
    this.heldFor.clear();
  }

  pushContext(name: string): void {
    this.contexts.push(name);
    this.pressedThisFrame.clear();
  }

  popContext(name?: string): void {
    if (this.contexts.length <= 1) return;
    if (name !== undefined && this.contexts[this.contexts.length - 1] !== name) return;
    this.contexts.pop();
    this.pressedThisFrame.clear();
  }

  get currentContext(): string {
    return this.contexts[this.contexts.length - 1] ?? 'world';
  }

  isDown(action: InputAction, context?: string): boolean {
    if (!this.hasFocus(context)) return false;
    return this.down.has(action);
  }

  justPressed(action: InputAction, context?: string): boolean {
    if (!this.hasFocus(context)) return false;
    return this.pressedThisFrame.has(action);
  }

  justReleased(action: InputAction, context?: string): boolean {
    if (!this.hasFocus(context)) return false;
    return this.releasedThisFrame.has(action);
  }

  heldDuration(action: InputAction): number {
    return this.heldFor.get(action) ?? 0;
  }

  /** Direction enfoncée la plus récente, ou null. */
  direction(context?: string): DirectionAction | null {
    if (!this.hasFocus(context)) return null;
    return dominantDirection(this.down, this.directionOrder);
  }

  anyJustPressed(context?: string): boolean {
    if (!this.hasFocus(context)) return false;
    return this.pressedThisFrame.size > 0;
  }

  private hasFocus(context: string | undefined): boolean {
    return context === undefined || context === this.currentContext;
  }

  private removeDirection(action: DirectionAction): void {
    const index = this.directionOrder.indexOf(action);
    if (index >= 0) this.directionOrder.splice(index, 1);
  }
}

function isDirection(action: InputAction): action is DirectionAction {
  return action === 'up' || action === 'down' || action === 'left' || action === 'right';
}

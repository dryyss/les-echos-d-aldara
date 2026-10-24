import type { InputAction } from './actions';
import { actionForKey, directionsFromAxes, GAMEPAD_MAP, INPUT_ACTIONS } from './actions';
import { InputState } from './InputState';

/**
 * Branche le clavier et la manette du navigateur sur un InputState.
 * Une seule instance pour tout le jeu (créée dans BootScene, exposée par services).
 * Appeler `update(deltaMs)` à chaque image depuis la scène active (après lecture).
 */
export class InputManager {
  readonly state = new InputState();
  private readonly gamepadDown = new Set<InputAction>();
  private attached = false;

  attach(target: Window = window): void {
    if (this.attached) return;
    this.attached = true;
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('blur', this.onBlur);
  }

  detach(target: Window = window): void {
    if (!this.attached) return;
    this.attached = false;
    target.removeEventListener('keydown', this.onKeyDown);
    target.removeEventListener('keyup', this.onKeyUp);
    target.removeEventListener('blur', this.onBlur);
  }

  /** Lit la manette puis clôt l'image. */
  update(deltaMs: number): void {
    this.pollGamepad();
    this.state.endFrame(deltaMs);
  }

  isDown(action: InputAction, context?: string): boolean {
    return this.state.isDown(action, context);
  }

  justPressed(action: InputAction, context?: string): boolean {
    return this.state.justPressed(action, context);
  }

  direction(context?: string) {
    return this.state.direction(context);
  }

  anyJustPressed(context?: string): boolean {
    return this.state.anyJustPressed(context);
  }

  pushContext(name: string): void {
    this.state.pushContext(name);
  }

  popContext(name?: string): void {
    this.state.popContext(name);
  }

  get currentContext(): string {
    return this.state.currentContext;
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (isTypingTarget(event.target)) return;
    const action = actionForKey(event.code);
    if (action === null) return;
    // Évite le défilement de la page et la sortie de focus avec Tab.
    event.preventDefault();
    if (event.repeat) return;
    this.state.press(action);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const action = actionForKey(event.code);
    if (action === null) return;
    this.state.release(action);
  };

  private readonly onBlur = (): void => {
    this.state.reset();
    this.gamepadDown.clear();
  };

  private pollGamepad(): void {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return;
    const pad = Array.from(navigator.getGamepads()).find((p) => p !== null) ?? null;
    const nowDown = new Set<InputAction>();
    if (pad) {
      for (const action of INPUT_ACTIONS) {
        if (GAMEPAD_MAP[action].some((i) => pad.buttons[i]?.pressed)) nowDown.add(action);
      }
      for (const dir of directionsFromAxes(pad.axes[0] ?? 0, pad.axes[1] ?? 0)) nowDown.add(dir);
    }
    for (const action of nowDown) {
      if (!this.gamepadDown.has(action)) this.state.press(action);
    }
    for (const action of this.gamepadDown) {
      if (!nowDown.has(action)) this.state.release(action);
    }
    this.gamepadDown.clear();
    for (const action of nowDown) this.gamepadDown.add(action);
  }
}

/** Les champs de formulaire (connexion) gardent leurs touches. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

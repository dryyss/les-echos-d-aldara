/** Actions abstraites du jeu, indépendantes du périphérique. */
export type InputAction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'confirm'
  | 'cancel'
  | 'menu'
  | 'wheel'
  | 'shortcut1'
  | 'shortcut2'
  | 'run';

export const INPUT_ACTIONS: readonly InputAction[] = [
  'up',
  'down',
  'left',
  'right',
  'confirm',
  'cancel',
  'menu',
  'wheel',
  'shortcut1',
  'shortcut2',
  'run',
];

export type DirectionAction = 'up' | 'down' | 'left' | 'right';

/** Touches clavier (valeurs de KeyboardEvent.code) par action. Flèches et ZQSD. */
export const KEYBOARD_MAP: Record<InputAction, readonly string[]> = {
  up: ['ArrowUp', 'KeyW', 'KeyZ'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA', 'KeyQ'],
  right: ['ArrowRight', 'KeyD'],
  confirm: ['Space', 'Enter', 'NumpadEnter'],
  cancel: ['Escape', 'Backspace'],
  menu: ['Tab'],
  wheel: ['KeyR'],
  shortcut1: ['Digit1', 'Numpad1'],
  shortcut2: ['Digit2', 'Numpad2'],
  run: ['ShiftLeft', 'ShiftRight'],
};

/** Boutons de manette (indices standard Gamepad API) par action. */
export const GAMEPAD_MAP: Record<InputAction, readonly number[]> = {
  up: [12],
  down: [13],
  left: [14],
  right: [15],
  confirm: [0],
  cancel: [1],
  menu: [9],
  wheel: [3],
  shortcut1: [4],
  shortcut2: [5],
  run: [2],
};

/** Seuil du stick analogique au-delà duquel une direction est considérée comme enfoncée. */
export const AXIS_THRESHOLD = 0.5;

/**
 * Traduit un code clavier en action, ou null s'il n'est lié à rien.
 * Pure et testable.
 */
export function actionForKey(code: string): InputAction | null {
  for (const action of INPUT_ACTIONS) {
    if (KEYBOARD_MAP[action].includes(code)) return action;
  }
  return null;
}

/** Direction dominante à partir d'un ensemble d'actions enfoncées (priorité à la dernière appuyée). */
export function dominantDirection(
  pressed: ReadonlySet<InputAction>,
  order: readonly DirectionAction[],
): DirectionAction | null {
  for (let i = order.length - 1; i >= 0; i -= 1) {
    const action = order[i];
    if (action !== undefined && pressed.has(action)) return action;
  }
  return null;
}

/** Convertit les axes d'un stick en directions enfoncées. */
export function directionsFromAxes(x: number, y: number): DirectionAction[] {
  const result: DirectionAction[] = [];
  if (x <= -AXIS_THRESHOLD) result.push('left');
  if (x >= AXIS_THRESHOLD) result.push('right');
  if (y <= -AXIS_THRESHOLD) result.push('up');
  if (y >= AXIS_THRESHOLD) result.push('down');
  return result;
}

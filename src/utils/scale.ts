/**
 * Calcule le zoom à appliquer au canvas pour remplir la fenêtre sans flou.
 * On privilégie un facteur entier (pixel perfect). Si même ×1 ne rentre pas,
 * on retombe sur un facteur fractionnaire pour rester visible.
 */
export function computeIntegerZoom(
  viewportWidth: number,
  viewportHeight: number,
  gameWidth: number,
  gameHeight: number,
): number {
  if (gameWidth <= 0 || gameHeight <= 0) return 1;
  const fit = Math.min(viewportWidth / gameWidth, viewportHeight / gameHeight);
  if (!Number.isFinite(fit) || fit <= 0) return 1;
  const integer = Math.floor(fit);
  return integer >= 1 ? integer : fit;
}

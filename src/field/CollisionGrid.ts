/**
 * Grille de collisions : calque Tiled + occupants (PNJ, objets solides).
 * Hors de la carte = bloqué. Pure, sans Phaser.
 */
export class CollisionGrid {
  private readonly blocked: boolean[];

  constructor(
    readonly width: number,
    readonly height: number,
    blocked: readonly boolean[],
  ) {
    if (blocked.length !== width * height) {
      throw new Error(`CollisionGrid : ${blocked.length} cases pour ${width} × ${height}`);
    }
    this.blocked = [...blocked];
  }

  /** Toute tuile dont l’index Tiled est > 0 est un obstacle. */
  static fromCollisionGids(width: number, height: number, gids: readonly number[]): CollisionGrid {
    return new CollisionGrid(
      width,
      height,
      gids.map((gid) => gid > 0),
    );
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  isBlocked(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return true;
    return this.blocked[y * this.width + x] === true;
  }

  setBlocked(x: number, y: number, blocked = true): void {
    if (!this.inBounds(x, y)) return;
    this.blocked[y * this.width + x] = blocked;
  }

  clear(x: number, y: number): void {
    this.setBlocked(x, y, false);
  }
}

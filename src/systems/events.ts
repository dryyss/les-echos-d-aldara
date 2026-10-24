/**
 * Petit émetteur d'événements typé, sans dépendance.
 *
 * `Events` associe un nom d'événement à la forme de sa charge utile :
 *
 *   interface MyEvents { coins: { coins: number } }
 *   const emitter = new TypedEmitter<MyEvents>();
 *   const off = emitter.on('coins', ({ coins }) => ...);
 */

/** Contrainte acceptant les interfaces (pas de signature d'index requise). */
export type EventMap<Events> = { [K in keyof Events]: unknown };

export type Listener<T> = (payload: T) => void;

export class TypedEmitter<Events extends EventMap<Events>> {
  private readonly listeners = new Map<keyof Events, Set<Listener<never>>>();

  /** Abonne un écouteur et renvoie la fonction qui le désabonne. */
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<never>);
    return () => this.off(event, listener);
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(listener as Listener<never>);
    if (set.size === 0) this.listeners.delete(event);
  }

  /** Abonne un écouteur appelé une seule fois. */
  once<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    const wrapper: Listener<Events[K]> = (payload) => {
      this.off(event, wrapper);
      listener(payload);
    };
    return this.on(event, wrapper);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    // Copie : un écouteur peut se désabonner pendant l'émission.
    for (const listener of [...set]) {
      (listener as Listener<Events[K]>)(payload);
    }
  }

  listenerCount(event: keyof Events): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

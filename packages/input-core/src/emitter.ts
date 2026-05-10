type Listener<T> = (payload: T) => void;

export class TypedEmitter<E extends Record<string, unknown>> {
  private readonly listeners = new Map<keyof E, Set<Listener<unknown>>>();

  on<K extends keyof E>(event: K, cb: Listener<E[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(cb as Listener<unknown>);
    return () => this.off(event, cb);
  }

  off<K extends keyof E>(event: K, cb: Listener<E[K]>): void {
    this.listeners.get(event)?.delete(cb as Listener<unknown>);
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const cb of set) (cb as Listener<E[K]>)(payload);
  }
}

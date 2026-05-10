import type { Target } from './types.js';

export class TargetRegistry {
  private readonly targets: Target[] = [];

  register(t: Target): void {
    this.unregister(t.id);
    this.targets.push(t);
  }

  unregister(id: string): void {
    const i = this.targets.findIndex((t) => t.id === id);
    if (i >= 0) this.targets.splice(i, 1);
  }

  hit(x: number, y: number): Target | null {
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i]!;
      const { rect } = t;
      if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        return t;
      }
    }
    return null;
  }

  clear(): void {
    this.targets.length = 0;
  }
}

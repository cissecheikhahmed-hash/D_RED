/**
 * Horloge du Decision Engine simulé. Les transitions purement temporisées
 * (scan infra, notification des donneurs, relance après refus) passent par
 * `schedule()` plutôt que par un `setTimeout` direct, pour pouvoir être
 * mises en pause/avancées pas-à-pas depuis un panneau présentateur caché —
 * jamais visible dans les écrans jury (Donneur/Hôpital/CNTS).
 *
 * Les actions déclenchées par un humain (accepter, confirmer, éjecter...)
 * ne passent jamais par cette horloge : elles s'exécutent toujours
 * immédiatement, pause ou non.
 */
class DemoClock {
  private paused = false;
  private activeTimers = new Set<NodeJS.Timeout>();
  private pendingSteps: Array<() => void> = [];

  get isPaused(): boolean {
    return this.paused;
  }

  schedule(fn: () => void, delayMs: number): void {
    if (this.paused) {
      this.pendingSteps.push(fn);
      return;
    }
    const timer = setTimeout(() => {
      this.activeTimers.delete(timer);
      fn();
    }, delayMs);
    this.activeTimers.add(timer);
  }

  pause(): void {
    this.paused = true;
  }

  play(): void {
    this.paused = false;
    const steps = this.pendingSteps.splice(0);
    for (const step of steps) step();
  }

  step(): boolean {
    const next = this.pendingSteps.shift();
    if (!next) return false;
    next();
    return true;
  }

  reset(): void {
    for (const timer of this.activeTimers) clearTimeout(timer);
    this.activeTimers.clear();
    this.pendingSteps = [];
    this.paused = false;
  }
}

export const demoClock = new DemoClock();

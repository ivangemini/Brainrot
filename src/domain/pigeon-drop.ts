import { PIGEON_DROP, type PigeonDropDefinition } from '../content/event-content';
import type { MutationId } from '../content/mutation-content';
import type { BranchLevels } from './economy-formulas';
import { getEventReferenceIncome, getEventReward, type EventRewardBreakdown } from './event-economy';

export type PigeonDropPhase = 'countdown' | 'active' | 'complete';
export type PigeonDropAccuracy = 'center' | 'near' | 'graze' | 'miss';

export interface PigeonDropImpact {
  readonly sequence: number;
  readonly accuracy: PigeonDropAccuracy;
  readonly points: number;
  readonly targetX: number;
  readonly distanceFromCenter: number;
}

export interface PigeonDropSnapshot {
  readonly phase: PigeonDropPhase;
  readonly countdownRemaining: number;
  readonly timeRemaining: number;
  readonly score: number;
  readonly attempts: number;
  readonly targetX: number;
  readonly targetDirection: -1 | 1;
  readonly dropProgress: number | null;
  readonly resetRemaining: number;
  readonly canDrop: boolean;
  readonly lastImpact: PigeonDropImpact | null;
}

export interface DropRequestResult {
  readonly accepted: boolean;
}

export class PigeonDropSession {
  private phase: PigeonDropPhase = 'countdown';
  private countdownRemaining: number;
  private activeElapsed = 0;
  private score = 0;
  private attempts = 0;
  private targetX: number;
  private targetDirection: -1 | 1 = 1;
  private dropElapsed: number | null = null;
  private resetRemaining = 0;
  private impactSequence = 0;
  private lastImpact: PigeonDropImpact | null = null;

  public constructor(private readonly definition: PigeonDropDefinition = PIGEON_DROP) {
    this.countdownRemaining = definition.countdownSeconds;
    this.targetX = definition.targetMinX;
  }

  public getSnapshot(): PigeonDropSnapshot {
    return {
      phase: this.phase,
      countdownRemaining: Math.max(0, this.countdownRemaining),
      timeRemaining: Math.max(0, this.definition.durationSeconds - this.activeElapsed),
      score: this.score,
      attempts: this.attempts,
      targetX: this.targetX,
      targetDirection: this.targetDirection,
      dropProgress: this.dropElapsed === null
        ? null
        : Math.max(0, Math.min(1, this.dropElapsed / this.definition.dropTravelSeconds)),
      resetRemaining: Math.max(0, this.resetRemaining),
      canDrop: this.phase === 'active' && this.dropElapsed === null && this.resetRemaining <= 1e-9,
      lastImpact: this.lastImpact ? { ...this.lastImpact } : null,
    };
  }

  public drop(): DropRequestResult {
    if (this.phase !== 'active' || this.dropElapsed !== null || this.resetRemaining > 1e-9) {
      return { accepted: false };
    }
    this.dropElapsed = 0;
    return { accepted: true };
  }

  public tick(deltaSeconds: number): PigeonDropSnapshot {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0 || this.phase === 'complete') {
      return this.getSnapshot();
    }

    let remaining = Math.min(deltaSeconds, 0.25);
    if (this.phase === 'countdown') {
      const consumed = Math.min(remaining, this.countdownRemaining);
      this.countdownRemaining -= consumed;
      remaining -= consumed;
      if (this.countdownRemaining <= 1e-9) {
        this.countdownRemaining = 0;
        this.phase = 'active';
      }
    }

    if (this.phase === 'active' && remaining > 1e-9) this.advanceActive(remaining);
    return this.getSnapshot();
  }

  private advanceActive(deltaSeconds: number): void {
    let remaining = deltaSeconds;
    while (remaining > 1e-9 && this.phase === 'active') {
      const timeToEnd = this.definition.durationSeconds - this.activeElapsed;
      const timeToImpact = this.dropElapsed === null
        ? Number.POSITIVE_INFINITY
        : this.definition.dropTravelSeconds - this.dropElapsed;
      const timeToReset = this.resetRemaining > 1e-9
        ? this.resetRemaining
        : Number.POSITIVE_INFINITY;
      const slice = Math.min(remaining, timeToEnd, timeToImpact, timeToReset);

      if (slice > 1e-9) {
        // Lock the target under the aim line while the visible projectile falls.
        // This makes the click itself authoritative and keeps feedback truthful.
        if (this.dropElapsed === null) this.moveTarget(slice);
        this.activeElapsed += slice;
        if (this.dropElapsed !== null) this.dropElapsed += slice;
        if (this.resetRemaining > 0) this.resetRemaining = Math.max(0, this.resetRemaining - slice);
        remaining -= slice;
      }

      if (this.dropElapsed !== null && this.dropElapsed >= this.definition.dropTravelSeconds - 1e-9) {
        this.resolveImpact();
      }

      if (this.activeElapsed >= this.definition.durationSeconds - 1e-9) {
        this.activeElapsed = this.definition.durationSeconds;
        this.phase = 'complete';
        this.dropElapsed = null;
        this.resetRemaining = 0;
        break;
      }

      // Avoid a zero-length loop at exact reset boundaries.
      if (slice <= 1e-9 && this.resetRemaining <= 1e-9 && this.dropElapsed === null) break;
    }
  }

  private moveTarget(deltaSeconds: number): void {
    let next = this.targetX + this.targetDirection * this.definition.targetSpeedPerSecond * deltaSeconds;
    const min = this.definition.targetMinX;
    const max = this.definition.targetMaxX;

    while (next < min || next > max) {
      if (next > max) {
        next = max - (next - max);
        this.targetDirection = -1;
      } else if (next < min) {
        next = min + (min - next);
        this.targetDirection = 1;
      }
    }
    this.targetX = next;
  }

  private resolveImpact(): void {
    const distance = Math.abs(this.targetX - 0.5);
    let accuracy: PigeonDropAccuracy = 'miss';
    let points = 0;
    if (distance <= this.definition.centerAccuracy) {
      accuracy = 'center';
      points = this.definition.centerPoints;
    } else if (distance <= this.definition.nearAccuracy) {
      accuracy = 'near';
      points = this.definition.nearPoints;
    } else if (distance <= this.definition.grazeAccuracy) {
      accuracy = 'graze';
      points = this.definition.grazePoints;
    }

    this.attempts += 1;
    this.score += points;
    this.impactSequence += 1;
    this.lastImpact = {
      sequence: this.impactSequence,
      accuracy,
      points,
      targetX: this.targetX,
      distanceFromCenter: distance,
    };
    this.dropElapsed = null;
    this.resetRemaining = this.definition.attemptResetSeconds;
  }
}

export function getPigeonDropReferenceIncome(
  levels: BranchLevels,
  mutations: readonly MutationId[] = [],
): number {
  return getEventReferenceIncome(levels, mutations, PIGEON_DROP);
}

export function getPigeonDropReward(
  score: number,
  referenceIncomePerSecond: number,
  definition: PigeonDropDefinition = PIGEON_DROP,
): EventRewardBreakdown {
  return getEventReward(score, referenceIncomePerSecond, definition);
}

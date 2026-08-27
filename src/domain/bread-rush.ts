import { BREAD_RUSH, type BreadRushDefinition } from '../content/event-content';
import {
  getBaseTap,
  getBodyMultiplier,
  getCritChance,
  getCritMultiplier,
  getPassiveRate,
  type BranchLevels,
} from './economy-formulas';

export type BreadKind = 'normal' | 'golden';
export type BreadRushPhase = 'countdown' | 'active' | 'complete';

export interface BreadTarget {
  readonly id: number;
  readonly kind: BreadKind;
  readonly x: number;
  readonly y: number;
  readonly ageSeconds: number;
  readonly lifetimeSeconds: number;
  readonly driftXPerSecond: number;
  readonly driftYPerSecond: number;
}

export interface BreadRushSnapshot {
  readonly phase: BreadRushPhase;
  readonly countdownRemaining: number;
  readonly timeRemaining: number;
  readonly score: number;
  readonly targets: readonly BreadTarget[];
}

export interface BreadCollectResult {
  readonly collected: boolean;
  readonly points: number;
  readonly kind?: BreadKind;
}

export interface BreadRushRewardBreakdown {
  readonly normalizedScore: number;
  readonly performanceMultiplier: number;
  readonly referenceIncomePerSecond: number;
  readonly reward: number;
}

export class BreadRushSession {
  private phase: BreadRushPhase = 'countdown';
  private countdownRemaining: number;
  private activeElapsed = 0;
  private spawnAccumulator = 0;
  private score = 0;
  private nextTargetId = 1;
  private targets: BreadTarget[] = [];

  public constructor(
    private readonly random: () => number = Math.random,
    private readonly definition: BreadRushDefinition = BREAD_RUSH,
  ) {
    this.countdownRemaining = definition.countdownSeconds;
  }

  public getSnapshot(): BreadRushSnapshot {
    return {
      phase: this.phase,
      countdownRemaining: Math.max(0, this.countdownRemaining),
      timeRemaining: Math.max(0, this.definition.durationSeconds - this.activeElapsed),
      score: this.score,
      targets: this.targets.map((target) => ({ ...target })),
    };
  }

  public tick(deltaSeconds: number): BreadRushSnapshot {
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

    if (this.phase === 'active' && remaining > 0) {
      this.advanceActive(remaining);
    }

    return this.getSnapshot();
  }

  public collect(targetId: number): BreadCollectResult {
    if (this.phase !== 'active') return { collected: false, points: 0 };
    const index = this.targets.findIndex((target) => target.id === targetId);
    if (index < 0) return { collected: false, points: 0 };

    const [target] = this.targets.splice(index, 1);
    if (!target) return { collected: false, points: 0 };
    const points = target.kind === 'golden' ? this.definition.goldenPoints : this.definition.normalPoints;
    this.score += points;
    return { collected: true, points, kind: target.kind };
  }

  private advanceActive(deltaSeconds: number): void {
    const remainingDuration = this.definition.durationSeconds - this.activeElapsed;
    const step = Math.min(deltaSeconds, remainingDuration);
    this.activeElapsed += step;
    this.spawnAccumulator += step;

    this.targets = this.targets
      .map((target) => ({
        ...target,
        ageSeconds: target.ageSeconds + step,
        x: target.x + target.driftXPerSecond * step,
        y: target.y + target.driftYPerSecond * step,
      }))
      .filter((target) => (
        target.ageSeconds < target.lifetimeSeconds
        && target.x > 0.03
        && target.x < 0.97
        && target.y > 0.08
        && target.y < 0.88
      ));

    while (this.spawnAccumulator >= this.definition.spawnIntervalSeconds && this.phase === 'active') {
      this.spawnAccumulator -= this.definition.spawnIntervalSeconds;
      this.spawnTarget();
    }

    if (this.activeElapsed >= this.definition.durationSeconds - 1e-9) {
      this.activeElapsed = this.definition.durationSeconds;
      this.targets = [];
      this.phase = 'complete';
    }
  }

  private spawnTarget(): void {
    const golden = this.random() < this.definition.goldenChance;
    const x = 0.16 + this.random() * 0.68;
    const y = 0.2 + this.random() * 0.5;
    const angle = this.random() * Math.PI * 2;
    const driftMagnitude = 0.035 + this.random() * 0.035;

    this.targets.push({
      id: this.nextTargetId,
      kind: golden ? 'golden' : 'normal',
      x,
      y,
      ageSeconds: 0,
      lifetimeSeconds: this.definition.targetLifetimeSeconds * (0.9 + this.random() * 0.2),
      driftXPerSecond: Math.cos(angle) * driftMagnitude,
      driftYPerSecond: Math.sin(angle) * driftMagnitude * 0.65,
    });
    this.nextTargetId += 1;
  }
}

export function getBreadRushReferenceIncome(levels: BranchLevels): number {
  const expectedCritFactor = 1 + getCritChance(levels) * (getCritMultiplier(levels) - 1);
  const tapReference = getBaseTap(levels)
    * getBodyMultiplier(levels)
    * BREAD_RUSH.referenceTapsPerSecond
    * BREAD_RUSH.referenceComboMultiplier
    * expectedCritFactor;
  return Math.max(1, tapReference + getPassiveRate(levels));
}

export function getBreadRushReward(
  score: number,
  referenceIncomePerSecond: number,
  definition: BreadRushDefinition = BREAD_RUSH,
): BreadRushRewardBreakdown {
  const safeScore = Math.max(0, Number.isFinite(score) ? score : 0);
  const normalizedScore = Math.min(definition.normalizedScoreCap, safeScore / definition.expectedScore);
  const performanceMultiplier = Math.min(
    definition.performanceMax,
    definition.performanceBase + normalizedScore * definition.performancePerNormalizedScore,
  );
  const safeReference = Math.max(1, Number.isFinite(referenceIncomePerSecond) ? referenceIncomePerSecond : 1);
  const reward = safeReference * definition.baseRewardSeconds * performanceMultiplier;
  return {
    normalizedScore,
    performanceMultiplier,
    referenceIncomePerSecond: safeReference,
    reward,
  };
}

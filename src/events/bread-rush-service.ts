import { BREAD_RUSH } from '../content/event-content';
import { getBreadRushReferenceIncome, getBreadRushReward } from '../domain/bread-rush';
import { getEventRewardMultiplier, getTotalUpgradeLevel } from '../domain/economy-formulas';
import type { GameStore } from '../domain/game-store';
import type { GameState } from '../domain/game-state';
import type { MonetizationService, RewardDoubleResult } from '../monetization/monetization-service';

export interface BreadRushRunContext {
  readonly runId: string;
  readonly referenceIncomePerSecond: number;
  readonly previousBest: number;
}

export interface BreadRushResult {
  readonly runId: string;
  readonly score: number;
  readonly baseReward: number;
  readonly performanceMultiplier: number;
  readonly previousBest: number;
  readonly bestScore: number;
  readonly isNewBest: boolean;
  readonly doubleTransactionId: string;
}

export class BreadRushService {
  public constructor(
    private readonly store: GameStore,
    private readonly monetization: MonetizationService,
    private readonly persistImmediately: () => void,
  ) {}

  public isAvailable(state: Readonly<GameState> = this.store.getSnapshot()): boolean {
    return !this.store.isMutationEligible(state)
      && getTotalUpgradeLevel(state.branchLevels) >= BREAD_RUSH.unlockTotalLevel
      && state.events.breadRushCooldownSeconds <= 0;
  }

  public startRun(runId = createRunId()): BreadRushRunContext | null {
    const state = this.store.getSnapshot();
    if (!this.isAvailable(state)) return null;
    return {
      runId,
      referenceIncomePerSecond: getBreadRushReferenceIncome(state.branchLevels, state.mutationIds),
      previousBest: state.events.breadRushBestScore,
    };
  }

  public finishRun(context: BreadRushRunContext, score: number): BreadRushResult {
    const breakdown = getBreadRushReward(score, context.referenceIncomePerSecond);
    const state = this.store.getSnapshot();
    const eventReward = breakdown.reward * getEventRewardMultiplier(state.mutationIds);
    const safeScore = Math.max(0, Math.floor(Number.isFinite(score) ? score : 0));
    const baseTransactionId = `event:bread-rush:${context.runId}:base`;
    const baseApply = this.store.applyRewardOnce(baseTransactionId, eventReward);

    if (baseApply.applied) {
      this.store.recordBreadRushCompletion(safeScore);
      this.persistImmediately();
    }

    const bestScore = Math.max(context.previousBest, safeScore);
    return {
      runId: context.runId,
      score: safeScore,
      baseReward: eventReward,
      performanceMultiplier: breakdown.performanceMultiplier,
      previousBest: context.previousBest,
      bestScore,
      isNewBest: safeScore > context.previousBest,
      doubleTransactionId: `event:bread-rush:${context.runId}:double`,
    };
  }

  public canDouble(result: BreadRushResult): boolean {
    return this.monetization.canShowRewarded()
      && !this.store.hasAppliedReward(result.doubleTransactionId);
  }

  public async doubleResult(result: BreadRushResult): Promise<RewardDoubleResult> {
    return this.monetization.doubleFeatherReward(
      result.doubleTransactionId,
      result.baseReward,
      'bread-rush-result-double',
    );
  }
}

function createRunId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

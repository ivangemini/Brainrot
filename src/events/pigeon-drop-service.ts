import { getEventRewardMultiplier } from '../domain/economy-formulas';
import type { GameStore } from '../domain/game-store';
import type { GameState } from '../domain/game-state';
import { getPigeonDropReferenceIncome, getPigeonDropReward } from '../domain/pigeon-drop';
import type { MonetizationService, RewardDoubleResult } from '../monetization/monetization-service';

export interface PigeonDropRunContext {
  readonly runId: string;
  readonly referenceIncomePerSecond: number;
  readonly previousBest: number;
}

export interface PigeonDropResult {
  readonly runId: string;
  readonly score: number;
  readonly attempts: number;
  readonly baseReward: number;
  readonly performanceMultiplier: number;
  readonly previousBest: number;
  readonly bestScore: number;
  readonly isNewBest: boolean;
  readonly doubleTransactionId: string;
}

export class PigeonDropService {
  public constructor(
    private readonly store: GameStore,
    private readonly monetization: MonetizationService,
    private readonly persistImmediately: () => void,
  ) {}

  public isAvailable(state: Readonly<GameState> = this.store.getSnapshot()): boolean {
    return this.store.isPigeonDropAvailable(state);
  }

  public startRun(runId = createRunId()): PigeonDropRunContext | null {
    const state = this.store.getSnapshot();
    if (!this.isAvailable(state)) return null;
    return {
      runId,
      referenceIncomePerSecond: getPigeonDropReferenceIncome(state.branchLevels, state.mutationIds),
      previousBest: state.events.pigeonDropBestScore,
    };
  }

  public finishRun(context: PigeonDropRunContext, score: number, attempts: number): PigeonDropResult {
    const breakdown = getPigeonDropReward(score, context.referenceIncomePerSecond);
    const state = this.store.getSnapshot();
    const eventReward = breakdown.reward * getEventRewardMultiplier(state.mutationIds);
    const safeScore = Math.max(0, Math.floor(Number.isFinite(score) ? score : 0));
    const safeAttempts = Math.max(0, Math.floor(Number.isFinite(attempts) ? attempts : 0));
    const baseTransactionId = `event:pigeon-drop:${context.runId}:base`;
    const baseApply = this.store.applyRewardOnce(baseTransactionId, eventReward);

    if (baseApply.applied) {
      this.store.recordPigeonDropCompletion(safeScore);
      this.persistImmediately();
    }

    const bestScore = Math.max(context.previousBest, safeScore);
    return {
      runId: context.runId,
      score: safeScore,
      attempts: safeAttempts,
      baseReward: eventReward,
      performanceMultiplier: breakdown.performanceMultiplier,
      previousBest: context.previousBest,
      bestScore,
      isNewBest: safeScore > context.previousBest,
      doubleTransactionId: `event:pigeon-drop:${context.runId}:double`,
    };
  }

  public canDouble(result: PigeonDropResult): boolean {
    return this.monetization.canShowRewarded()
      && !this.store.hasAppliedReward(result.doubleTransactionId);
  }

  public async doubleResult(result: PigeonDropResult): Promise<RewardDoubleResult> {
    return this.monetization.doubleFeatherReward(
      result.doubleTransactionId,
      result.baseReward,
      'pigeon-drop-result-double',
    );
  }
}

function createRunId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

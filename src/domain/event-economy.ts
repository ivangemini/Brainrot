import type { MutationId } from '../content/mutation-content';
import {
  getCritChance,
  getCritMultiplier,
  getPassiveRate,
  getTapPayout,
  type BranchLevels,
} from './economy-formulas';

export interface EventReferenceDefinition {
  readonly referenceTapsPerSecond: number;
  readonly referenceComboMultiplier: number;
}

export interface EventRewardDefinition {
  readonly expectedScore: number;
  readonly normalizedScoreCap: number;
  readonly baseRewardSeconds: number;
  readonly performanceBase: number;
  readonly performancePerNormalizedScore: number;
  readonly performanceMax: number;
}

export interface EventRewardBreakdown {
  readonly normalizedScore: number;
  readonly performanceMultiplier: number;
  readonly referenceIncomePerSecond: number;
  readonly reward: number;
}

export function getEventReferenceIncome(
  levels: BranchLevels,
  mutations: readonly MutationId[],
  definition: EventReferenceDefinition,
): number {
  const expectedCritFactor = 1 + getCritChance(levels, mutations) * (getCritMultiplier(levels, mutations) - 1);
  const tapReference = getTapPayout(levels, definition.referenceComboMultiplier, false, mutations)
    * definition.referenceTapsPerSecond
    * expectedCritFactor;
  return Math.max(1, tapReference + getPassiveRate(levels, mutations));
}

export function getEventReward(
  score: number,
  referenceIncomePerSecond: number,
  definition: EventRewardDefinition,
): EventRewardBreakdown {
  const safeScore = Math.max(0, Number.isFinite(score) ? score : 0);
  const normalizedScore = Math.min(definition.normalizedScoreCap, safeScore / definition.expectedScore);
  const performanceMultiplier = Math.min(
    definition.performanceMax,
    definition.performanceBase + normalizedScore * definition.performancePerNormalizedScore,
  );
  const safeReference = Math.max(1, Number.isFinite(referenceIncomePerSecond) ? referenceIncomePerSecond : 1);
  return {
    normalizedScore,
    performanceMultiplier,
    referenceIncomePerSecond: safeReference,
    reward: safeReference * definition.baseRewardSeconds * performanceMultiplier,
  };
}

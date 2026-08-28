import {
  GROWTH_STAGES,
  UPGRADE_DEFINITIONS,
  type GrowthStageDefinition,
  type UpgradeBranchId,
} from '../content/economy-content';
import {
  BASE_CRIT_CHANCE_CAP,
  BUSINESS_OFFLINE_EFFICIENCY_BONUS,
  BUSINESS_PASSIVE_MULTIPLIER,
  CHAOS_CRIT_CHANCE_BONUS,
  CHAOS_CRIT_MULTIPLIER,
  CHAOS_EVENT_REWARD_MULTIPLIER,
  MUSCLE_ACTIVE_TAP_MULTIPLIER,
  MUSCLE_COMBO_CAP_BONUS,
  MUTATION_CRIT_CHANCE_HARD_CAP,
  OFFLINE_EFFICIENCY_HARD_CAP,
  hasMutation,
  type MutationId,
} from '../content/mutation-content';

const BEAK_MILESTONES: readonly [number, number][] = [
  [10, 1.5],
  [25, 1.6],
  [50, 1.75],
  [75, 1.8],
  [100, 2.0],
];

const BODY_MILESTONES: readonly [number, number][] = [
  [10, 1.3],
  [25, 1.45],
  [50, 1.6],
  [75, 1.75],
  [100, 1.9],
];

const NEST_MILESTONES: readonly [number, number][] = [
  [10, 1.5],
  [25, 1.6],
  [50, 1.8],
  [75, 2.0],
  [100, 2.2],
];

const BRAIN_MILESTONES: readonly [number, number][] = [
  [10, 1.5],
  [25, 1.7],
  [50, 2.0],
  [75, 2.1],
  [100, 2.25],
];

export type BranchLevels = Record<UpgradeBranchId, number>;

export function createEmptyBranchLevels(): BranchLevels {
  return { beak: 0, body: 0, nest: 0, wings: 0, swag: 0, brain: 0 };
}

export function getTotalUpgradeLevel(levels: BranchLevels): number {
  return Object.values(levels).reduce((sum, level) => sum + level, 0);
}

export function getUpgradeCost(branch: UpgradeBranchId, currentLevel: number): number {
  const definition = UPGRADE_DEFINITIONS[branch];
  return Math.ceil(definition.baseCost * definition.costGrowth ** currentLevel);
}

export function isBranchUnlocked(branch: UpgradeBranchId, levels: BranchLevels): boolean {
  return getTotalUpgradeLevel(levels) >= UPGRADE_DEFINITIONS[branch].unlockTotalLevel;
}

function milestoneMultiplier(level: number, milestones: readonly [number, number][]): number {
  return milestones.reduce((result, [threshold, factor]) => (
    level >= threshold ? result * factor : result
  ), 1);
}

export function getBaseTap(levels: BranchLevels): number {
  const rawTap = 1 + 0.2 * levels.beak;
  return rawTap * milestoneMultiplier(levels.beak, BEAK_MILESTONES);
}

export function getBodyMultiplier(levels: BranchLevels): number {
  return (1 + 0.04 * levels.body) * milestoneMultiplier(levels.body, BODY_MILESTONES);
}

export function getComboCap(levels: BranchLevels, mutations: readonly MutationId[] = []): number {
  const base = 1 + Math.min(1.5, 0.03 * levels.wings);
  return base + (hasMutation(mutations, 'muscle') ? MUSCLE_COMBO_CAP_BONUS : 0);
}

export function getCritChance(levels: BranchLevels, mutations: readonly MutationId[] = []): number {
  const base = Math.min(BASE_CRIT_CHANCE_CAP, 0.02 + 0.003 * levels.swag);
  if (!hasMutation(mutations, 'chaos')) return base;
  return Math.min(MUTATION_CRIT_CHANCE_HARD_CAP, base + CHAOS_CRIT_CHANCE_BONUS);
}

export function getCritMultiplier(levels: BranchLevels, mutations: readonly MutationId[] = []): number {
  const base = 3 + 0.04 * levels.swag;
  return base * (hasMutation(mutations, 'chaos') ? CHAOS_CRIT_MULTIPLIER : 1);
}

export function getPassiveRate(levels: BranchLevels, mutations: readonly MutationId[] = []): number {
  const bodyMultiplier = getBodyMultiplier(levels);
  const nest = 0.3 * levels.nest * milestoneMultiplier(levels.nest, NEST_MILESTONES);
  const autoTaps = 0.12 * levels.brain * milestoneMultiplier(levels.brain, BRAIN_MILESTONES);
  const base = bodyMultiplier * (nest + autoTaps * getBaseTap(levels));
  return base * (hasMutation(mutations, 'business') ? BUSINESS_PASSIVE_MULTIPLIER : 1);
}

export function getOfflineEfficiency(levels: BranchLevels, mutations: readonly MutationId[] = []): number {
  const base = 0.5 + levels.brain * 0.005;
  const bonus = hasMutation(mutations, 'business') ? BUSINESS_OFFLINE_EFFICIENCY_BONUS : 0;
  return Math.min(OFFLINE_EFFICIENCY_HARD_CAP, base + bonus);
}

export function getEventRewardMultiplier(mutations: readonly MutationId[] = []): number {
  return hasMutation(mutations, 'chaos') ? CHAOS_EVENT_REWARD_MULTIPLIER : 1;
}

export function getTapPayout(
  levels: BranchLevels,
  comboMultiplier: number,
  critical: boolean,
  mutations: readonly MutationId[] = [],
): number {
  const critFactor = critical ? getCritMultiplier(levels, mutations) : 1;
  const activeFactor = hasMutation(mutations, 'muscle') ? MUSCLE_ACTIVE_TAP_MULTIPLIER : 1;
  return getBaseTap(levels) * getBodyMultiplier(levels) * comboMultiplier * critFactor * activeFactor;
}

export function getGrowthStage(totalLevel: number): GrowthStageDefinition {
  let current = GROWTH_STAGES[0]!;
  for (const stage of GROWTH_STAGES) {
    if (totalLevel >= stage.threshold) current = stage;
    else break;
  }
  return current;
}

export function getNextGrowthStage(totalLevel: number): GrowthStageDefinition | null {
  return GROWTH_STAGES.find((stage) => stage.threshold > totalLevel) ?? null;
}

export function getNextMilestone(branch: UpgradeBranchId, currentLevel: number): number | null {
  return UPGRADE_DEFINITIONS[branch].milestoneLevels.find((level) => level > currentLevel) ?? null;
}

export function formatEconomyNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (value < 1000) {
    const decimals = value < 10 && value % 1 !== 0 ? 1 : 0;
    return value.toFixed(decimals);
  }
  const suffixes = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let scaled = value;
  let suffixIndex = -1;
  while (scaled >= 1000 && suffixIndex < suffixes.length - 1) {
    scaled /= 1000;
    suffixIndex += 1;
  }
  return `${scaled >= 100 ? scaled.toFixed(0) : scaled.toFixed(1)}${suffixes[suffixIndex] ?? ''}`;
}

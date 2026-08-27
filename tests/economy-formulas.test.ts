import { describe, expect, it } from 'vitest';
import {
  createEmptyBranchLevels,
  getGrowthStage,
  getTapPayout,
  getTotalUpgradeLevel,
  getUpgradeCost,
} from '../src/domain/economy-formulas';

describe('economy formulas', () => {
  it('prices the first Beak upgrade at 15 Feathers', () => {
    expect(getUpgradeCost('beak', 0)).toBe(15);
  });

  it('makes Beak level 1 worth 1.2 Feathers before other multipliers', () => {
    const levels = createEmptyBranchLevels();
    levels.beak = 1;
    expect(getTapPayout(levels, 1, false)).toBeCloseTo(1.2, 8);
  });

  it('derives growth stage from total levels', () => {
    expect(getGrowthStage(0).id).toBe(0);
    expect(getGrowthStage(10).id).toBe(1);
    expect(getGrowthStage(25).id).toBe(2);
    expect(getGrowthStage(90).id).toBe(4);
  });

  it('sums branch levels without hidden progression state', () => {
    const levels = createEmptyBranchLevels();
    levels.beak = 5;
    levels.body = 3;
    levels.nest = 2;
    expect(getTotalUpgradeLevel(levels)).toBe(10);
  });
});

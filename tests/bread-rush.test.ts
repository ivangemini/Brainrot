import { describe, expect, it } from 'vitest';
import { BREAD_RUSH, type BreadRushDefinition } from '../src/content/event-content';
import { BreadRushSession, getBreadRushReferenceIncome, getBreadRushReward } from '../src/domain/bread-rush';
import { createEmptyBranchLevels } from '../src/domain/economy-formulas';

function makeDefinition(overrides: Partial<BreadRushDefinition> = {}): BreadRushDefinition {
  return { ...BREAD_RUSH, ...overrides };
}

describe('BreadRushSession', () => {
  it('does not advance more than a bounded active step per tick and completes on active time', () => {
    const definition = makeDefinition({ countdownSeconds: 0.2, durationSeconds: 0.5, spawnIntervalSeconds: 10 });
    const session = new BreadRushSession(() => 0.5, definition);

    expect(session.getSnapshot().phase).toBe('countdown');
    expect(session.tick(0.2).phase).toBe('active');
    expect(session.tick(10).timeRemaining).toBeCloseTo(0.25, 6);
    expect(session.tick(0.25).phase).toBe('complete');
    expect(session.getSnapshot().timeRemaining).toBe(0);
  });

  it('awards deterministic golden bread points', () => {
    const values = [0, 0.5, 0.5, 0, 0.5, 0.5];
    let cursor = 0;
    const definition = makeDefinition({ countdownSeconds: 0, durationSeconds: 2, spawnIntervalSeconds: 0.1, targetLifetimeSeconds: 2 });
    const session = new BreadRushSession(() => values[cursor++ % values.length] ?? 0, definition);

    session.tick(0.1);
    const target = session.getSnapshot().targets[0];
    expect(target?.kind).toBe('golden');
    const result = session.collect(target!.id);
    expect(result.collected).toBe(true);
    expect(result.points).toBe(definition.goldenPoints);
    expect(session.getSnapshot().score).toBe(definition.goldenPoints);
  });
});

describe('Bread Rush reward tuning', () => {
  it('keeps the performance multiplier bounded', () => {
    const low = getBreadRushReward(0, 10);
    const high = getBreadRushReward(1_000_000, 10);

    expect(low.performanceMultiplier).toBe(BREAD_RUSH.performanceBase);
    expect(high.performanceMultiplier).toBe(BREAD_RUSH.performanceMax);
    expect(high.reward).toBeGreaterThan(low.reward);
  });

  it('scales reference income with player progression', () => {
    const base = createEmptyBranchLevels();
    const progressed = { ...base, beak: 25, body: 20, nest: 15, wings: 10, swag: 10, brain: 10 };

    expect(getBreadRushReferenceIncome(progressed)).toBeGreaterThan(getBreadRushReferenceIncome(base));
  });
});

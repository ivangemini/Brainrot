import { describe, expect, it } from 'vitest';
import { PIGEON_DROP, type PigeonDropDefinition } from '../src/content/event-content';
import { createEmptyBranchLevels } from '../src/domain/economy-formulas';
import { GameStore } from '../src/domain/game-store';
import { createNewGameState } from '../src/domain/game-state';
import { PigeonDropSession, getPigeonDropReferenceIncome, getPigeonDropReward } from '../src/domain/pigeon-drop';
import { PigeonDropService } from '../src/events/pigeon-drop-service';
import type { MonetizationService } from '../src/monetization/monetization-service';

function makeDefinition(overrides: Partial<PigeonDropDefinition> = {}): PigeonDropDefinition {
  return { ...PIGEON_DROP, ...overrides };
}

function advance(session: PigeonDropSession, seconds: number): void {
  let remaining = seconds;
  while (remaining > 1e-9) {
    const step = Math.min(0.25, remaining);
    session.tick(step);
    remaining -= step;
  }
}

describe('PigeonDropSession', () => {
  it('resolves a deterministic center hit after the configured travel time', () => {
    const definition = makeDefinition({
      countdownSeconds: 0.1,
      durationSeconds: 2,
      targetMinX: 0.5,
      targetMaxX: 0.5,
      targetSpeedPerSecond: 0,
      dropTravelSeconds: 0.5,
      attemptResetSeconds: 0.2,
    });
    const session = new PigeonDropSession(definition);

    expect(session.tick(0.1).phase).toBe('active');
    expect(session.drop().accepted).toBe(true);
    expect(session.drop().accepted).toBe(false);
    advance(session, 0.5);

    const impact = session.getSnapshot().lastImpact;
    expect(impact?.accuracy).toBe('center');
    expect(impact?.points).toBe(definition.centerPoints);
    expect(session.getSnapshot().score).toBe(definition.centerPoints);
    expect(session.getSnapshot().attempts).toBe(1);
    expect(session.getSnapshot().canDrop).toBe(false);

    advance(session, 0.2);
    expect(session.getSnapshot().canDrop).toBe(true);
  });

  it('freezes a moving target while the visible drop travels', () => {
    const definition = makeDefinition({
      countdownSeconds: 0,
      durationSeconds: 3,
      targetMinX: 0.4,
      targetMaxX: 0.6,
      targetSpeedPerSecond: 0.2,
      dropTravelSeconds: 0.5,
      attemptResetSeconds: 0.2,
      centerAccuracy: 0.06,
    });
    const session = new PigeonDropSession(definition);

    advance(session, 0.5);
    const alignedX = session.getSnapshot().targetX;
    expect(alignedX).toBeCloseTo(0.5, 8);
    expect(session.drop().accepted).toBe(true);

    advance(session, 0.25);
    expect(session.getSnapshot().targetX).toBeCloseTo(alignedX, 8);
    expect(session.getSnapshot().dropProgress).toBeCloseTo(0.5, 8);

    advance(session, 0.25);
    expect(session.getSnapshot().lastImpact?.targetX).toBeCloseTo(alignedX, 8);
    expect(session.getSnapshot().lastImpact?.accuracy).toBe('center');
  });

  it('records a miss without currency or score punishment beyond zero event points', () => {
    const definition = makeDefinition({
      countdownSeconds: 0,
      durationSeconds: 2,
      targetMinX: 0.18,
      targetMaxX: 0.18,
      targetSpeedPerSecond: 0,
      dropTravelSeconds: 0.25,
    });
    const session = new PigeonDropSession(definition);

    session.tick(0.01);
    expect(session.drop().accepted).toBe(true);
    advance(session, 0.25);

    expect(session.getSnapshot().lastImpact?.accuracy).toBe('miss');
    expect(session.getSnapshot().lastImpact?.points).toBe(0);
    expect(session.getSnapshot().score).toBe(0);
    expect(session.getSnapshot().attempts).toBe(1);
  });

  it('completes from active gameplay time and rejects further drops', () => {
    const definition = makeDefinition({ countdownSeconds: 0, durationSeconds: 0.5 });
    const session = new PigeonDropSession(definition);

    advance(session, 0.5);
    expect(session.getSnapshot().phase).toBe('complete');
    expect(session.getSnapshot().timeRemaining).toBe(0);
    expect(session.drop().accepted).toBe(false);
  });
});

describe('Pigeon Drop reward tuning', () => {
  it('keeps the performance multiplier bounded', () => {
    const low = getPigeonDropReward(0, 10);
    const high = getPigeonDropReward(1_000_000, 10);

    expect(low.performanceMultiplier).toBe(PIGEON_DROP.performanceBase);
    expect(high.performanceMultiplier).toBe(PIGEON_DROP.performanceMax);
    expect(high.reward).toBeGreaterThan(low.reward);
  });

  it('scales reference income with player progression and Mutation identity', () => {
    const base = createEmptyBranchLevels();
    const progressed = { ...base, beak: 35, body: 35, nest: 30, wings: 30, swag: 25, brain: 25 };

    const baseIncome = getPigeonDropReferenceIncome(base);
    const progressedIncome = getPigeonDropReferenceIncome(progressed);
    const businessIncome = getPigeonDropReferenceIncome(progressed, ['business']);

    expect(progressedIncome).toBeGreaterThan(baseIncome);
    expect(businessIncome).toBeGreaterThan(progressedIncome);
  });

  it('commits a base result exactly once even if finish is repeated', () => {
    const state = createNewGameState();
    state.branchLevels = { beak: 30, body: 30, nest: 30, wings: 30, swag: 30, brain: 30 };
    state.mutationIds = ['business'];
    const store = new GameStore(state, () => 1);
    let persistCount = 0;
    const monetization = {
      canShowRewarded: () => false,
      doubleFeatherReward: async () => ({ status: 'unavailable', amount: 0 }),
    } as unknown as MonetizationService;
    const service = new PigeonDropService(store, monetization, () => { persistCount += 1; });
    const context = service.startRun('fixed-run');

    expect(context).not.toBeNull();
    const first = service.finishRun(context!, 25, 8);
    const feathersAfterFirst = store.getSnapshot().feathers;
    const second = service.finishRun(context!, 25, 8);

    expect(first.baseReward).toBeGreaterThan(0);
    expect(second.baseReward).toBe(first.baseReward);
    expect(store.getSnapshot().feathers).toBe(feathersAfterFirst);
    expect(store.getSnapshot().events.pigeonDropRuns).toBe(1);
    expect(persistCount).toBe(1);
  });
});

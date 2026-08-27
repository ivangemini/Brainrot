import { describe, expect, it } from 'vitest';
import { GameStore } from '../src/domain/game-store';
import { createNewGameState } from '../src/domain/game-state';

describe('GameStore', () => {
  it('does not allow an unaffordable upgrade to overdraft currency', () => {
    const store = new GameStore(createNewGameState(), () => 1);
    const result = store.purchase('beak');

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('insufficient');
    expect(store.getSnapshot().feathers).toBe(0);
    expect(store.getSnapshot().branchLevels.beak).toBe(0);
  });

  it('purchases Beak atomically after earning enough Feathers', () => {
    const store = new GameStore(createNewGameState(), () => 1);
    store.addFeathers(15);
    const result = store.purchase('beak');

    expect(result.ok).toBe(true);
    expect(store.getSnapshot().feathers).toBe(0);
    expect(store.getSnapshot().branchLevels.beak).toBe(1);
  });

  it('unlocks Body exactly when total upgrade level reaches 10', () => {
    const state = createNewGameState();
    state.feathers = 1_000_000;
    state.branchLevels.beak = 9;
    const store = new GameStore(state, () => 1);

    expect(store.purchase('body').reason).toBe('locked');
    expect(store.purchase('beak').ok).toBe(true);
    expect(store.purchase('body').ok).toBe(true);
  });

  it('credits deterministic tap payouts', () => {
    const store = new GameStore(createNewGameState(), () => 1);
    const result = store.tap(1000);
    expect(result.critical).toBe(false);
    expect(result.payout).toBeCloseTo(1, 8);
    expect(store.getSnapshot().feathers).toBeCloseTo(1, 8);
  });

  it('applies a rewarded transaction exactly once', () => {
    const store = new GameStore(createNewGameState(), () => 1);

    const first = store.applyRewardOnce('offline:1', 40);
    const duplicate = store.applyRewardOnce('offline:1', 40);

    expect(first.applied).toBe(true);
    expect(duplicate.applied).toBe(false);
    expect(duplicate.reason).toBe('duplicate');
    expect(store.getSnapshot().feathers).toBe(40);
    expect(store.getSnapshot().appliedRewardIds).toEqual(['offline:1']);
  });

  it('rejects malformed rewarded transactions without mutating state', () => {
    const store = new GameStore(createNewGameState(), () => 1);

    expect(store.applyRewardOnce('   ', 10).reason).toBe('invalid');
    expect(store.applyRewardOnce('valid', -1).reason).toBe('invalid');
    expect(store.getSnapshot().feathers).toBe(0);
    expect(store.getSnapshot().appliedRewardIds).toEqual([]);
  });
});

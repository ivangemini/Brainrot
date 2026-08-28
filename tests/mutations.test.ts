import { describe, expect, it } from 'vitest';
import {
  getComboCap,
  getCritChance,
  getCritMultiplier,
  getEventRewardMultiplier,
  getOfflineEfficiency,
  getPassiveRate,
  getTapPayout,
} from '../src/domain/economy-formulas';
import { GameStore } from '../src/domain/game-store';
import { createNewGameState } from '../src/domain/game-state';
import { loadGame, saveGame } from '../src/persistence/save-service';

class MemoryStorage {
  private readonly map = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  public removeItem(key: string): void {
    this.map.delete(key);
  }
}

describe('Mutation v1', () => {
  it('becomes eligible exactly at Total Upgrade Level 150', () => {
    const state = createNewGameState();
    state.branchLevels.beak = 149;
    const store = new GameStore(state, () => 1);

    expect(store.isMutationEligible()).toBe(false);
    store.addFeathers(1e40);
    expect(store.purchase('beak').ok).toBe(true);
    expect(store.isMutationEligible()).toBe(true);
  });

  it('persists one stable mutation id and makes repeated selection idempotent', () => {
    const state = createNewGameState();
    state.branchLevels.beak = 150;
    const store = new GameStore(state, () => 1);

    const first = store.selectMutation('muscle');
    const duplicate = store.selectMutation('muscle');
    const reroll = store.selectMutation('chaos');

    expect(first.applied).toBe(true);
    expect(duplicate).toEqual({ applied: false, mutationId: 'muscle', reason: 'already-selected' });
    expect(reroll).toEqual({ applied: false, mutationId: 'muscle', reason: 'already-selected' });
    expect(store.getSnapshot().mutationIds).toEqual(['muscle']);
  });

  it('freezes upgrade purchases while an eligible mutation is unresolved', () => {
    const state = createNewGameState();
    state.branchLevels.beak = 150;
    state.feathers = 1e40;
    const store = new GameStore(state, () => 1);

    expect(store.purchase('body').reason).toBe('mutation-required');
    expect(store.selectMutation('business').applied).toBe(true);
    expect(store.purchase('body').ok).toBe(true);
  });

  it('Muscle buffs active tapping and combo without touching passive production', () => {
    const state = createNewGameState();
    state.branchLevels.beak = 20;
    state.branchLevels.nest = 10;
    const levels = state.branchLevels;

    expect(getTapPayout(levels, 1, false, ['muscle']))
      .toBeCloseTo(getTapPayout(levels, 1, false) * 1.35, 10);
    expect(getComboCap(levels, ['muscle']))
      .toBeCloseTo(getComboCap(levels) + 0.15, 10);
    expect(getPassiveRate(levels, ['muscle']))
      .toBeCloseTo(getPassiveRate(levels), 10);
  });

  it('Business buffs passive and offline efficiency without changing active payout', () => {
    const state = createNewGameState();
    state.branchLevels.beak = 20;
    state.branchLevels.nest = 10;
    state.branchLevels.brain = 20;
    const levels = state.branchLevels;

    expect(getPassiveRate(levels, ['business']))
      .toBeCloseTo(getPassiveRate(levels) * 1.35, 10);
    expect(getOfflineEfficiency(levels, ['business']))
      .toBeCloseTo(getOfflineEfficiency(levels) + 0.10, 10);
    expect(getTapPayout(levels, 1, false, ['business']))
      .toBeCloseTo(getTapPayout(levels, 1, false), 10);

    levels.brain = 100;
    expect(getOfflineEfficiency(levels, ['business'])).toBe(0.85);
  });

  it('Chaos applies capped crit and deterministic event reward modifiers', () => {
    const state = createNewGameState();
    state.branchLevels.swag = 100;
    const levels = state.branchLevels;

    expect(getCritChance(levels)).toBe(0.25);
    expect(getCritChance(levels, ['chaos'])).toBe(0.30);
    expect(getCritMultiplier(levels, ['chaos']))
      .toBeCloseTo(getCritMultiplier(levels) * 1.15, 10);
    expect(getEventRewardMultiplier(['chaos'])).toBe(1.15);
  });

  it('round-trips mutation ids and applies Business offline modifiers after reload', () => {
    const storage = new MemoryStorage();
    const state = createNewGameState(1000);
    state.branchLevels.nest = 10;
    state.branchLevels.brain = 20;
    state.mutationIds = ['business'];

    saveGame(state, 1000, storage);
    const loaded = loadGame(2000, storage);
    const expected = getPassiveRate(state.branchLevels, state.mutationIds)
      * getOfflineEfficiency(state.branchLevels, state.mutationIds);

    expect(loaded.state.mutationIds).toEqual(['business']);
    expect(loaded.offlineFeathers).toBeCloseTo(expected, 10);
  });

  it('sanitizes malformed mutation ids without invalidating an older save', () => {
    const storage = new MemoryStorage();
    const state = createNewGameState(1000);
    const payload = {
      ...state,
      mutationIds: ['chaos', 'chaos', 'bogus', 42],
    };
    storage.setItem('pigeon-maxxing:save:v1', JSON.stringify(payload));

    const loaded = loadGame(1000, storage);
    expect(loaded.state.mutationIds).toEqual(['chaos']);
  });
});

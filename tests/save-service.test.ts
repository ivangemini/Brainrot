import { describe, expect, it } from 'vitest';
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

describe('save service', () => {
  it('round-trips a versioned game state including both event progress records', () => {
    const storage = new MemoryStorage();
    const state = createNewGameState(1000);
    state.feathers = 42;
    state.branchLevels.beak = 3;
    state.appliedRewardIds.push('offline:1');
    state.events.breadRushBestScore = 27;
    state.events.breadRushRuns = 2;
    state.events.breadRushCooldownSeconds = 123.5;
    state.events.pigeonDropBestScore = 41;
    state.events.pigeonDropRuns = 3;
    state.events.pigeonDropCooldownSeconds = 88.25;
    state.events.sharedCooldownSeconds = 35;
    state.events.lastEventId = 'pigeon-drop';

    saveGame(state, 2000, storage);
    const loaded = loadGame(2000, storage);

    expect(loaded.state.feathers).toBe(42);
    expect(loaded.state.branchLevels.beak).toBe(3);
    expect(loaded.state.schemaVersion).toBe(1);
    expect(loaded.state.appliedRewardIds).toEqual(['offline:1']);
    expect(loaded.state.events).toEqual({
      breadRushBestScore: 27,
      breadRushRuns: 2,
      breadRushCooldownSeconds: 123.5,
      pigeonDropBestScore: 41,
      pigeonDropRuns: 3,
      pigeonDropCooldownSeconds: 88.25,
      sharedCooldownSeconds: 35,
      lastEventId: 'pigeon-drop',
    });
  });

  it('loads older schema-v1 Bread Rush saves with safe defaults for Pigeon Drop', () => {
    const storage = new MemoryStorage();
    const state = createNewGameState(1000);
    const payload = {
      ...state,
      events: {
        breadRushBestScore: 19,
        breadRushRuns: 4,
        breadRushCooldownSeconds: 15,
      },
      lastSavedAt: 1000,
    };
    storage.setItem('pigeon-maxxing:save:v1', JSON.stringify(payload));

    const loaded = loadGame(1000, storage);

    expect(loaded.state.events).toEqual({
      breadRushBestScore: 19,
      breadRushRuns: 4,
      breadRushCooldownSeconds: 15,
      pigeonDropBestScore: 0,
      pigeonDropRuns: 0,
      pigeonDropCooldownSeconds: 0,
      sharedCooldownSeconds: 0,
      lastEventId: null,
    });
  });

  it('falls back to a clean save when stored JSON is corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem('pigeon-maxxing:save:v1', '{not-json');

    const loaded = loadGame(5000, storage);

    expect(loaded.state.feathers).toBe(0);
    expect(loaded.state.branchLevels.beak).toBe(0);
    expect(loaded.state.appliedRewardIds).toEqual([]);
    expect(loaded.state.events.breadRushRuns).toBe(0);
    expect(loaded.state.events.pigeonDropRuns).toBe(0);
  });

  it('sanitizes duplicate and malformed reward ledger entries', () => {
    const storage = new MemoryStorage();
    const state = createNewGameState(1000);
    const payload = {
      ...state,
      appliedRewardIds: ['ok', 'ok', '', 12, 'also-ok'],
      lastSavedAt: 1000,
    };
    storage.setItem('pigeon-maxxing:save:v1', JSON.stringify(payload));

    const loaded = loadGame(1000, storage);

    expect(loaded.state.appliedRewardIds).toEqual(['ok', 'also-ok']);
  });

  it('sanitizes malformed event progress without invalidating the save', () => {
    const storage = new MemoryStorage();
    const state = createNewGameState(1000);
    const payload = {
      ...state,
      events: {
        breadRushBestScore: -50,
        breadRushRuns: 2.9,
        breadRushCooldownSeconds: -30,
        pigeonDropBestScore: -1,
        pigeonDropRuns: 7.8,
        pigeonDropCooldownSeconds: Number.NaN,
        sharedCooldownSeconds: -9,
        lastEventId: 'not-an-event',
      },
      lastSavedAt: 1000,
    };
    storage.setItem('pigeon-maxxing:save:v1', JSON.stringify(payload));

    const loaded = loadGame(1000, storage);

    expect(loaded.state.events).toEqual({
      breadRushBestScore: 0,
      breadRushRuns: 2,
      breadRushCooldownSeconds: 0,
      pigeonDropBestScore: 0,
      pigeonDropRuns: 7,
      pigeonDropCooldownSeconds: 0,
      sharedCooldownSeconds: 0,
      lastEventId: null,
    });
  });
});

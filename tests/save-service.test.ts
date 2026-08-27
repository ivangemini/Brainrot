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
  it('round-trips a versioned game state', () => {
    const storage = new MemoryStorage();
    const state = createNewGameState(1000);
    state.feathers = 42;
    state.branchLevels.beak = 3;

    saveGame(state, 2000, storage);
    const loaded = loadGame(2000, storage);

    expect(loaded.state.feathers).toBe(42);
    expect(loaded.state.branchLevels.beak).toBe(3);
    expect(loaded.state.schemaVersion).toBe(1);
  });

  it('falls back to a clean save when stored JSON is corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem('pigeon-maxxing:save:v1', '{not-json');

    const loaded = loadGame(5000, storage);

    expect(loaded.state.feathers).toBe(0);
    expect(loaded.state.branchLevels.beak).toBe(0);
  });
});

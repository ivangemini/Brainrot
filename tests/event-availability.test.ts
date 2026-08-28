import { describe, expect, it } from 'vitest';
import { PIGEON_DROP, PIGEON_EVENT_SHARED_COOLDOWN_SECONDS } from '../src/content/event-content';
import { GameStore } from '../src/domain/game-store';
import { createNewGameState } from '../src/domain/game-state';
import { selectEventOffer } from '../src/events/event-availability';

function postMutationState() {
  const state = createNewGameState();
  state.branchLevels = { beak: 30, body: 30, nest: 30, wings: 30, swag: 30, brain: 30 };
  state.mutationIds = ['business'];
  return state;
}

describe('Pigeon Event availability', () => {
  it('prioritizes the new post-Mutation event when both events are ready for the first time', () => {
    expect(selectEventOffer({ breadRush: true, pigeonDrop: true, lastEventId: null })).toBe('pigeon-drop');
  });

  it('alternates away from the last completed event when both are ready', () => {
    expect(selectEventOffer({ breadRush: true, pigeonDrop: true, lastEventId: 'bread-rush' })).toBe('pigeon-drop');
    expect(selectEventOffer({ breadRush: true, pigeonDrop: true, lastEventId: 'pigeon-drop' })).toBe('bread-rush');
  });

  it('applies shared anti-clumping cooldown and preserves per-event cooldowns', () => {
    const store = new GameStore(postMutationState(), () => 1);

    expect(store.isBreadRushAvailable()).toBe(true);
    expect(store.isPigeonDropAvailable()).toBe(true);

    store.recordPigeonDropCompletion(23);
    let state = store.getSnapshot();
    expect(state.events.lastEventId).toBe('pigeon-drop');
    expect(state.events.pigeonDropBestScore).toBe(23);
    expect(state.events.pigeonDropRuns).toBe(1);
    expect(state.events.sharedCooldownSeconds).toBe(PIGEON_EVENT_SHARED_COOLDOWN_SECONDS);
    expect(state.events.pigeonDropCooldownSeconds).toBe(PIGEON_DROP.cooldownActiveSeconds);
    expect(store.isBreadRushAvailable()).toBe(false);
    expect(store.isPigeonDropAvailable()).toBe(false);

    store.tick(PIGEON_EVENT_SHARED_COOLDOWN_SECONDS);
    state = store.getSnapshot();
    expect(state.events.sharedCooldownSeconds).toBe(0);
    expect(store.isBreadRushAvailable()).toBe(true);
    expect(store.isPigeonDropAvailable()).toBe(false);

    store.tick(PIGEON_DROP.cooldownActiveSeconds - PIGEON_EVENT_SHARED_COOLDOWN_SECONDS);
    expect(store.isPigeonDropAvailable()).toBe(true);
    expect(selectEventOffer({
      breadRush: store.isBreadRushAvailable(),
      pigeonDrop: store.isPigeonDropAvailable(),
      lastEventId: store.getSnapshot().events.lastEventId,
    })).toBe('bread-rush');
  });
});

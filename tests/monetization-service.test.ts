import { describe, expect, it } from 'vitest';
import { GameStore } from '../src/domain/game-store';
import { createNewGameState } from '../src/domain/game-state';
import { MonetizationService } from '../src/monetization/monetization-service';
import { GameplayLifecycle } from '../src/platform/gameplay-lifecycle';
import type {
  InterstitialResult,
  PlatformAdapter,
  PlatformCapabilities,
  RewardedAdResult,
} from '../src/platform/platform-adapter';

class FakePlatform implements PlatformAdapter {
  public readonly kind = 'generic-web' as const;
  public readonly gameplaySignals: boolean[] = [];
  public rewardedCalls = 0;

  public constructor(private rewardedResult: RewardedAdResult) {}

  public async initialize(): Promise<void> {}

  public getCapabilities(): PlatformCapabilities {
    return {
      rewardedAds: true,
      interstitialAds: false,
      cloudSave: false,
      gameplayMarkup: true,
    };
  }

  public async signalReady(): Promise<void> {}

  public async setGameplayActive(active: boolean): Promise<void> {
    this.gameplaySignals.push(active);
  }

  public async showRewarded(_placement: string): Promise<RewardedAdResult> {
    this.rewardedCalls += 1;
    return this.rewardedResult;
  }

  public async showInterstitial(_reason: string): Promise<InterstitialResult> {
    return { status: 'unavailable', shown: false };
  }

  public setRewardedResult(result: RewardedAdResult): void {
    this.rewardedResult = result;
  }
}

describe('MonetizationService', () => {
  it('grants a completed offline-double reward once and persists immediately', async () => {
    const platform = new FakePlatform({ status: 'completed', shown: true });
    const lifecycle = new GameplayLifecycle(platform);
    await lifecycle.start();
    const store = new GameStore(createNewGameState());
    let persistCalls = 0;
    const service = new MonetizationService(platform, lifecycle, store, () => {
      persistCalls += 1;
    });

    const first = await service.doubleOfflineReward('offline:1', 75);
    const duplicate = await service.doubleOfflineReward('offline:1', 75);

    expect(first).toEqual({ status: 'rewarded', amount: 75 });
    expect(duplicate).toEqual({ status: 'duplicate', amount: 0 });
    expect(store.getSnapshot().feathers).toBe(75);
    expect(platform.rewardedCalls).toBe(1);
    expect(persistCalls).toBe(1);
    expect(platform.gameplaySignals).toEqual([true, false, true]);
  });

  it('does not grant a reward when the ad closes without reward confirmation', async () => {
    const platform = new FakePlatform({ status: 'closed', shown: true });
    const lifecycle = new GameplayLifecycle(platform);
    await lifecycle.start();
    const store = new GameStore(createNewGameState());
    const service = new MonetizationService(platform, lifecycle, store, () => undefined);

    const result = await service.doubleOfflineReward('offline:2', 90);

    expect(result).toEqual({ status: 'closed', amount: 0 });
    expect(store.getSnapshot().feathers).toBe(0);
    expect(store.hasAppliedReward('offline:2')).toBe(false);
    expect(lifecycle.isActive).toBe(true);
  });
});

describe('GameplayLifecycle', () => {
  it('keeps gameplay paused until every overlapping pause reason is released', async () => {
    const platform = new FakePlatform({ status: 'unavailable', shown: false });
    const lifecycle = new GameplayLifecycle(platform);

    await lifecycle.start();
    await lifecycle.pause('visibility');
    await lifecycle.pause('rewarded-ad');
    await lifecycle.resume('rewarded-ad');

    expect(lifecycle.isActive).toBe(false);
    expect(platform.gameplaySignals).toEqual([true, false]);

    await lifecycle.resume('visibility');
    expect(lifecycle.isActive).toBe(true);
    expect(platform.gameplaySignals).toEqual([true, false, true]);
  });
});

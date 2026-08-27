import type { GameStore } from '../domain/game-store';
import { GameplayLifecycle } from '../platform/gameplay-lifecycle';
import type { PlatformAdapter, RewardedAdStatus } from '../platform/platform-adapter';

export type OfflineDoubleStatus = 'rewarded' | 'duplicate' | 'unavailable' | 'closed' | 'error';

export interface OfflineDoubleResult {
  readonly status: OfflineDoubleStatus;
  readonly amount: number;
}

export class MonetizationService {
  public constructor(
    private readonly platform: PlatformAdapter,
    private readonly lifecycle: GameplayLifecycle,
    private readonly store: GameStore,
    private readonly persistImmediately: () => void,
  ) {}

  public canShowRewarded(): boolean {
    return this.platform.getCapabilities().rewardedAds;
  }

  public async doubleOfflineReward(
    transactionId: string,
    baseOfflineFeathers: number,
  ): Promise<OfflineDoubleResult> {
    if (!Number.isFinite(baseOfflineFeathers) || baseOfflineFeathers <= 0) {
      return { status: 'unavailable', amount: 0 };
    }

    if (this.store.hasAppliedReward(transactionId)) {
      return { status: 'duplicate', amount: 0 };
    }

    if (!this.canShowRewarded()) {
      return { status: 'unavailable', amount: 0 };
    }

    await this.lifecycle.pause('rewarded-ad');
    let adStatus: RewardedAdStatus = 'error';
    try {
      const result = await this.platform.showRewarded('offline-income-double');
      adStatus = result.status;
    } catch (error) {
      console.warn('Rewarded ad call failed.', error);
      adStatus = 'error';
    } finally {
      await this.lifecycle.resume('rewarded-ad');
    }

    if (adStatus !== 'completed') {
      return { status: adStatus, amount: 0 };
    }

    const applied = this.store.applyRewardOnce(transactionId, baseOfflineFeathers);
    if (!applied.applied) {
      return { status: applied.reason === 'duplicate' ? 'duplicate' : 'error', amount: 0 };
    }

    this.persistImmediately();
    return { status: 'rewarded', amount: baseOfflineFeathers };
  }
}

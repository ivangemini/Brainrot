export type PlatformKind = 'generic-web' | 'yandex';

export interface PlatformCapabilities {
  readonly rewardedAds: boolean;
  readonly interstitialAds: boolean;
  readonly cloudSave: boolean;
  readonly gameplayMarkup: boolean;
}

export type RewardedAdStatus = 'completed' | 'closed' | 'unavailable' | 'error';

export interface RewardedAdResult {
  readonly status: RewardedAdStatus;
  readonly shown: boolean;
}

export type InterstitialStatus = 'shown' | 'closed' | 'unavailable' | 'error';

export interface InterstitialResult {
  readonly status: InterstitialStatus;
  readonly shown: boolean;
}

export interface PlatformAdapter {
  readonly kind: PlatformKind;
  initialize(): Promise<void>;
  getCapabilities(): PlatformCapabilities;
  signalReady(): Promise<void>;
  setGameplayActive(active: boolean): Promise<void>;
  showRewarded(placement: string): Promise<RewardedAdResult>;
  showInterstitial(reason: string): Promise<InterstitialResult>;
}

import type {
  InterstitialResult,
  PlatformAdapter,
  PlatformCapabilities,
  RewardedAdResult,
} from './platform-adapter';

const CAPABILITIES: PlatformCapabilities = {
  rewardedAds: false,
  interstitialAds: false,
  cloudSave: false,
  gameplayMarkup: false,
};

export class GenericWebAdapter implements PlatformAdapter {
  public readonly kind = 'generic-web' as const;

  public async initialize(): Promise<void> {}

  public getCapabilities(): PlatformCapabilities {
    return CAPABILITIES;
  }

  public async signalReady(): Promise<void> {}

  public async setGameplayActive(_active: boolean): Promise<void> {}

  public async showRewarded(_placement: string): Promise<RewardedAdResult> {
    return { status: 'unavailable', shown: false };
  }

  public async showInterstitial(_reason: string): Promise<InterstitialResult> {
    return { status: 'unavailable', shown: false };
  }
}

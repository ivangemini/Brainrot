import type {
  InterstitialResult,
  PlatformAdapter,
  PlatformCapabilities,
  RewardedAdResult,
} from './platform-adapter';

interface YandexSdk {
  readonly adv: {
    showRewardedVideo(options: {
      callbacks: {
        onOpen?: () => void;
        onRewarded?: () => void;
        onClose?: (wasShown: boolean) => void;
        onError?: (_error: object) => void;
      };
    }): void;
    showFullscreenAdv(options?: {
      callbacks?: {
        onOpen?: () => void;
        onClose?: (wasShown: boolean) => void;
        onError?: (_error: object) => void;
      };
    }): void;
  };
  readonly features?: {
    readonly LoadingAPI?: { ready(): void };
    readonly GameplayAPI?: { start(): void; stop(): void };
  };
}

interface YandexGamesGlobal {
  init(): Promise<YandexSdk>;
}

const ENABLED_CAPABILITIES: PlatformCapabilities = {
  rewardedAds: true,
  interstitialAds: true,
  cloudSave: false,
  gameplayMarkup: true,
};

const DISABLED_CAPABILITIES: PlatformCapabilities = {
  rewardedAds: false,
  interstitialAds: false,
  cloudSave: false,
  gameplayMarkup: false,
};

export class YandexAdapter implements PlatformAdapter {
  public readonly kind = 'yandex' as const;
  private sdk?: YandexSdk;

  public async initialize(): Promise<void> {
    if (this.sdk) return;

    try {
      const api = getYandexGlobal() ?? await loadYandexSdkScript();
      this.sdk = await api.init();
    } catch (error) {
      console.warn('Yandex Games SDK unavailable; continuing in degraded mode.', error);
      this.sdk = undefined;
    }
  }

  public getCapabilities(): PlatformCapabilities {
    return this.sdk ? ENABLED_CAPABILITIES : DISABLED_CAPABILITIES;
  }

  public async signalReady(): Promise<void> {
    this.sdk?.features?.LoadingAPI?.ready();
  }

  public async setGameplayActive(active: boolean): Promise<void> {
    const gameplay = this.sdk?.features?.GameplayAPI;
    if (!gameplay) return;
    if (active) gameplay.start();
    else gameplay.stop();
  }

  public async showRewarded(_placement: string): Promise<RewardedAdResult> {
    if (!this.sdk) return { status: 'unavailable', shown: false };

    return await new Promise<RewardedAdResult>((resolve) => {
      let settled = false;
      let shown = false;
      let rewarded = false;

      const finish = (result: RewardedAdResult): void => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      try {
        this.sdk!.adv.showRewardedVideo({
          callbacks: {
            onOpen: () => {
              shown = true;
            },
            onRewarded: () => {
              rewarded = true;
            },
            onClose: (wasShown) => {
              finish({
                status: rewarded ? 'completed' : wasShown ? 'closed' : 'unavailable',
                shown: shown || wasShown,
              });
            },
            onError: () => finish({ status: 'error', shown }),
          },
        });
      } catch {
        finish({ status: 'error', shown });
      }
    });
  }

  public async showInterstitial(_reason: string): Promise<InterstitialResult> {
    if (!this.sdk) return { status: 'unavailable', shown: false };

    return await new Promise<InterstitialResult>((resolve) => {
      let settled = false;
      let shown = false;

      const finish = (result: InterstitialResult): void => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      try {
        this.sdk!.adv.showFullscreenAdv({
          callbacks: {
            onOpen: () => {
              shown = true;
            },
            onClose: (wasShown) => finish({
              status: wasShown ? 'closed' : 'unavailable',
              shown: shown || wasShown,
            }),
            onError: () => finish({ status: 'error', shown }),
          },
        });
      } catch {
        finish({ status: 'error', shown });
      }
    });
  }
}

export function shouldUseYandexAdapter(locationLike: Pick<Location, 'hostname' | 'search'> = window.location): boolean {
  const params = new URLSearchParams(locationLike.search);
  return Boolean(getYandexGlobal())
    || params.get('platform') === 'yandex'
    || locationLike.hostname.toLowerCase().includes('yandex');
}

function getYandexGlobal(): YandexGamesGlobal | undefined {
  return (globalThis as typeof globalThis & { YaGames?: YandexGamesGlobal }).YaGames;
}

async function loadYandexSdkScript(): Promise<YandexGamesGlobal> {
  const existing = document.querySelector<HTMLScriptElement>('script[data-pigeon-yandex-sdk]');
  if (existing) {
    await waitForScript(existing);
    const api = getYandexGlobal();
    if (!api) throw new Error('Yandex SDK script loaded without YaGames global.');
    return api;
  }

  const script = document.createElement('script');
  script.src = '/sdk.js';
  script.async = true;
  script.dataset.pigeonYandexSdk = 'true';
  document.head.append(script);
  await waitForScript(script);

  const api = getYandexGlobal();
  if (!api) throw new Error('Yandex SDK script loaded without YaGames global.');
  return api;
}

function waitForScript(script: HTMLScriptElement): Promise<void> {
  if (getYandexGlobal()) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const onLoad = (): void => {
      cleanup();
      resolve();
    };
    const onError = (): void => {
      cleanup();
      reject(new Error('Failed to load Yandex Games SDK.'));
    };
    const cleanup = (): void => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
    };

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
  });
}

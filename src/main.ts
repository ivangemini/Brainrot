import './styles.css';
import './reward.css';
import './bread-rush.css';
import { GameStore } from './domain/game-store';
import { BreadRushService, type BreadRushResult, type BreadRushRunContext } from './events/bread-rush-service';
import { MonetizationService } from './monetization/monetization-service';
import { loadGame, saveGame } from './persistence/save-service';
import { createPlatformAdapter } from './platform/create-platform-adapter';
import { GameplayLifecycle } from './platform/gameplay-lifecycle';
import { BreadRushScene } from './presentation/bread-rush-scene';
import { createPhaserGame } from './presentation/create-phaser-game';
import { createBreadRushUi } from './ui/bread-rush-ui';
import { createUiShell } from './ui/ui-shell';

void bootstrap().catch((error) => {
  console.error('Pigeon Maxxing failed to boot.', error);
  const uiHost = document.querySelector<HTMLElement>('#game-ui');
  if (uiHost) uiHost.textContent = 'The pigeon failed to wake up. Reload to try again.';
});

async function bootstrap(): Promise<void> {
  const canvasHost = document.querySelector<HTMLElement>('#game-canvas');
  const uiHost = document.querySelector<HTMLElement>('#game-ui');
  if (!canvasHost || !uiHost) throw new Error('Game mount points are missing.');

  const platform = createPlatformAdapter();
  await platform.initialize();

  const loaded = loadGame();
  const store = new GameStore(loaded.state);
  if (loaded.offlineFeathers > 0) store.addFeathers(loaded.offlineFeathers);

  const lifecycle = new GameplayLifecycle(platform);
  const persist = (): void => {
    const now = Date.now();
    store.markSaved(now);
    saveGame(store.getSnapshot(), now);
  };
  const monetization = new MonetizationService(platform, lifecycle, store, persist);
  const breadRushService = new BreadRushService(store, monetization, persist);

  let resolveSceneReady!: () => void;
  const sceneReady = new Promise<void>((resolve) => {
    resolveSceneReady = resolve;
  });

  const game = createPhaserGame('game-canvas', store, resolveSceneReady);
  const breadRushScene = new BreadRushScene(store, () => lifecycle.isActive);
  game.scene.add('BreadRushScene', breadRushScene, false);
  const ui = createUiShell(uiHost, store);
  const breadRushUi = createBreadRushUi(uiHost);

  await sceneReady;
  await platform.signalReady();
  await lifecycle.start();

  if (document.visibilityState === 'hidden') {
    await lifecycle.pause('visibility');
  }

  const offlineTransactionId = [
    'offline-double-v1',
    loaded.state.saveRevision,
    loaded.state.lastSavedAt,
  ].join(':');

  ui.showOfflineReward({
    amount: loaded.offlineFeathers,
    seconds: loaded.elapsedSeconds,
    canDouble: monetization.canShowRewarded() && !store.hasAppliedReward(offlineTransactionId),
    onDouble: () => monetization.doubleOfflineReward(offlineTransactionId, loaded.offlineFeathers),
  });

  let eventMode: 'idle' | 'active' | 'result' = 'idle';
  let activeRun: BreadRushRunContext | null = null;
  let activeResult: BreadRushResult | null = null;
  let lastFrame = performance.now();
  let simulationAccumulator = 0;
  let saveAccumulator = 0;
  let offerAccumulator = 0;
  let disposed = false;
  let frameRequest = 0;

  const continueFromBreadRush = (): void => {
    if (eventMode === 'idle') return;
    eventMode = 'idle';
    activeRun = null;
    activeResult = null;
    breadRushUi.hideEvent();
    game.scene.stop('BreadRushScene');
    game.scene.wake('MainScene');
    lastFrame = performance.now();
    simulationAccumulator = 0;
    syncEventOffer();
  };

  const showBreadRushResult = (result: BreadRushResult): void => {
    activeResult = result;
    eventMode = 'result';
    breadRushUi.showResult(
      result,
      breadRushService.canDouble(result),
      () => breadRushService.doubleResult(result),
      continueFromBreadRush,
    );
  };

  const startBreadRush = (): void => {
    if (eventMode !== 'idle') return;
    const context = breadRushService.startRun();
    if (!context) {
      syncEventOffer();
      return;
    }

    activeRun = context;
    activeResult = null;
    eventMode = 'active';
    breadRushUi.hideOffer();
    breadRushUi.showActive();
    game.scene.sleep('MainScene');
    breadRushScene.configure({
      onSnapshot: (snapshot) => breadRushUi.updateActive(snapshot),
      onComplete: (snapshot) => {
        if (eventMode !== 'active' || !activeRun) return;
        showBreadRushResult(breadRushService.finishRun(activeRun, snapshot.score));
      },
    });
    game.scene.start('BreadRushScene');
    lastFrame = performance.now();
    simulationAccumulator = 0;
  };

  function syncEventOffer(): void {
    if (eventMode === 'idle' && breadRushService.isAvailable()) {
      breadRushUi.showOffer(startBreadRush);
    } else {
      breadRushUi.hideOffer();
    }
  }

  syncEventOffer();

  const frame = (now: number): void => {
    if (disposed) return;
    const frameDelta = Math.min(0.25, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;

    if (lifecycle.isActive) {
      saveAccumulator += frameDelta;
      offerAccumulator += frameDelta;

      if (eventMode === 'idle') {
        simulationAccumulator += frameDelta;
        if (simulationAccumulator >= 0.1) {
          store.tick(simulationAccumulator, now);
          simulationAccumulator = 0;
        }
      } else if (eventMode === 'active') {
        simulationAccumulator = 0;
        breadRushScene.advanceActiveTime(frameDelta);
      } else {
        simulationAccumulator = 0;
      }

      if (offerAccumulator >= 0.5) {
        offerAccumulator = 0;
        syncEventOffer();
      }

      if (saveAccumulator >= 5) {
        persist();
        saveAccumulator = 0;
      }
    } else {
      simulationAccumulator = 0;
    }

    frameRequest = requestAnimationFrame(frame);
  };

  frameRequest = requestAnimationFrame(frame);

  const onPageHide = (): void => persist();
  const onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      persist();
      void lifecycle.pause('visibility');
    } else {
      lastFrame = performance.now();
      void lifecycle.resume('visibility');
    }
  };

  window.addEventListener('pagehide', onPageHide);
  document.addEventListener('visibilitychange', onVisibilityChange);

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      disposed = true;
      cancelAnimationFrame(frameRequest);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      persist();
      breadRushUi.destroy();
      ui.destroy();
      game.destroy(true);
    });
  }
}

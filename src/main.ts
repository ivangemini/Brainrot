import './styles.css';
import './reward.css';
import './bread-rush.css';
import './mutation.css';
import { GameStore } from './domain/game-store';
import { BreadRushService, type BreadRushResult, type BreadRushRunContext } from './events/bread-rush-service';
import { MonetizationService } from './monetization/monetization-service';
import { loadGame, saveGame } from './persistence/save-service';
import { createPlatformAdapter } from './platform/create-platform-adapter';
import { GameplayLifecycle } from './platform/gameplay-lifecycle';
import { BreadRushScene } from './presentation/bread-rush-scene';
import { createPhaserGame } from './presentation/create-phaser-game';
import { createBreadRushUi } from './ui/bread-rush-ui';
import { createMutationUi } from './ui/mutation-ui';
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
  const mutationUi = createMutationUi(uiHost);

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
  let mutationOfferTimer = 0;
  let mutationPauseActive = false;
  let previousMutationEligible = store.isMutationEligible();

  const resetSimulationClock = (): void => {
    lastFrame = performance.now();
    simulationAccumulator = 0;
  };

  const continueFromBreadRush = (): void => {
    if (eventMode === 'idle') return;
    eventMode = 'idle';
    activeRun = null;
    activeResult = null;
    breadRushUi.hideEvent();
    game.scene.stop('BreadRushScene');
    game.scene.wake('MainScene');
    resetSimulationClock();
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
    if (eventMode !== 'idle' || store.isMutationEligible() || mutationUi.isVisible()) return;
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
    resetSimulationClock();
  };

  function syncEventOffer(): void {
    if (
      eventMode === 'idle'
      && !store.isMutationEligible()
      && !mutationUi.isVisible()
      && breadRushService.isAvailable()
    ) {
      breadRushUi.showOffer(startBreadRush);
    } else {
      breadRushUi.hideOffer();
    }
  }

  const showMutationChoice = async (): Promise<void> => {
    mutationOfferTimer = 0;
    if (disposed || eventMode !== 'idle' || mutationUi.isVisible() || !store.isMutationEligible()) return;

    breadRushUi.hideOffer();
    mutationPauseActive = true;
    await lifecycle.pause('mutation-choice');
    mutationUi.showChoice({
      onSelect: (mutationId) => {
        const result = store.selectMutation(mutationId);
        const accepted = result.applied
          || (result.reason === 'already-selected' && result.mutationId === mutationId);
        if (accepted) persist();
        return accepted;
      },
      onResolved: async () => {
        if (!mutationPauseActive) return;
        mutationPauseActive = false;
        await lifecycle.resume('mutation-choice');
        resetSimulationClock();
        syncEventOffer();
      },
    });
  };

  const scheduleMutationChoice = (delayMs: number): void => {
    if (mutationOfferTimer || mutationUi.isVisible() || !store.isMutationEligible()) return;
    breadRushUi.hideOffer();
    mutationOfferTimer = window.setTimeout(() => void showMutationChoice(), delayMs);
  };

  const unsubscribeMutationWatcher = store.subscribe((state) => {
    const eligible = store.isMutationEligible(state);
    if (eligible && !previousMutationEligible) {
      // Growth ceremony owns the first beat when level 150 is crossed.
      scheduleMutationChoice(1350);
    } else if (!eligible && mutationOfferTimer) {
      window.clearTimeout(mutationOfferTimer);
      mutationOfferTimer = 0;
    }
    previousMutationEligible = eligible;
  });

  if (previousMutationEligible) {
    // A refresh on an unresolved choice returns to the decision safely.
    scheduleMutationChoice(450);
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
      resetSimulationClock();
      void lifecycle.resume('visibility');
    }
  };

  window.addEventListener('pagehide', onPageHide);
  document.addEventListener('visibilitychange', onVisibilityChange);

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      disposed = true;
      cancelAnimationFrame(frameRequest);
      if (mutationOfferTimer) window.clearTimeout(mutationOfferTimer);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      unsubscribeMutationWatcher();
      persist();
      mutationUi.destroy();
      breadRushUi.destroy();
      ui.destroy();
      game.destroy(true);
    });
  }
}

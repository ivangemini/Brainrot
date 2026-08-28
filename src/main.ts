import './styles.css';
import './reward.css';
import './bread-rush.css';
import './pigeon-drop.css';
import './mutation.css';
import type { PigeonEventId } from './content/event-content';
import { GameStore } from './domain/game-store';
import { BreadRushService, type BreadRushResult, type BreadRushRunContext } from './events/bread-rush-service';
import { selectEventOffer } from './events/event-availability';
import { PigeonDropService, type PigeonDropResult, type PigeonDropRunContext } from './events/pigeon-drop-service';
import { MonetizationService } from './monetization/monetization-service';
import { loadGame, saveGame } from './persistence/save-service';
import { createPlatformAdapter } from './platform/create-platform-adapter';
import { GameplayLifecycle } from './platform/gameplay-lifecycle';
import { BreadRushScene } from './presentation/bread-rush-scene';
import { createPhaserGame } from './presentation/create-phaser-game';
import { PigeonDropScene } from './presentation/pigeon-drop-scene';
import { createBreadRushUi } from './ui/bread-rush-ui';
import { createMutationUi } from './ui/mutation-ui';
import { createPigeonDropUi } from './ui/pigeon-drop-ui';
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
  const pigeonDropService = new PigeonDropService(store, monetization, persist);

  let resolveSceneReady!: () => void;
  const sceneReady = new Promise<void>((resolve) => {
    resolveSceneReady = resolve;
  });

  const game = createPhaserGame('game-canvas', store, resolveSceneReady);
  const breadRushScene = new BreadRushScene(store, () => lifecycle.isActive);
  const pigeonDropScene = new PigeonDropScene(store, () => lifecycle.isActive);
  game.scene.add('BreadRushScene', breadRushScene, false);
  game.scene.add('PigeonDropScene', pigeonDropScene, false);
  const ui = createUiShell(uiHost, store);
  const breadRushUi = createBreadRushUi(uiHost);
  const pigeonDropUi = createPigeonDropUi(uiHost);
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
  let activeEventId: PigeonEventId | null = null;
  let breadRushRun: BreadRushRunContext | null = null;
  let pigeonDropRun: PigeonDropRunContext | null = null;
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

  const hideEventOffers = (): void => {
    breadRushUi.hideOffer();
    pigeonDropUi.hideOffer();
  };

  const continueFromEvent = (eventId: PigeonEventId): void => {
    if (eventMode === 'idle' || activeEventId !== eventId) return;
    eventMode = 'idle';
    activeEventId = null;
    breadRushRun = null;
    pigeonDropRun = null;
    if (eventId === 'bread-rush') {
      breadRushUi.hideEvent();
      game.scene.stop('BreadRushScene');
    } else {
      pigeonDropUi.hideEvent();
      game.scene.stop('PigeonDropScene');
    }
    game.scene.wake('MainScene');
    resetSimulationClock();
    syncEventOffer();
  };

  const showBreadRushResult = (result: BreadRushResult): void => {
    eventMode = 'result';
    breadRushUi.showResult(
      result,
      breadRushService.canDouble(result),
      () => breadRushService.doubleResult(result),
      () => continueFromEvent('bread-rush'),
    );
  };

  const showPigeonDropResult = (result: PigeonDropResult): void => {
    eventMode = 'result';
    pigeonDropUi.showResult(
      result,
      pigeonDropService.canDouble(result),
      () => pigeonDropService.doubleResult(result),
      () => continueFromEvent('pigeon-drop'),
    );
  };

  const startBreadRush = (): void => {
    if (eventMode !== 'idle' || store.isMutationEligible() || mutationUi.isVisible()) return;
    const context = breadRushService.startRun();
    if (!context) {
      syncEventOffer();
      return;
    }

    breadRushRun = context;
    activeEventId = 'bread-rush';
    eventMode = 'active';
    hideEventOffers();
    breadRushUi.showActive();
    game.scene.sleep('MainScene');
    breadRushScene.configure({
      onSnapshot: (snapshot) => breadRushUi.updateActive(snapshot),
      onComplete: (snapshot) => {
        if (eventMode !== 'active' || activeEventId !== 'bread-rush' || !breadRushRun) return;
        showBreadRushResult(breadRushService.finishRun(breadRushRun, snapshot.score));
      },
    });
    game.scene.start('BreadRushScene');
    resetSimulationClock();
  };

  const startPigeonDrop = (): void => {
    if (eventMode !== 'idle' || store.isMutationEligible() || mutationUi.isVisible()) return;
    const context = pigeonDropService.startRun();
    if (!context) {
      syncEventOffer();
      return;
    }

    pigeonDropRun = context;
    activeEventId = 'pigeon-drop';
    eventMode = 'active';
    hideEventOffers();
    pigeonDropUi.showActive(() => pigeonDropScene.requestDrop());
    game.scene.sleep('MainScene');
    pigeonDropScene.configure({
      onSnapshot: (snapshot) => pigeonDropUi.updateActive(snapshot),
      onComplete: (snapshot) => {
        if (eventMode !== 'active' || activeEventId !== 'pigeon-drop' || !pigeonDropRun) return;
        showPigeonDropResult(pigeonDropService.finishRun(pigeonDropRun, snapshot.score, snapshot.attempts));
      },
    });
    game.scene.start('PigeonDropScene');
    resetSimulationClock();
  };

  function syncEventOffer(): void {
    hideEventOffers();
    if (eventMode !== 'idle' || store.isMutationEligible() || mutationUi.isVisible()) return;

    const state = store.getSnapshot();
    const eventId = selectEventOffer({
      breadRush: breadRushService.isAvailable(state),
      pigeonDrop: pigeonDropService.isAvailable(state),
      lastEventId: state.events.lastEventId,
    });

    if (eventId === 'bread-rush') breadRushUi.showOffer(startBreadRush);
    if (eventId === 'pigeon-drop') pigeonDropUi.showOffer(startPigeonDrop);
  }

  const showMutationChoice = async (): Promise<void> => {
    mutationOfferTimer = 0;
    if (disposed || eventMode !== 'idle' || mutationUi.isVisible() || !store.isMutationEligible()) return;

    hideEventOffers();
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
    hideEventOffers();
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
        if (activeEventId === 'bread-rush') breadRushScene.advanceActiveTime(frameDelta);
        if (activeEventId === 'pigeon-drop') pigeonDropScene.advanceActiveTime(frameDelta);
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
      pigeonDropUi.destroy();
      breadRushUi.destroy();
      ui.destroy();
      game.destroy(true);
    });
  }
}

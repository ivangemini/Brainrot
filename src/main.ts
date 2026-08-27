import './styles.css';
import { GameStore } from './domain/game-store';
import { loadGame, saveGame } from './persistence/save-service';
import { createPhaserGame } from './presentation/create-phaser-game';
import { createUiShell } from './ui/ui-shell';

const canvasHost = document.querySelector<HTMLElement>('#game-canvas');
const uiHost = document.querySelector<HTMLElement>('#game-ui');

if (!canvasHost || !uiHost) throw new Error('Game mount points are missing.');

const loaded = loadGame();
const store = new GameStore(loaded.state);
if (loaded.offlineFeathers > 0) store.addFeathers(loaded.offlineFeathers);

const game = createPhaserGame('game-canvas', store);
const ui = createUiShell(uiHost, store);
ui.showOfflineReward(loaded.offlineFeathers, loaded.elapsedSeconds);

let lastFrame = performance.now();
let simulationAccumulator = 0;
let saveAccumulator = 0;

function frame(now: number): void {
  const frameDelta = Math.min(0.25, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  simulationAccumulator += frameDelta;
  saveAccumulator += frameDelta;

  if (simulationAccumulator >= 0.1) {
    store.tick(simulationAccumulator, now);
    simulationAccumulator = 0;
  }

  if (saveAccumulator >= 5) {
    persist();
    saveAccumulator = 0;
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

function persist(): void {
  const now = Date.now();
  store.markSaved(now);
  saveGame(store.getSnapshot(), now);
}

window.addEventListener('pagehide', persist);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') persist();
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    persist();
    ui.destroy();
    game.destroy(true);
  });
}

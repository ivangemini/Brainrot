import Phaser from 'phaser';
import { MEME_PIGEON_HERO_DATA_URL } from '../assets/meme-pigeon/hero-data';
import { getGrowthStage, getTotalUpgradeLevel, type BranchLevels } from '../domain/economy-formulas';
import type { GameStore, TapResult } from '../domain/game-store';
import type { GameState } from '../domain/game-state';
import {
  getHeroSafeRect,
  getMemePigeonFocalPosition,
  getMemePigeonScenePlacement,
  rectContainsBounds,
} from './hero-layout';

const HERO_TEXTURE = 'meme-pigeon-hero';
const BACKGROUND_TEXTURE = 'meme-pigeon-background';

export class MainScene extends Phaser.Scene {
  private readonly store: GameStore;
  private readonly onReady: (() => void) | undefined;
  private hero?: Phaser.GameObjects.Image;
  private background?: Phaser.GameObjects.Image;
  private tapBurst?: Phaser.GameObjects.Image;
  private lastState?: Readonly<GameState>;
  private unsubscribe?: () => void;
  private lastGrowthStage = 0;
  private heroBaseScale = 1;
  private readySignaled = false;
  private readonly onResize = (): void => this.layout();

  public constructor(store: GameStore, onReady?: () => void) {
    super({ key: 'MainScene' });
    this.store = store;
    this.onReady = onReady;
  }

  public preload(): void {
    this.load.image(HERO_TEXTURE, MEME_PIGEON_HERO_DATA_URL);
    this.load.image(BACKGROUND_TEXTURE, MEME_PIGEON_HERO_DATA_URL);
    this.load.image('tap-burst', '/assets/ui/tap_burst.png');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#071b23');
    this.background = this.add.image(0, 0, BACKGROUND_TEXTURE)
      .setOrigin(0.5)
      .setDepth(-20)
      .setTint(0x7f9794)
      .setAlpha(0.78);
    this.hero = this.add.image(0, 0, HERO_TEXTURE).setOrigin(0.5).setDepth(0);
    this.tapBurst = this.add.image(0, 0, 'tap-burst').setAlpha(0).setScale(0.5).setDepth(100);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isPointerOnPigeon(pointer.x, pointer.y)) return;
      const result = this.store.tap(performance.now());
      this.playTapFeedback(pointer.x, pointer.y, result);
    });

    this.scale.on('resize', this.onResize);
    this.layout();

    this.unsubscribe = this.store.subscribe((state) => this.renderState(state));
    this.events.once('shutdown', () => {
      this.unsubscribe?.();
      this.scale.off('resize', this.onResize);
    });
    this.signalReady();
  }

  private signalReady(): void {
    if (this.readySignaled) return;
    this.readySignaled = true;
    this.onReady?.();
  }

  private layout(): void {
    if (!this.hero || !this.background) return;
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const stageId = this.lastState
      ? getGrowthStage(getTotalUpgradeLevel(this.lastState.branchLevels)).id
      : 0;

    const backgroundScale = Math.max(width / this.background.width, height / this.background.height) * 1.04;
    const backgroundPosition = getMemePigeonFocalPosition(
      width,
      height,
      this.background.width,
      this.background.height,
      backgroundScale,
    );
    this.background.setPosition(backgroundPosition.x, backgroundPosition.y).setScale(backgroundScale);

    const placement = getMemePigeonScenePlacement(width, height, this.hero.width, this.hero.height, stageId);
    this.heroBaseScale = placement.scale;
    this.hero.setPosition(placement.x, placement.y).setScale(this.heroBaseScale).setAngle(0);

    const safeRect = getHeroSafeRect(width, height);
    this.game.canvas.dataset.heroSafe = String(rectContainsBounds(safeRect, placement.silhouetteBounds, 2));
    this.game.canvas.dataset.heroCentered = String(
      Math.abs(placement.silhouetteBounds.x + placement.silhouetteBounds.width / 2 - centerX) <= 1
      && Math.abs(placement.silhouetteBounds.y + placement.silhouetteBounds.height / 2 - centerY) <= 1,
    );
  }

  private renderState(state: Readonly<GameState>): void {
    const previousStage = this.lastGrowthStage;
    const total = getTotalUpgradeLevel(state.branchLevels);
    const stage = getGrowthStage(total);
    this.lastGrowthStage = stage.id;
    this.lastState = state;
    this.applyVisualState(state.branchLevels);

    if (stage.id > previousStage && (previousStage !== 0 || total >= 10)) {
      this.playGrowthCeremony(stage.name);
    }
  }

  private applyVisualState(_levels: BranchLevels): void {
    this.layout();
  }

  private isPointerOnPigeon(x: number, y: number): boolean {
    if (!this.hero) return false;
    const placement = getMemePigeonScenePlacement(
      this.scale.width,
      this.scale.height,
      this.hero.width,
      this.hero.height,
      this.lastGrowthStage,
    );
    const bounds = placement.silhouetteBounds;
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height * 0.53;
    const radiusX = bounds.width * 0.48;
    const radiusY = bounds.height * 0.49;
    const dx = (x - centerX) / radiusX;
    const dy = (y - centerY) / radiusY;
    return dx * dx + dy * dy <= 1;
  }

  private playTapFeedback(x: number, y: number, result: TapResult): void {
    if (!this.hero || !this.tapBurst) return;

    this.cameras.main.shake(result.critical ? 90 : 55, result.critical ? 0.0014 : 0.00065);
    this.tapBurst
      .setPosition(x, y)
      .setAlpha(result.critical ? 1 : 0.72)
      .setScale(result.critical ? 0.8 : 0.5);
    this.tweens.killTweensOf(this.tapBurst);
    this.tweens.add({
      targets: this.tapBurst,
      alpha: 0,
      scale: result.critical ? 1.4 : 0.9,
      duration: 260,
      ease: 'Quad.Out',
    });

    this.tweens.killTweensOf(this.hero);
    this.tweens.add({
      targets: this.hero,
      scaleX: this.heroBaseScale * 1.018,
      scaleY: this.heroBaseScale * 0.982,
      duration: 64,
      yoyo: true,
      ease: 'Quad.Out',
      onComplete: () => this.layout(),
    });

    const text = this.add.text(
      x,
      y - 28,
      `${result.critical ? 'CRIT ' : '+'}${result.payout >= 100 ? result.payout.toFixed(0) : result.payout.toFixed(1)}`,
      {
        fontFamily: 'system-ui, sans-serif',
        fontSize: result.critical ? '30px' : '22px',
        fontStyle: 'bold',
        color: result.critical ? '#f36a62' : '#f2c84b',
        stroke: '#071b23',
        strokeThickness: 5,
      },
    ).setOrigin(0.5).setDepth(120);

    this.tweens.add({
      targets: text,
      y: y - 90,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.Out',
      onComplete: () => text.destroy(),
    });
  }

  private playGrowthCeremony(stageName: string): void {
    if (!this.hero) return;
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.shake(240, 0.004);
    this.cameras.main.flash(180, 92, 196, 232, false);
    this.tweens.killTweensOf(this.hero);
    this.tweens.add({
      targets: this.hero,
      scaleX: this.heroBaseScale * 1.025,
      scaleY: this.heroBaseScale * 1.025,
      duration: 180,
      yoyo: true,
      ease: 'Quad.Out',
      onComplete: () => this.layout(),
    });

    const label = this.add.text(width / 2, height * 0.24, stageName.toUpperCase(), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: height > width ? '28px' : '36px',
      fontStyle: 'bold',
      color: '#f5f1e8',
      stroke: '#071b23',
      strokeThickness: 8,
      align: 'center',
    }).setOrigin(0.5).setDepth(150).setAlpha(0);

    this.tweens.add({
      targets: label,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.7, to: 1 },
      duration: 180,
      yoyo: true,
      hold: 650,
      onComplete: () => label.destroy(),
    });
  }
}

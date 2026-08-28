import Phaser from 'phaser';
import { MUTATION_DEFINITIONS, MUTATION_ORDER, type MutationId } from '../content/mutation-content';
import { getGrowthStage, getTotalUpgradeLevel } from '../domain/economy-formulas';
import type { GameStore, TapResult } from '../domain/game-store';
import type { GameState } from '../domain/game-state';

const HERO_TEXTURE = 'generated-main-hero';
const HERO_PATH = '/assets/generated/main_scene_hero.webp';
const MUTATION_TEXTURE_PREFIX = 'generated-mutation-';

export class MainScene extends Phaser.Scene {
  private readonly store: GameStore;
  private readonly onReady: (() => void) | undefined;
  private hero?: Phaser.GameObjects.Image;
  private mutationLayer?: Phaser.GameObjects.Image;
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
    this.load.image(HERO_TEXTURE, HERO_PATH);
    for (const mutationId of MUTATION_ORDER) {
      this.load.image(`${MUTATION_TEXTURE_PREFIX}${mutationId}`, MUTATION_DEFINITIONS[mutationId].art);
    }
    this.load.image('tap-burst', '/assets/ui/tap_burst.png');
  }

  public create(): void {
    this.hero = this.add.image(0, 0, HERO_TEXTURE).setOrigin(0.5).setDepth(0);
    this.mutationLayer = this.add
      .image(0, 0, `${MUTATION_TEXTURE_PREFIX}muscle`)
      .setOrigin(0.5)
      .setDepth(5)
      .setAlpha(0);
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
    if (!this.hero) return;
    const width = this.scale.width;
    const height = this.scale.height;
    const portrait = height > width;
    const sceneWidth = portrait ? width : width * 0.77;
    const sceneHeight = portrait ? height * 0.68 : height;
    const stageId = this.lastState
      ? getGrowthStage(getTotalUpgradeLevel(this.lastState.branchLevels)).id
      : 0;
    const growthZoom = 1 + Math.min(stageId, 6) * 0.018;
    const coverScale = Math.max(sceneWidth / this.hero.width, sceneHeight / this.hero.height);

    this.heroBaseScale = coverScale * growthZoom;
    this.hero
      .setPosition(sceneWidth / 2, sceneHeight / 2)
      .setScale(this.heroBaseScale)
      .setAngle(0);

    if (this.mutationLayer) {
      this.mutationLayer
        .setPosition(this.hero.x, this.hero.y)
        .setScale(this.heroBaseScale)
        .setAngle(0);
    }
  }

  private renderState(state: Readonly<GameState>): void {
    const previousStage = this.lastGrowthStage;
    const previousMutation = this.lastState?.mutationIds.at(-1);
    const total = getTotalUpgradeLevel(state.branchLevels);
    const stage = getGrowthStage(total);
    const currentMutation = state.mutationIds.at(-1);
    this.lastGrowthStage = stage.id;
    this.lastState = state;
    this.applyVisualState(currentMutation);

    if (stage.id > previousStage && (previousStage !== 0 || total >= 10)) {
      this.playGrowthCeremony(stage.name);
    }

    if (currentMutation && currentMutation !== previousMutation) {
      this.playMutationReveal(currentMutation);
    }
  }

  private applyVisualState(mutationId: MutationId | undefined): void {
    this.layout();
    if (!this.mutationLayer) return;
    if (!mutationId) {
      this.mutationLayer.setAlpha(0);
      return;
    }
    this.mutationLayer
      .setTexture(`${MUTATION_TEXTURE_PREFIX}${mutationId}`)
      .setAlpha(1);
  }

  private isPointerOnPigeon(x: number, y: number): boolean {
    if (!this.hero) return false;
    const pigeonCenterX = this.hero.x + this.hero.displayWidth * 0.035;
    const pigeonCenterY = this.hero.y + this.hero.displayHeight * 0.045;
    const radiusX = this.hero.displayWidth * 0.31;
    const radiusY = this.hero.displayHeight * 0.42;
    const dx = (x - pigeonCenterX) / radiusX;
    const dy = (y - pigeonCenterY) / radiusY;
    return dx * dx + dy * dy <= 1;
  }

  private playTapFeedback(x: number, y: number, result: TapResult): void {
    if (!this.hero || !this.tapBurst) return;
    const mutation = this.lastState?.mutationIds.at(-1);
    const muscleImpact = mutation === 'muscle' ? 1.35 : 1;
    const chaosImpact = mutation === 'chaos' && result.critical ? 1.25 : 1;

    this.cameras.main.shake(
      (result.critical ? 90 : 55) * muscleImpact,
      (result.critical ? 0.0014 : 0.00065) * chaosImpact,
    );
    this.tapBurst
      .setPosition(x, y)
      .setAlpha(result.critical ? 1 : 0.72)
      .setScale((result.critical ? 0.8 : 0.5) * chaosImpact);
    this.tweens.killTweensOf(this.tapBurst);
    this.tweens.add({
      targets: this.tapBurst,
      alpha: 0,
      scale: (result.critical ? 1.4 : 0.9) * chaosImpact,
      duration: mutation === 'muscle' ? 220 : 260,
      ease: 'Quad.Out',
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
        stroke: '#17191e',
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
    const portrait = height > width;
    const sceneWidth = portrait ? width : width * 0.77;
    const sceneHeight = portrait ? height * 0.68 : height;

    this.cameras.main.shake(240, 0.004);
    this.tweens.killTweensOf(this.hero);
    this.tweens.add({
      targets: this.hero,
      scaleX: this.heroBaseScale * 1.035,
      scaleY: this.heroBaseScale * 1.035,
      duration: 180,
      yoyo: true,
      ease: 'Quad.Out',
      onComplete: () => this.hero?.setScale(this.heroBaseScale),
    });

    const label = this.add.text(sceneWidth / 2, sceneHeight * 0.25, stageName.toUpperCase(), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: portrait ? '28px' : '36px',
      fontStyle: 'bold',
      color: '#f5f1e8',
      stroke: '#17191e',
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

  private playMutationReveal(mutationId: MutationId): void {
    if (!this.mutationLayer) return;
    this.mutationLayer
      .setTexture(`${MUTATION_TEXTURE_PREFIX}${mutationId}`)
      .setAlpha(0)
      .setScale(this.heroBaseScale * 1.08);
    this.cameras.main.flash(220, 245, 216, 107, false);
    this.cameras.main.shake(260, mutationId === 'muscle' ? 0.0045 : 0.0032);
    this.tweens.killTweensOf(this.mutationLayer);
    this.tweens.add({
      targets: this.mutationLayer,
      alpha: 1,
      scaleX: this.heroBaseScale,
      scaleY: this.heroBaseScale,
      duration: 420,
      ease: 'Back.Out',
    });
  }
}

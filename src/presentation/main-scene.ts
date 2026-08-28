import Phaser from 'phaser';
import { getGrowthVisual, getUniqueGrowthVisuals } from '../content/growth-visual-content';
import { MUTATION_DEFINITIONS, MUTATION_ORDER, type MutationId } from '../content/mutation-content';
import { getGrowthStage, getTotalUpgradeLevel } from '../domain/economy-formulas';
import type { GameStore, TapResult } from '../domain/game-store';
import type { GameState } from '../domain/game-state';

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
  private mutationBaseScale = 1;
  private readySignaled = false;
  private readonly onResize = (): void => this.layout();

  public constructor(store: GameStore, onReady?: () => void) {
    super({ key: 'MainScene' });
    this.store = store;
    this.onReady = onReady;
  }

  public preload(): void {
    for (const visual of getUniqueGrowthVisuals()) {
      if (!this.textures.exists(visual.textureKey)) this.load.image(visual.textureKey, visual.art);
    }
    for (const mutationId of MUTATION_ORDER) {
      this.load.image(`${MUTATION_TEXTURE_PREFIX}${mutationId}`, MUTATION_DEFINITIONS[mutationId].art);
    }
    this.load.image('tap-burst', '/assets/ui/tap_burst.png');
  }

  public create(): void {
    const initialVisual = getGrowthVisual(0);
    this.hero = this.add.image(0, 0, initialVisual.textureKey).setOrigin(0.5).setDepth(0);
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
    const visual = getGrowthVisual(stageId);
    const coverScale = Math.max(sceneWidth / this.hero.width, sceneHeight / this.hero.height);

    this.heroBaseScale = coverScale * visual.sceneZoom;
    this.mutationBaseScale = this.heroBaseScale * visual.mutationScale;
    this.hero
      .setPosition(sceneWidth / 2, sceneHeight / 2)
      .setScale(this.heroBaseScale)
      .setAngle(0);

    if (this.mutationLayer) {
      this.mutationLayer
        .setPosition(this.hero.x, this.hero.y)
        .setScale(this.mutationBaseScale)
        .setAngle(0);
    }
  }

  private renderState(state: Readonly<GameState>): void {
    const hadPreviousState = this.lastState !== undefined;
    const previousStage = this.lastGrowthStage;
    const previousMutation = this.lastState?.mutationIds.at(-1);
    const total = getTotalUpgradeLevel(state.branchLevels);
    const stage = getGrowthStage(total);
    const currentMutation = state.mutationIds.at(-1);
    const stageChanged = hadPreviousState && stage.id !== previousStage;

    this.lastGrowthStage = stage.id;
    this.lastState = state;

    const sceneChanged = stageChanged
      ? this.transitionGrowthVisual(stage.id, currentMutation)
      : this.applyVisualState(stage.id, currentMutation);

    if (hadPreviousState && stage.id > previousStage) {
      this.playGrowthCeremony(stage.name, stage.subtitle, sceneChanged);
    }

    if (currentMutation && currentMutation !== previousMutation) {
      this.playMutationReveal(currentMutation);
    }
  }

  /** Returns true when the stage changed to a different scene texture. */
  private transitionGrowthVisual(stageId: number, mutationId: MutationId | undefined): boolean {
    if (!this.hero) return false;
    const nextVisual = getGrowthVisual(stageId);
    const previousTexture = this.hero.texture.key;
    if (previousTexture === nextVisual.textureKey) {
      this.applyVisualState(stageId, mutationId);
      return false;
    }

    const oldX = this.hero.x;
    const oldY = this.hero.y;
    const oldScaleX = this.hero.scaleX;
    const oldScaleY = this.hero.scaleY;
    const ghost = this.add
      .image(oldX, oldY, previousTexture)
      .setOrigin(0.5)
      .setScale(oldScaleX, oldScaleY)
      .setDepth(-0.2)
      .setAlpha(1);

    this.hero.setTexture(nextVisual.textureKey);
    this.applyVisualState(stageId, mutationId);
    this.hero.setAlpha(0).setScale(this.heroBaseScale * 1.055);

    this.tweens.add({
      targets: ghost,
      alpha: 0,
      scaleX: oldScaleX * 0.96,
      scaleY: oldScaleY * 0.96,
      duration: 420,
      ease: 'Cubic.In',
      onComplete: () => ghost.destroy(),
    });
    this.tweens.add({
      targets: this.hero,
      alpha: 1,
      scaleX: this.heroBaseScale,
      scaleY: this.heroBaseScale,
      duration: 460,
      ease: 'Back.Out',
      onComplete: () => this.hero?.setAlpha(1).setScale(this.heroBaseScale),
    });

    if (this.mutationLayer && mutationId) {
      this.mutationLayer.setAlpha(0.25).setScale(this.mutationBaseScale * 1.04);
      this.tweens.add({
        targets: this.mutationLayer,
        alpha: 1,
        scaleX: this.mutationBaseScale,
        scaleY: this.mutationBaseScale,
        duration: 500,
        ease: 'Quad.Out',
      });
    }
    return true;
  }

  /** Returns true when the requested stage uses a different texture than the current image. */
  private applyVisualState(stageId: number, mutationId: MutationId | undefined): boolean {
    if (!this.hero) return false;
    const visual = getGrowthVisual(stageId);
    const sceneChanged = this.hero.texture.key !== visual.textureKey;
    if (sceneChanged) this.hero.setTexture(visual.textureKey);
    this.layout();

    if (!this.mutationLayer) return sceneChanged;
    if (!mutationId) {
      this.mutationLayer.setAlpha(0);
      return sceneChanged;
    }
    this.mutationLayer
      .setTexture(`${MUTATION_TEXTURE_PREFIX}${mutationId}`)
      .setScale(this.mutationBaseScale)
      .setAlpha(1);
    return sceneChanged;
  }

  private isPointerOnPigeon(x: number, y: number): boolean {
    if (!this.hero) return false;
    const visual = getGrowthVisual(this.lastGrowthStage);
    const left = this.hero.x - this.hero.displayWidth / 2;
    const top = this.hero.y - this.hero.displayHeight / 2;
    const pigeonCenterX = left + this.hero.displayWidth * visual.hitbox.centerX;
    const pigeonCenterY = top + this.hero.displayHeight * visual.hitbox.centerY;
    const radiusX = this.hero.displayWidth * visual.hitbox.radiusX;
    const radiusY = this.hero.displayHeight * visual.hitbox.radiusY;
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

  private playGrowthCeremony(stageName: string, subtitle: string, sceneChanged: boolean): void {
    if (!this.hero) return;
    const width = this.scale.width;
    const height = this.scale.height;
    const portrait = height > width;
    const sceneWidth = portrait ? width : width * 0.77;
    const sceneHeight = portrait ? height * 0.68 : height;

    this.cameras.main.flash(sceneChanged ? 260 : 170, 238, 232, 194, false);
    this.cameras.main.shake(sceneChanged ? 330 : 240, sceneChanged ? 0.0052 : 0.004);

    if (!sceneChanged) {
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
    }

    const label = this.add.text(sceneWidth / 2, sceneHeight * 0.23, stageName.toUpperCase(), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: portrait ? '28px' : '38px',
      fontStyle: 'bold',
      color: '#f5f1e8',
      stroke: '#17191e',
      strokeThickness: 8,
      align: 'center',
    }).setOrigin(0.5).setDepth(150).setAlpha(0);

    const sublabel = this.add.text(sceneWidth / 2, sceneHeight * 0.295, subtitle, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: portrait ? '13px' : '16px',
      fontStyle: 'bold',
      color: '#b8ee62',
      stroke: '#17191e',
      strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5).setDepth(150).setAlpha(0);

    this.tweens.add({
      targets: [label, sublabel],
      alpha: { from: 0, to: 1 },
      y: '-=8',
      duration: 190,
      yoyo: true,
      hold: sceneChanged ? 820 : 650,
      onComplete: () => {
        label.destroy();
        sublabel.destroy();
      },
    });
  }

  private playMutationReveal(mutationId: MutationId): void {
    if (!this.mutationLayer) return;
    this.mutationLayer
      .setTexture(`${MUTATION_TEXTURE_PREFIX}${mutationId}`)
      .setAlpha(0)
      .setScale(this.mutationBaseScale * 1.08);
    this.cameras.main.flash(220, 245, 216, 107, false);
    this.cameras.main.shake(260, mutationId === 'muscle' ? 0.0045 : 0.0032);
    this.tweens.killTweensOf(this.mutationLayer);
    this.tweens.add({
      targets: this.mutationLayer,
      alpha: 1,
      scaleX: this.mutationBaseScale,
      scaleY: this.mutationBaseScale,
      duration: 420,
      ease: 'Back.Out',
    });
  }
}

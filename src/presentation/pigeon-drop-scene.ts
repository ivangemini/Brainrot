import Phaser from 'phaser';
import { getGrowthVisual } from '../content/growth-visual-content';
import { MUTATION_DEFINITIONS } from '../content/mutation-content';
import {
  PigeonDropSession,
  type PigeonDropAccuracy,
  type PigeonDropSnapshot,
} from '../domain/pigeon-drop';
import { getGrowthStage, getTotalUpgradeLevel } from '../domain/economy-formulas';
import type { GameStore } from '../domain/game-store';

const TARGET_TEXTURE = 'pigeon-drop-target';
const TARGET_PATH = '/assets/generated/pigeon_drop_target.png';
const PROJECTILE_TEXTURE = 'pigeon-drop-projectile';
const PROJECTILE_PATH = '/assets/generated/pigeon_drop_projectile.png';
const IMPACT_TEXTURE = 'pigeon-drop-impact';
const IMPACT_PATH = '/assets/generated/pigeon_drop_impact.png';
const MUTATION_TEXTURE_PREFIX = 'generated-mutation-';

export interface PigeonDropSceneCallbacks {
  readonly onSnapshot: (snapshot: PigeonDropSnapshot) => void;
  readonly onComplete: (snapshot: PigeonDropSnapshot) => void;
}

/** Pigeon Drop consumes generated-raster production art and only animates it at runtime. */
export class PigeonDropScene extends Phaser.Scene {
  private session: PigeonDropSession | undefined;
  private callbacks: PigeonDropSceneCallbacks | undefined;
  private hero: Phaser.GameObjects.Image | undefined;
  private mutationLayer: Phaser.GameObjects.Image | undefined;
  private target: Phaser.GameObjects.Image | undefined;
  private projectile: Phaser.GameObjects.Image | undefined;
  private heroBaseScale = 1;
  private mutationBaseScale = 1;
  private completedSignaled = false;
  private renderedImpactSequence = 0;
  private readonly onResize = (): void => this.layout();
  private readonly onPointerDown = (): void => { this.requestDrop(); };

  public constructor(
    private readonly store: GameStore,
    private readonly isGameplayActive: () => boolean,
  ) {
    super({ key: 'PigeonDropScene' });
  }

  public configure(callbacks: PigeonDropSceneCallbacks): void {
    this.callbacks = callbacks;
  }

  public preload(): void {
    const state = this.store.getSnapshot();
    const stage = getGrowthStage(getTotalUpgradeLevel(state.branchLevels));
    const visual = getGrowthVisual(stage.id);
    if (!this.textures.exists(visual.textureKey)) this.load.image(visual.textureKey, visual.art);

    const mutationId = state.mutationIds.at(-1);
    if (mutationId) {
      const mutationKey = `${MUTATION_TEXTURE_PREFIX}${mutationId}`;
      if (!this.textures.exists(mutationKey)) this.load.image(mutationKey, MUTATION_DEFINITIONS[mutationId].art);
    }
    if (!this.textures.exists(TARGET_TEXTURE)) this.load.image(TARGET_TEXTURE, TARGET_PATH);
    if (!this.textures.exists(PROJECTILE_TEXTURE)) this.load.image(PROJECTILE_TEXTURE, PROJECTILE_PATH);
    if (!this.textures.exists(IMPACT_TEXTURE)) this.load.image(IMPACT_TEXTURE, IMPACT_PATH);
  }

  public create(): void {
    this.completedSignaled = false;
    this.renderedImpactSequence = 0;
    this.session = new PigeonDropSession();

    const state = this.store.getSnapshot();
    const stage = getGrowthStage(getTotalUpgradeLevel(state.branchLevels));
    const visual = getGrowthVisual(stage.id);
    const mutationId = state.mutationIds.at(-1);

    this.hero = this.add.image(0, 0, visual.textureKey)
      .setOrigin(0.5)
      .setTint(0xb7c0c5)
      .setAlpha(0.78)
      .setDepth(0);

    if (mutationId) {
      this.mutationLayer = this.add.image(0, 0, `${MUTATION_TEXTURE_PREFIX}${mutationId}`)
        .setOrigin(0.5)
        .setAlpha(Math.min(0.48, visual.mutationAlpha * 0.56))
        .setDepth(2);
    }

    this.target = this.add.image(0, 0, TARGET_TEXTURE).setDepth(30);
    this.projectile = this.add.image(0, 0, PROJECTILE_TEXTURE).setDepth(55).setVisible(false);

    this.input.on('pointerdown', this.onPointerDown);
    this.scale.on('resize', this.onResize);
    this.events.once('shutdown', () => {
      this.input.off('pointerdown', this.onPointerDown);
      this.scale.off('resize', this.onResize);
      this.session = undefined;
      this.callbacks = undefined;
      this.hero = undefined;
      this.mutationLayer = undefined;
      this.target = undefined;
      this.projectile = undefined;
    });

    this.layout();
    const snapshot = this.session.getSnapshot();
    this.syncPresentation(snapshot);
    this.callbacks?.onSnapshot(snapshot);
  }

  public requestDrop(): boolean {
    if (!this.session || !this.isGameplayActive()) return false;
    const result = this.session.drop();
    if (!result.accepted) return false;
    const snapshot = this.session.getSnapshot();
    this.syncPresentation(snapshot);
    this.callbacks?.onSnapshot(snapshot);
    return true;
  }

  /** Advance only from the app's authoritative ActiveGameplayClock. */
  public advanceActiveTime(deltaSeconds: number): void {
    if (!this.session || !this.isGameplayActive()) return;
    const snapshot = this.session.tick(deltaSeconds);
    this.syncPresentation(snapshot);
    this.callbacks?.onSnapshot(snapshot);

    if (snapshot.phase === 'complete' && !this.completedSignaled) {
      this.completedSignaled = true;
      this.callbacks?.onComplete(snapshot);
    }
  }

  private layout(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    if (this.hero) {
      const state = this.store.getSnapshot();
      const stage = getGrowthStage(getTotalUpgradeLevel(state.branchLevels));
      const visual = getGrowthVisual(stage.id);
      if (this.hero.texture.key !== visual.textureKey) this.hero.setTexture(visual.textureKey);
      const coverScale = Math.max(width / this.hero.width, height / this.hero.height);
      this.heroBaseScale = coverScale * visual.sceneZoom;
      this.mutationBaseScale = this.heroBaseScale * visual.mutationScale;
      this.hero.setPosition(width / 2, height / 2).setScale(this.heroBaseScale);
      this.mutationLayer
        ?.setPosition(width / 2, height / 2)
        .setScale(this.mutationBaseScale)
        .setAlpha(Math.min(0.48, visual.mutationAlpha * 0.56));
    }

    const snapshot = this.session?.getSnapshot();
    if (snapshot) this.syncPresentation(snapshot);
  }

  private syncPresentation(snapshot: PigeonDropSnapshot): void {
    const targetPosition = this.getTargetPosition(snapshot.targetX);
    const targetWidth = Math.max(155, Math.min(270, this.scale.width * 0.2));
    this.target
      ?.setPosition(targetPosition.x, targetPosition.y)
      .setDisplaySize(targetWidth, targetWidth)
      .setAngle(snapshot.targetDirection > 0 ? 1.5 : -1.5);

    if (snapshot.dropProgress === null) {
      this.projectile?.setVisible(false);
    } else if (this.projectile) {
      const dropX = this.getDropX();
      const startY = this.scale.height * 0.13;
      const endY = targetPosition.y - targetWidth * 0.06;
      const eased = snapshot.dropProgress * snapshot.dropProgress;
      this.projectile
        .setVisible(true)
        .setPosition(dropX, startY + (endY - startY) * eased)
        .setDisplaySize(58 + 28 * snapshot.dropProgress, 58 + 28 * snapshot.dropProgress)
        .setAngle(snapshot.dropProgress * 26);
    }

    const impact = snapshot.lastImpact;
    if (impact && impact.sequence > this.renderedImpactSequence) {
      this.renderedImpactSequence = impact.sequence;
      this.playImpact(impact.points, impact.accuracy);
    }
  }

  private playImpact(points: number, accuracy: PigeonDropAccuracy): void {
    const x = this.getDropX();
    const y = this.getTargetPosition(0.5).y;
    const impact = this.add.image(x, y, IMPACT_TEXTURE)
      .setDepth(70)
      .setScale(0.28)
      .setAlpha(0.96);
    this.tweens.add({
      targets: impact,
      scale: points >= 5 ? 0.72 : points > 0 ? 0.56 : 0.42,
      alpha: 0,
      duration: 360,
      ease: 'Quad.Out',
      onComplete: () => impact.destroy(),
    });

    const label = points >= 5 ? 'PERFECT +5' : points > 0 ? `${accuracy.toUpperCase()} +${points}` : 'MISS';
    const text = this.add.text(x, y - 48, label, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: points >= 5 ? '34px' : '25px',
      fontStyle: 'bold',
      color: points >= 5 ? '#f2c84b' : points > 0 ? '#f5f1e8' : '#f36a62',
      stroke: '#17191e',
      strokeThickness: 7,
    }).setOrigin(0.5).setDepth(85);
    this.tweens.add({
      targets: text,
      y: y - 116,
      alpha: 0,
      duration: 560,
      ease: 'Cubic.Out',
      onComplete: () => text.destroy(),
    });
    this.cameras.main.shake(points >= 5 ? 130 : points > 0 ? 80 : 35, points >= 5 ? 0.0018 : 0.0008);
  }

  private getDropX(): number {
    const portrait = this.scale.height > this.scale.width;
    return this.scale.width * (portrait ? 0.5 : 0.385);
  }

  private getTargetPosition(targetX: number): { x: number; y: number } {
    const width = this.scale.width;
    const height = this.scale.height;
    const portrait = height > width;
    const fieldLeft = width * (portrait ? 0.08 : 0.06);
    const fieldRight = width * (portrait ? 0.92 : 0.71);
    return {
      x: fieldLeft + targetX * (fieldRight - fieldLeft),
      y: height * (portrait ? 0.66 : 0.76),
    };
  }
}

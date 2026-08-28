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

const MUTATION_TEXTURE_PREFIX = 'generated-mutation-';

export interface PigeonDropSceneCallbacks {
  readonly onSnapshot: (snapshot: PigeonDropSnapshot) => void;
  readonly onComplete: (snapshot: PigeonDropSnapshot) => void;
}

/**
 * Production artwork comes from the current generated Growth raster scene and
 * selected Mutation. The bullseye/drop/impact below are transient gameplay VFX,
 * not stand-in production textures.
 */
export class PigeonDropScene extends Phaser.Scene {
  private session: PigeonDropSession | undefined;
  private callbacks: PigeonDropSceneCallbacks | undefined;
  private hero: Phaser.GameObjects.Image | undefined;
  private mutationLayer: Phaser.GameObjects.Image | undefined;
  private targetMarker: Phaser.GameObjects.Container | undefined;
  private projectile: Phaser.GameObjects.Container | undefined;
  private aimGuide: Phaser.GameObjects.Rectangle | undefined;
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

    this.aimGuide = this.add.rectangle(0, 0, 3, 260, 0xf2c84b, 0.42)
      .setOrigin(0.5, 1)
      .setDepth(20);
    this.targetMarker = this.createTargetMarker();
    this.projectile = this.createProjectile().setVisible(false);

    this.input.on('pointerdown', this.onPointerDown);
    this.scale.on('resize', this.onResize);
    this.events.once('shutdown', () => {
      this.input.off('pointerdown', this.onPointerDown);
      this.scale.off('resize', this.onResize);
      this.session = undefined;
      this.callbacks = undefined;
      this.hero = undefined;
      this.mutationLayer = undefined;
      this.targetMarker = undefined;
      this.projectile = undefined;
      this.aimGuide = undefined;
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

  private createTargetMarker(): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 10, 248, 82, 0x071b23, 0.42);
    const outer = this.add.ellipse(0, 0, 238, 76, 0x66c7e8, 0.12)
      .setStrokeStyle(5, 0x66c7e8, 0.82);
    const middle = this.add.ellipse(0, 0, 154, 50, 0xf5f1e8, 0.07)
      .setStrokeStyle(4, 0xf5f1e8, 0.66);
    const center = this.add.ellipse(0, 0, 66, 24, 0xf2c84b, 0.72)
      .setStrokeStyle(3, 0xffe58f, 0.95);
    const vertical = this.add.rectangle(0, 0, 4, 96, 0xf2c84b, 0.76);
    const horizontal = this.add.rectangle(0, 0, 276, 3, 0xf2c84b, 0.48);
    return this.add.container(0, 0, [shadow, outer, middle, center, vertical, horizontal]).setDepth(30);
  }

  private createProjectile(): Phaser.GameObjects.Container {
    const glow = this.add.ellipse(0, 2, 52, 68, 0xf5f1e8, 0.16);
    const body = this.add.ellipse(0, 0, 30, 42, 0xf5f1e8, 0.96)
      .setStrokeStyle(3, 0xffffff, 0.78);
    const highlight = this.add.ellipse(-5, -7, 8, 13, 0xffffff, 0.78);
    const tail = this.add.ellipse(0, -23, 12, 24, 0xf5f1e8, 0.72);
    return this.add.container(0, 0, [glow, tail, body, highlight]).setDepth(55);
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

    const targetY = this.getTargetPosition(0.5).y;
    const dropX = this.getDropX();
    this.aimGuide
      ?.setPosition(dropX, targetY - 8)
      .setDisplaySize(3, Math.max(170, targetY - height * 0.18));

    const snapshot = this.session?.getSnapshot();
    if (snapshot) this.syncPresentation(snapshot);
  }

  private syncPresentation(snapshot: PigeonDropSnapshot): void {
    const targetPosition = this.getTargetPosition(snapshot.targetX);
    const targetScale = Math.max(0.68, Math.min(1.06, this.scale.width / 1050));
    this.targetMarker
      ?.setPosition(targetPosition.x, targetPosition.y)
      .setScale(targetScale)
      .setRotation(snapshot.targetDirection * 0.012);

    if (snapshot.dropProgress === null) {
      this.projectile?.setVisible(false);
    } else if (this.projectile) {
      const dropX = this.getDropX();
      const startY = this.scale.height * 0.15;
      const endY = targetPosition.y - 4;
      const eased = snapshot.dropProgress * snapshot.dropProgress;
      const scale = 0.78 + snapshot.dropProgress * 0.5;
      this.projectile
        .setVisible(true)
        .setPosition(dropX, startY + (endY - startY) * eased)
        .setScale(scale)
        .setRotation(snapshot.dropProgress * 0.55);
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
    const perfect = accuracy === 'center';
    const hit = points > 0;
    const mainColor = perfect ? 0xf2c84b : hit ? 0xf5f1e8 : 0xf36a62;

    const ringOuter = this.add.ellipse(0, 0, 180, 62, mainColor, 0.08)
      .setStrokeStyle(perfect ? 8 : 5, mainColor, 0.92);
    const ringInner = this.add.ellipse(0, 0, 92, 34, 0xf5f1e8, hit ? 0.44 : 0.08);
    const splashA = this.add.rectangle(-56, -8, 58, perfect ? 8 : 5, mainColor, 0.82).setAngle(-18);
    const splashB = this.add.rectangle(54, -10, 58, perfect ? 8 : 5, mainColor, 0.82).setAngle(20);
    const splashC = this.add.rectangle(-28, -34, 48, perfect ? 7 : 4, mainColor, 0.68).setAngle(64);
    const splashD = this.add.rectangle(32, -32, 48, perfect ? 7 : 4, mainColor, 0.68).setAngle(-62);
    const burst = this.add.container(x, y, [ringOuter, ringInner, splashA, splashB, splashC, splashD])
      .setDepth(70)
      .setScale(0.62)
      .setAlpha(0.98);

    this.tweens.add({
      targets: burst,
      scale: perfect ? 1.35 : hit ? 1.08 : 0.92,
      alpha: 0,
      duration: perfect ? 470 : 360,
      ease: 'Quad.Out',
      onComplete: () => burst.destroy(true),
    });

    const label = perfect ? 'PERFECT +5' : hit ? `${accuracy.toUpperCase()} +${points}` : 'MISS';
    const text = this.add.text(x, y - 52, label, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: perfect ? '34px' : '25px',
      fontStyle: 'bold',
      color: perfect ? '#f2c84b' : hit ? '#f5f1e8' : '#f36a62',
      stroke: '#17191e',
      strokeThickness: 7,
    }).setOrigin(0.5).setDepth(85);
    this.tweens.add({
      targets: text,
      y: y - 118,
      alpha: 0,
      duration: 560,
      ease: 'Cubic.Out',
      onComplete: () => text.destroy(),
    });
    this.cameras.main.shake(perfect ? 130 : hit ? 80 : 35, perfect ? 0.0018 : 0.0008);
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

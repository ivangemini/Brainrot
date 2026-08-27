import Phaser from 'phaser';
import { BreadRushSession, type BreadRushSnapshot, type BreadTarget } from '../domain/bread-rush';
import { getGrowthStage, getTotalUpgradeLevel } from '../domain/economy-formulas';
import type { GameStore } from '../domain/game-store';

const HERO_TEXTURE = 'generated-main-hero';

export interface BreadRushSceneCallbacks {
  readonly onSnapshot: (snapshot: BreadRushSnapshot) => void;
  readonly onComplete: (snapshot: BreadRushSnapshot) => void;
}

export class BreadRushScene extends Phaser.Scene {
  private session: BreadRushSession | undefined;
  private callbacks: BreadRushSceneCallbacks | undefined;
  private readonly targetSprites = new Map<number, Phaser.GameObjects.Image>();
  private hero: Phaser.GameObjects.Image | undefined;
  private heroBaseScale = 1;
  private completedSignaled = false;
  private readonly onResize = (): void => this.layout();

  public constructor(
    private readonly store: GameStore,
    private readonly isGameplayActive: () => boolean,
  ) {
    super({ key: 'BreadRushScene' });
  }

  public configure(callbacks: BreadRushSceneCallbacks): void {
    this.callbacks = callbacks;
  }

  public preload(): void {
    this.load.image('event-bread-normal', '/assets/events/bread_normal.png');
    this.load.image('event-bread-golden', '/assets/events/bread_golden.png');
  }

  public create(): void {
    this.completedSignaled = false;
    this.targetSprites.clear();
    this.session = new BreadRushSession();

    this.hero = this.add.image(0, 0, HERO_TEXTURE)
      .setOrigin(0.5)
      .setTint(0xd7ddd3)
      .setAlpha(0.94)
      .setDepth(0);

    this.scale.on('resize', this.onResize);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize);
      for (const sprite of this.targetSprites.values()) sprite.destroy();
      this.targetSprites.clear();
      this.session = undefined;
      this.callbacks = undefined;
      this.hero = undefined;
    });
    this.layout();
    this.callbacks?.onSnapshot(this.session.getSnapshot());
  }

  /** Advance only from the app's authoritative ActiveGameplayClock. */
  public advanceActiveTime(deltaSeconds: number): void {
    if (!this.session || !this.isGameplayActive()) return;
    const snapshot = this.session.tick(deltaSeconds);
    this.syncTargets(snapshot.targets);
    this.callbacks?.onSnapshot(snapshot);

    if (snapshot.phase === 'complete' && !this.completedSignaled) {
      this.completedSignaled = true;
      this.callbacks?.onComplete(snapshot);
    }
  }

  private layout(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const portrait = height > width;
    const sceneWidth = portrait ? width : width * 0.77;
    const sceneHeight = portrait ? height * 0.68 : height;

    if (this.hero) {
      const state = this.store.getSnapshot();
      const stageId = getGrowthStage(getTotalUpgradeLevel(state.branchLevels)).id;
      const coverScale = Math.max(sceneWidth / this.hero.width, sceneHeight / this.hero.height);
      this.heroBaseScale = coverScale * (1 + Math.min(stageId, 6) * 0.012);
      this.hero
        .setPosition(sceneWidth / 2, sceneHeight / 2)
        .setScale(this.heroBaseScale)
        .setAngle(0);
    }

    const snapshot = this.session?.getSnapshot();
    if (snapshot) this.syncTargets(snapshot.targets);
  }

  private syncTargets(targets: readonly BreadTarget[]): void {
    const liveIds = new Set(targets.map((target) => target.id));
    for (const [id, sprite] of this.targetSprites) {
      if (!liveIds.has(id)) {
        sprite.destroy();
        this.targetSprites.delete(id);
      }
    }

    for (const target of targets) {
      let sprite = this.targetSprites.get(target.id);
      if (!sprite) {
        sprite = this.add.image(0, 0, target.kind === 'golden' ? 'event-bread-golden' : 'event-bread-normal')
          .setDepth(40)
          .setInteractive({ useHandCursor: true });
        sprite.setData('targetId', target.id);
        sprite.on('pointerdown', () => this.collectTarget(target.id));
        this.targetSprites.set(target.id, sprite);
        sprite.setScale(0.7);
        this.tweens.add({ targets: sprite, scale: 1, duration: 120, ease: 'Back.Out' });
      }

      const { x, y } = this.toScreen(target.x, target.y);
      const targetSize = Math.max(70, Math.min(112, Math.min(this.scale.width, this.scale.height) * 0.13));
      sprite.setPosition(x, y);
      sprite.setDisplaySize(targetSize * (target.kind === 'golden' ? 1.08 : 1), targetSize * 0.72);
      const lifeRatio = Math.max(0, 1 - target.ageSeconds / target.lifetimeSeconds);
      sprite.setAlpha(0.62 + lifeRatio * 0.38);
      sprite.setAngle(Math.sin(target.ageSeconds * 5 + target.id) * 6);
    }
  }

  private collectTarget(targetId: number): void {
    if (!this.session || !this.isGameplayActive()) return;
    const target = this.session.getSnapshot().targets.find((candidate) => candidate.id === targetId);
    const result = this.session.collect(targetId);
    if (!result.collected || !target) return;

    const sprite = this.targetSprites.get(targetId);
    if (sprite) {
      this.targetSprites.delete(targetId);
      this.tweens.add({
        targets: sprite,
        scale: 1.35,
        alpha: 0,
        duration: 130,
        onComplete: () => sprite.destroy(),
      });
    }

    this.playCollectFeedback(result.kind === 'golden');
    const { x, y } = this.toScreen(target.x, target.y);
    const scoreText = this.add.text(x, y - 30, `+${result.points}`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: result.kind === 'golden' ? '34px' : '24px',
      fontStyle: 'bold',
      color: result.kind === 'golden' ? '#f2c84b' : '#f5f1e8',
      stroke: '#17191e',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(80);
    this.tweens.add({
      targets: scoreText,
      y: y - 90,
      alpha: 0,
      duration: 420,
      onComplete: () => scoreText.destroy(),
    });
    this.callbacks?.onSnapshot(this.session.getSnapshot());
  }

  private playCollectFeedback(golden: boolean): void {
    this.cameras.main.shake(golden ? 110 : 55, golden ? 0.0015 : 0.0006);
    if (!this.hero) return;
    this.tweens.killTweensOf(this.hero);
    this.tweens.add({
      targets: this.hero,
      scaleX: this.heroBaseScale * (golden ? 1.018 : 1.008),
      scaleY: this.heroBaseScale * (golden ? 1.018 : 1.008),
      duration: 70,
      yoyo: true,
      ease: 'Quad.Out',
      onComplete: () => this.hero?.setScale(this.heroBaseScale),
    });
  }

  private toScreen(xNorm: number, yNorm: number): { x: number; y: number } {
    const width = this.scale.width;
    const height = this.scale.height;
    const portrait = height > width;
    const sceneWidth = portrait ? width : width * 0.77;
    const sceneHeight = portrait ? height * 0.68 : height;
    const left = sceneWidth * 0.06;
    const right = sceneWidth * (portrait ? 0.94 : 0.91);
    const top = sceneHeight * (portrait ? 0.18 : 0.16);
    const bottom = sceneHeight * (portrait ? 0.82 : 0.84);
    return {
      x: left + xNorm * (right - left),
      y: top + yNorm * (bottom - top),
    };
  }
}

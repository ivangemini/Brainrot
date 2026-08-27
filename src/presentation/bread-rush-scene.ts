import Phaser from 'phaser';
import { BreadRushSession, type BreadRushSnapshot, type BreadTarget } from '../domain/bread-rush';
import { getGrowthStage, getTotalUpgradeLevel } from '../domain/economy-formulas';
import type { GameStore } from '../domain/game-store';

export interface BreadRushSceneCallbacks {
  readonly onSnapshot: (snapshot: BreadRushSnapshot) => void;
  readonly onComplete: (snapshot: BreadRushSnapshot) => void;
}

export class BreadRushScene extends Phaser.Scene {
  private session: BreadRushSession | undefined;
  private callbacks: BreadRushSceneCallbacks | undefined;
  private readonly targetSprites = new Map<number, Phaser.GameObjects.Image>();
  private background?: Phaser.GameObjects.Image;
  private pigeonRoot?: Phaser.GameObjects.Container;
  private completedSignaled = false;

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

    this.background = this.add.image(0, 0, 'park-bg').setOrigin(0.5).setTint(0xdfe7d7);
    this.createPigeon();
    this.scale.on('resize', () => this.layout());
    this.events.once('shutdown', () => {
      this.scale.off('resize');
      this.targetSprites.clear();
      this.session = undefined;
      this.callbacks = undefined;
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

  private createPigeon(): void {
    const state = this.store.getSnapshot();
    const stage = getGrowthStage(getTotalUpgradeLevel(state.branchLevels));
    const beakTier = state.branchLevels.beak >= 25 ? 3 : state.branchLevels.beak >= 5 ? 2 : 1;
    const wingTier = state.branchLevels.wings >= 25 ? 3 : state.branchLevels.wings >= 5 ? 2 : 1;
    const root = this.add.container(0, 0);
    root.add([
      this.add.image(0, 0, 'pigeon-shadow'),
      this.add.image(0, 0, `pigeon-wing-${wingTier}`),
      this.add.image(0, 0, `pigeon-body-${stage.bodyTier}`),
      this.add.image(0, 0, 'pigeon-legs'),
      this.add.image(0, 0, 'pigeon-head'),
      this.add.image(0, 0, 'pigeon-eyes'),
      this.add.image(0, 0, `pigeon-beak-${beakTier}`),
    ]);
    this.pigeonRoot = root;
  }

  private layout(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    if (this.background) {
      this.background.setPosition(width / 2, height / 2);
      this.background.setScale(Math.max(width / 1600, height / 1000));
    }
    if (this.pigeonRoot) {
      const scale = Math.min(width, height) / 768 * (height > width ? 0.46 : 0.42);
      this.pigeonRoot.setPosition(width * 0.5, height * (height > width ? 0.72 : 0.76));
      this.pigeonRoot.setScale(scale);
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
        this.tweens.add({ targets: sprite, scaleX: { from: 0.5, to: 1 }, scaleY: { from: 0.5, to: 1 }, duration: 120 });
      }

      const { x, y } = this.toScreen(target.x, target.y);
      const targetSize = Math.max(70, Math.min(108, Math.min(this.scale.width, this.scale.height) * 0.13));
      sprite.setPosition(x, y);
      sprite.setDisplaySize(targetSize * (target.kind === 'golden' ? 1.08 : 1), targetSize * 0.72);
      const lifeRatio = Math.max(0, 1 - target.ageSeconds / target.lifetimeSeconds);
      sprite.setAlpha(0.55 + lifeRatio * 0.45);
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

    this.playPigeonReach(target);
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

  private playPigeonReach(target: BreadTarget): void {
    if (!this.pigeonRoot) return;
    const { x } = this.toScreen(target.x, target.y);
    const baseX = this.scale.width * 0.5;
    const reach = Math.max(-42, Math.min(42, (x - baseX) * 0.08));
    this.tweens.killTweensOf(this.pigeonRoot);
    this.tweens.add({
      targets: this.pigeonRoot,
      x: baseX + reach,
      y: this.pigeonRoot.y - 16,
      angle: reach * 0.05,
      duration: 70,
      yoyo: true,
      ease: 'Quad.Out',
    });
  }

  private toScreen(xNorm: number, yNorm: number): { x: number; y: number } {
    const width = this.scale.width;
    const height = this.scale.height;
    const portrait = height > width;
    const left = width * 0.08;
    const right = width * 0.92;
    const top = height * (portrait ? 0.18 : 0.16);
    const bottom = height * (portrait ? 0.59 : 0.66);
    return {
      x: left + xNorm * (right - left),
      y: top + yNorm * (bottom - top),
    };
  }
}

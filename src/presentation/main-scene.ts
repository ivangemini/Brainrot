import Phaser from 'phaser';
import {
  getGrowthStage,
  getTotalUpgradeLevel,
  type BranchLevels,
} from '../domain/economy-formulas';
import type { GameStore, TapResult } from '../domain/game-store';
import type { GameState } from '../domain/game-state';

interface PigeonLayers {
  readonly root: Phaser.GameObjects.Container;
  readonly shadow: Phaser.GameObjects.Image;
  readonly nest: Phaser.GameObjects.Image;
  readonly wing: Phaser.GameObjects.Image;
  readonly body: Phaser.GameObjects.Image;
  readonly legs: Phaser.GameObjects.Image;
  readonly head: Phaser.GameObjects.Image;
  readonly eyes: Phaser.GameObjects.Image;
  readonly beak: Phaser.GameObjects.Image;
  readonly glasses: Phaser.GameObjects.Image;
  readonly chain: Phaser.GameObjects.Image;
}

export class MainScene extends Phaser.Scene {
  private readonly store: GameStore;
  private readonly onReady: (() => void) | undefined;
  private layers?: PigeonLayers;
  private background?: Phaser.GameObjects.Image;
  private tapBurst?: Phaser.GameObjects.Image;
  private lastState?: Readonly<GameState>;
  private unsubscribe?: () => void;
  private lastGrowthStage = 0;
  private readySignaled = false;

  public constructor(store: GameStore, onReady?: () => void) {
    super({ key: 'MainScene' });
    this.store = store;
    this.onReady = onReady;
  }

  public preload(): void {
    this.load.image('park-bg', '/assets/world/park_bg.png');
    this.load.image('pigeon-shadow', '/assets/pigeon/shadow.png');
    this.load.image('pigeon-nest', '/assets/pigeon/nest.png');
    this.load.image('pigeon-wing-1', '/assets/pigeon/wing_t1.png');
    this.load.image('pigeon-wing-2', '/assets/pigeon/wing_t2.png');
    this.load.image('pigeon-wing-3', '/assets/pigeon/wing_t3.png');
    this.load.image('pigeon-body-1', '/assets/pigeon/body_t1.png');
    this.load.image('pigeon-body-2', '/assets/pigeon/body_t2.png');
    this.load.image('pigeon-body-3', '/assets/pigeon/body_t3.png');
    this.load.image('pigeon-legs', '/assets/pigeon/legs.png');
    this.load.image('pigeon-head', '/assets/pigeon/head.png');
    this.load.image('pigeon-eyes', '/assets/pigeon/eyes.png');
    this.load.image('pigeon-beak-1', '/assets/pigeon/beak_t1.png');
    this.load.image('pigeon-beak-2', '/assets/pigeon/beak_t2.png');
    this.load.image('pigeon-beak-3', '/assets/pigeon/beak_t3.png');
    this.load.image('pigeon-glasses', '/assets/pigeon/glasses.png');
    this.load.image('pigeon-chain', '/assets/pigeon/chain.png');
    this.load.image('tap-burst', '/assets/ui/tap_burst.png');
  }

  public create(): void {
    this.background = this.add.image(0, 0, 'park-bg').setOrigin(0.5);
    const root = this.add.container(0, 0);
    const makeLayer = (key: string): Phaser.GameObjects.Image => (
      this.add.image(0, 0, key).setOrigin(0.5)
    );

    const layers: PigeonLayers = {
      root,
      shadow: makeLayer('pigeon-shadow'),
      nest: makeLayer('pigeon-nest'),
      wing: makeLayer('pigeon-wing-1'),
      body: makeLayer('pigeon-body-1'),
      legs: makeLayer('pigeon-legs'),
      head: makeLayer('pigeon-head'),
      eyes: makeLayer('pigeon-eyes'),
      beak: makeLayer('pigeon-beak-1'),
      glasses: makeLayer('pigeon-glasses'),
      chain: makeLayer('pigeon-chain'),
    };

    root.add([
      layers.shadow,
      layers.nest,
      layers.wing,
      layers.body,
      layers.legs,
      layers.head,
      layers.eyes,
      layers.beak,
      layers.glasses,
      layers.chain,
    ]);

    this.layers = layers;
    this.tapBurst = this.add.image(0, 0, 'tap-burst').setAlpha(0).setScale(0.5);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isPointerOnPigeon(pointer.x, pointer.y)) return;
      const result = this.store.tap(performance.now());
      this.playTapFeedback(pointer.x, pointer.y, result);
    });

    this.scale.on('resize', () => this.layout());
    this.layout();

    this.unsubscribe = this.store.subscribe((state) => this.renderState(state));
    this.events.once('shutdown', () => this.unsubscribe?.());
    this.signalReady();
  }

  private signalReady(): void {
    if (this.readySignaled) return;
    this.readySignaled = true;
    this.onReady?.();
  }

  private layout(): void {
    if (!this.background || !this.layers) return;
    const width = this.scale.width;
    const height = this.scale.height;

    this.background.setPosition(width / 2, height / 2);
    const bgScale = Math.max(width / 1600, height / 1000);
    this.background.setScale(bgScale);

    const portrait = height > width;
    const base = Math.min(width, height) * (portrait ? 0.78 : 0.72);
    this.layers.root.setPosition(width * (portrait ? 0.5 : 0.43), height * (portrait ? 0.51 : 0.56));
    this.layers.root.setScale(base / 768);

    if (this.tapBurst) this.tapBurst.setDepth(100);
    if (this.lastState) this.applyVisualState(this.lastState.branchLevels);
  }

  private renderState(state: Readonly<GameState>): void {
    const previousStage = this.lastGrowthStage;
    const total = getTotalUpgradeLevel(state.branchLevels);
    const stage = getGrowthStage(total);
    this.lastGrowthStage = stage.id;
    this.lastState = state;
    this.applyVisualState(state.branchLevels);

    if (stage.id > previousStage && previousStage !== 0) {
      this.playGrowthCeremony(stage.name);
    } else if (stage.id > previousStage && total >= 10) {
      this.playGrowthCeremony(stage.name);
    }
  }

  private applyVisualState(levels: BranchLevels): void {
    if (!this.layers) return;
    const total = getTotalUpgradeLevel(levels);
    const stage = getGrowthStage(total);

    this.layers.body.setTexture(`pigeon-body-${stage.bodyTier}`);
    const wingTier = levels.wings >= 25 ? 3 : levels.wings >= 5 ? 2 : 1;
    this.layers.wing.setTexture(`pigeon-wing-${wingTier}`);
    const beakTier = levels.beak >= 25 ? 3 : levels.beak >= 5 ? 2 : 1;
    this.layers.beak.setTexture(`pigeon-beak-${beakTier}`);

    this.layers.nest.setVisible(levels.nest > 0);
    this.layers.glasses.setVisible(levels.swag >= 1);
    this.layers.chain.setVisible(levels.swag >= 5);

    const width = this.scale.width;
    const height = this.scale.height;
    const portrait = height > width;
    const base = Math.min(width, height) * (portrait ? 0.78 : 0.72);
    this.layers.root.setScale((base / 768) * stage.scale);
  }

  private isPointerOnPigeon(x: number, y: number): boolean {
    if (!this.layers) return false;
    const root = this.layers.root;
    const radius = Math.min(this.scale.width, this.scale.height) * 0.28 * root.scaleX;
    const dx = x - root.x;
    const dy = y - root.y;
    return dx * dx + dy * dy <= Math.max(120, radius) ** 2;
  }

  private playTapFeedback(x: number, y: number, result: TapResult): void {
    if (!this.layers || !this.tapBurst) return;

    this.tweens.killTweensOf(this.layers.root);
    const originalScale = this.layers.root.scaleX;
    this.tweens.add({
      targets: this.layers.root,
      scaleX: originalScale * 1.035,
      scaleY: originalScale * 0.965,
      duration: 70,
      yoyo: true,
      ease: 'Quad.Out',
    });

    this.tapBurst.setPosition(x, y).setAlpha(result.critical ? 1 : 0.72).setScale(result.critical ? 0.8 : 0.5);
    this.tweens.killTweensOf(this.tapBurst);
    this.tweens.add({
      targets: this.tapBurst,
      alpha: 0,
      scale: result.critical ? 1.4 : 0.9,
      duration: 260,
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
    if (!this.layers) return;
    const root = this.layers.root;
    this.cameras.main.shake(240, 0.004);
    const label = this.add.text(this.scale.width / 2, this.scale.height * 0.26, stageName.toUpperCase(), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#f5f1e8',
      stroke: '#17191e',
      strokeThickness: 8,
      align: 'center',
    }).setOrigin(0.5).setDepth(150).setAlpha(0);

    this.tweens.add({
      targets: root,
      angle: { from: -2, to: 2 },
      duration: 80,
      yoyo: true,
      repeat: 3,
      onComplete: () => root.setAngle(0),
    });
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

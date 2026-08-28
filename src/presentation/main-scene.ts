import Phaser from 'phaser';
import { MEME_PIGEON_HERO_DATA_URL } from '../assets/meme-pigeon/hero-data';
import { MUTATION_DEFINITIONS, type MutationId } from '../content/mutation-content';
import { getGrowthStage, getTotalUpgradeLevel } from '../domain/economy-formulas';
import type { GameStore, TapResult } from '../domain/game-store';
import type { GameState } from '../domain/game-state';
import { getHeroSafeRect, getMemePigeonScenePlacement, rectContainsBounds } from './hero-layout';

const HERO_TEXTURE = 'meme-pigeon-canonical';

export class MainScene extends Phaser.Scene {
  private readonly store: GameStore;
  private readonly onReady: (() => void) | undefined;
  private hero?: Phaser.GameObjects.Image;
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
    if (!this.textures.exists(HERO_TEXTURE)) this.load.image(HERO_TEXTURE, MEME_PIGEON_HERO_DATA_URL);
    this.load.image('tap-burst', '/assets/ui/tap_burst.png');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#0b171b');
    this.hero = this.add.image(0, 0, HERO_TEXTURE).setOrigin(0.5).setDepth(0);
    this.tapBurst = this.add.image(0, 0, 'tap-burst').setAlpha(0).setScale(0.5).setDepth(100);
    this.game.canvas.dataset.heroLayers = '1';
    this.game.canvas.dataset.heroIdentity = 'canonical-meme-pigeon';

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
    const centerX = width / 2;
    const centerY = height / 2;
    const stageId = this.lastState
      ? getGrowthStage(getTotalUpgradeLevel(this.lastState.branchLevels)).id
      : 0;
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
    const hadPreviousState = this.lastState !== undefined;
    const previousStage = this.lastGrowthStage;
    const previousMutation = this.lastState?.mutationIds.at(-1);
    const total = getTotalUpgradeLevel(state.branchLevels);
    const stage = getGrowthStage(total);
    const currentMutation = state.mutationIds.at(-1);

    this.lastGrowthStage = stage.id;
    this.lastState = state;
    this.layout();

    if (hadPreviousState && stage.id > previousStage) {
      this.playGrowthCeremony(stage.name, stage.subtitle);
    }
    if (currentMutation && currentMutation !== previousMutation) {
      this.playMutationReveal(currentMutation);
    }
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

    this.tweens.killTweensOf(this.hero);
    this.tweens.add({
      targets: this.hero,
      scaleX: this.heroBaseScale * (mutation === 'muscle' ? 1.028 : 1.018),
      scaleY: this.heroBaseScale * (mutation === 'muscle' ? 0.972 : 0.982),
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

  private playGrowthCeremony(stageName: string, subtitle: string): void {
    if (!this.hero) return;
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.flash(190, 92, 196, 232, false);
    this.cameras.main.shake(260, 0.0042);
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
    const sublabel = this.add.text(width / 2, height * 0.295, subtitle, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: height > width ? '13px' : '16px',
      fontStyle: 'bold',
      color: '#b8ee62',
      stroke: '#071b23',
      strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5).setDepth(150).setAlpha(0);

    this.tweens.add({
      targets: [label, sublabel],
      alpha: { from: 0, to: 1 },
      y: '-=8',
      duration: 190,
      yoyo: true,
      hold: 720,
      onComplete: () => {
        label.destroy();
        sublabel.destroy();
      },
    });
  }

  private playMutationReveal(mutationId: MutationId): void {
    const definition = MUTATION_DEFINITIONS[mutationId];
    const width = this.scale.width;
    const height = this.scale.height;
    const flash = mutationId === 'muscle'
      ? [243, 106, 98] as const
      : mutationId === 'business'
        ? [242, 200, 75] as const
        : [102, 199, 232] as const;
    this.cameras.main.flash(220, flash[0], flash[1], flash[2], false);
    this.cameras.main.shake(260, mutationId === 'muscle' ? 0.0045 : 0.0032);

    const label = this.add.text(width / 2, height * 0.32, definition.name.toUpperCase(), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: height > width ? '25px' : '32px',
      fontStyle: 'bold',
      color: '#f5f1e8',
      stroke: '#071b23',
      strokeThickness: 7,
      align: 'center',
    }).setOrigin(0.5).setDepth(160).setAlpha(0);
    this.tweens.add({
      targets: label,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.78, to: 1 },
      duration: 180,
      yoyo: true,
      hold: 620,
      onComplete: () => label.destroy(),
    });
  }
}

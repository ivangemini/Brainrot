import Phaser from 'phaser';

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface CropOptions {
  readonly flipX?: boolean;
  readonly flipY?: boolean;
  readonly anchorY?: 'top' | 'center' | 'bottom';
}

/**
 * Extends the approved meme raster into viewport gaps without cloning the
 * pigeon. Peripheral scenery is cropped only from environment-only regions,
 * scaled uniformly, and darkened slightly so it reads as peripheral scenery.
 */
export class MemeSceneBackdrop {
  private readonly leftFill: Phaser.GameObjects.Image;
  private readonly bottomFill: Phaser.GameObjects.Image;
  private readonly leftShade: Phaser.GameObjects.Rectangle;
  private readonly bottomShade: Phaser.GameObjects.Rectangle;

  public constructor(scene: Phaser.Scene, textureKey: string, depth = -10) {
    this.leftFill = scene.add.image(0, 0, textureKey)
      .setOrigin(0, 0)
      .setDepth(depth)
      .setTint(0x718275)
      .setAlpha(0.84);
    this.bottomFill = scene.add.image(0, 0, textureKey)
      .setOrigin(0, 0)
      .setDepth(depth)
      .setTint(0x65786d)
      .setAlpha(0.82);
    this.leftShade = scene.add.rectangle(0, 0, 1, 1, 0x102b25, 0.16)
      .setOrigin(0, 0)
      .setDepth(depth + 1);
    this.bottomShade = scene.add.rectangle(0, 0, 1, 1, 0x102b25, 0.18)
      .setOrigin(0, 0)
      .setDepth(depth + 1);
  }

  public layout(
    viewportWidth: number,
    viewportHeight: number,
    sourceWidth: number,
    sourceHeight: number,
    sceneBounds: Rect,
  ): void {
    const leftGap = Math.max(0, sceneBounds.x);
    if (leftGap > 1) {
      this.mapCropCoverToRect(
        this.leftFill,
        { x: 0, y: 0, width: sourceWidth * 0.24, height: sourceHeight },
        { x: 0, y: 0, width: leftGap + 2, height: viewportHeight },
        { flipX: true, anchorY: 'center' },
      );
      this.leftFill.setVisible(true);
      this.leftShade
        .setPosition(0, 0)
        .setSize(leftGap + 2, viewportHeight)
        .setVisible(true);
    } else {
      this.leftFill.setVisible(false);
      this.leftShade.setVisible(false);
    }

    const sceneBottom = sceneBounds.y + sceneBounds.height;
    const bottomGap = Math.max(0, viewportHeight - sceneBottom);
    if (bottomGap > 1) {
      this.mapCropCoverToRect(
        this.bottomFill,
        {
          x: 0,
          y: sourceHeight * 0.72,
          width: sourceWidth * 0.24,
          height: sourceHeight * 0.28,
        },
        {
          x: 0,
          y: sceneBottom - 1,
          width: viewportWidth,
          height: bottomGap + 2,
        },
        { flipY: true, anchorY: 'bottom' },
      );
      this.bottomFill.setVisible(true);
      this.bottomShade
        .setPosition(0, sceneBottom - 1)
        .setSize(viewportWidth, bottomGap + 2)
        .setVisible(true);
    } else {
      this.bottomFill.setVisible(false);
      this.bottomShade.setVisible(false);
    }
  }

  public destroy(): void {
    this.leftFill.destroy();
    this.bottomFill.destroy();
    this.leftShade.destroy();
    this.bottomShade.destroy();
  }

  private mapCropCoverToRect(
    image: Phaser.GameObjects.Image,
    available: Rect,
    target: Rect,
    options: CropOptions,
  ): void {
    const targetAspect = target.width / Math.max(1, target.height);
    let cropX = available.x;
    let cropY = available.y;
    let cropWidth = Math.max(1, available.width);
    let cropHeight = Math.max(1, available.height);
    const availableAspect = cropWidth / cropHeight;

    if (availableAspect > targetAspect) {
      const fittedWidth = cropHeight * targetAspect;
      cropX += (cropWidth - fittedWidth) / 2;
      cropWidth = fittedWidth;
    } else if (availableAspect < targetAspect) {
      const fittedHeight = cropWidth / targetAspect;
      const spare = cropHeight - fittedHeight;
      if (options.anchorY === 'bottom') cropY += spare;
      else if (options.anchorY === 'center') cropY += spare / 2;
      cropHeight = fittedHeight;
    }

    const scale = target.width / cropWidth;
    image
      .setCrop(cropX, cropY, cropWidth, cropHeight)
      .setFlip(options.flipX ?? false, options.flipY ?? false)
      .setScale(scale)
      .setPosition(target.x - cropX * scale, target.y - cropY * scale);
  }
}

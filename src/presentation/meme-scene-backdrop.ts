import Phaser from 'phaser';

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Extends the approved portrait meme reference into wide/short viewports without
 * ever rendering a second copy of the pigeon. Both helpers are cropped from
 * environment-only regions at the far-left edge of the same generated raster.
 */
export class MemeSceneBackdrop {
  private readonly leftFill: Phaser.GameObjects.Image;
  private readonly bottomFill: Phaser.GameObjects.Image;

  public constructor(scene: Phaser.Scene, textureKey: string, depth = -10) {
    this.leftFill = scene.add.image(0, 0, textureKey).setOrigin(0, 0).setDepth(depth);
    this.bottomFill = scene.add.image(0, 0, textureKey).setOrigin(0, 0).setDepth(depth);
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
      this.mapCropToRect(
        this.leftFill,
        { x: 0, y: 0, width: sourceWidth * 0.24, height: sourceHeight },
        { x: 0, y: 0, width: leftGap + 2, height: viewportHeight },
      );
      this.leftFill.setVisible(true);
    } else {
      this.leftFill.setVisible(false);
    }

    const sceneBottom = sceneBounds.y + sceneBounds.height;
    const bottomGap = Math.max(0, viewportHeight - sceneBottom);
    if (bottomGap > 1) {
      // Lower-left water/lily patch: deliberately excludes the central pigeon.
      this.mapCropToRect(
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
      );
      this.bottomFill.setVisible(true);
    } else {
      this.bottomFill.setVisible(false);
    }
  }

  public destroy(): void {
    this.leftFill.destroy();
    this.bottomFill.destroy();
  }

  private mapCropToRect(image: Phaser.GameObjects.Image, crop: Rect, target: Rect): void {
    const cropWidth = Math.max(1, crop.width);
    const cropHeight = Math.max(1, crop.height);
    const scaleX = target.width / cropWidth;
    const scaleY = target.height / cropHeight;

    image
      .setCrop(crop.x, crop.y, cropWidth, cropHeight)
      .setScale(scaleX, scaleY)
      .setPosition(target.x - crop.x * scaleX, target.y - crop.y * scaleY);
  }
}

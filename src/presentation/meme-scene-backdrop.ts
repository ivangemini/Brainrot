import Phaser from 'phaser';

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Extends the approved meme raster into viewport gaps without ever cloning the
 * pigeon. The side extension mirrors the source's outermost jungle edge, so the
 * pixel touching the hero scene is the same source edge pixel. The lower
 * extension mirrors the final water rows, which reads as a natural reflection
 * rather than a horizontally smeared strip.
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
      const cropWidth = Math.max(1, sourceWidth * 0.2);
      const scaleX = (leftGap + 2) / cropWidth;
      const scaleY = sceneBounds.height / sourceHeight;

      // Negative X scale makes the visible edge next to the main scene resolve
      // to source x=0, eliminating the hard vertical seam from the old stretch.
      this.leftFill
        .setCrop(0, 0, cropWidth, sourceHeight)
        .setScale(-scaleX, scaleY)
        .setPosition(leftGap + 2, sceneBounds.y)
        .setVisible(true);
    } else {
      this.leftFill.setVisible(false);
    }

    const sceneBottom = sceneBounds.y + sceneBounds.height;
    const bottomGap = Math.max(0, viewportHeight - sceneBottom);
    if (bottomGap > 1) {
      const cropY = sourceHeight * 0.92;
      const cropHeight = Math.max(1, sourceHeight - cropY);
      const scaleX = viewportWidth / sourceWidth;
      const scaleY = (bottomGap + 2) / cropHeight;

      // Mirror the entire last water band vertically. Its top boundary resolves
      // to the same final raster row as the main scene, while the reflection
      // continues naturally toward the bottom tray.
      this.bottomFill
        .setCrop(0, cropY, sourceWidth, cropHeight)
        .setScale(scaleX, -scaleY)
        .setPosition(0, sceneBottom + bottomGap + 1)
        .setVisible(true);
    } else {
      this.bottomFill.setVisible(false);
    }
  }

  public destroy(): void {
    this.leftFill.destroy();
    this.bottomFill.destroy();
  }
}

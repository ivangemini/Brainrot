export interface HeroSafeRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface HeroScenePlacement {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly silhouetteBounds: HeroSafeRect;
}

/**
 * Approximate readable silhouette inside the user-approved meme reference crop.
 * UI may sit over decorative jungle/water pixels, but never over this silhouette.
 */
const MEME_PIGEON_SILHOUETTE = {
  left: 0.28,
  top: 0.43,
  right: 0.74,
  bottom: 0.94,
} as const;

/**
 * Runtime mirror of the DOM reserved UI zones.
 * The approved meme pigeon stays centered on the viewport, while its readable
 * silhouette must remain inside this safe rectangle and never collide with UI.
 */
export function getHeroSafeRect(viewportWidth: number, viewportHeight: number): HeroSafeRect {
  const portrait = viewportHeight > viewportWidth;

  if (portrait) {
    const topHudReserve = viewportWidth <= 560 ? 76 : 90;
    const bottomTrayHeight = Math.min(
      viewportHeight * (viewportWidth <= 560 ? 0.24 : 0.26),
      viewportWidth <= 560 ? 190 : 220,
    );
    const edge = 12;
    const bottom = viewportHeight - bottomTrayHeight - 14;
    return {
      x: edge,
      y: topHudReserve,
      width: Math.max(1, viewportWidth - edge * 2),
      height: Math.max(1, bottom - topHudReserve),
    };
  }

  const rightPanelWidth = Math.min(390, Math.max(330, viewportWidth * 0.34));
  const left = 18;
  const top = 104;
  const right = viewportWidth - rightPanelWidth - 28;
  const bottom = viewportHeight - 18;
  return {
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

/** Returns the largest box centered on the actual viewport that fits in the safe area. */
export function getCenteredHeroBox(viewportWidth: number, viewportHeight: number): HeroSafeRect {
  const safe = getHeroSafeRect(viewportWidth, viewportHeight);
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;
  const halfWidth = Math.max(1, Math.min(centerX - safe.x, safe.x + safe.width - centerX));
  const halfHeight = Math.max(1, Math.min(centerY - safe.y, safe.y + safe.height - centerY));
  return {
    x: centerX - halfWidth,
    y: centerY - halfHeight,
    width: halfWidth * 2,
    height: halfHeight * 2,
  };
}

/**
 * Places the reference scene so the pigeon itself, rather than the rectangular
 * source image, is centered on the viewport. This lets the source raster extend
 * beneath decorative UI while keeping the readable bird completely clear.
 */
export function getMemePigeonScenePlacement(
  viewportWidth: number,
  viewportHeight: number,
  sourceWidth: number,
  sourceHeight: number,
  growthProgress = 0,
): HeroScenePlacement {
  const centered = getCenteredHeroBox(viewportWidth, viewportHeight);
  const silhouetteWidth = sourceWidth * (MEME_PIGEON_SILHOUETTE.right - MEME_PIGEON_SILHOUETTE.left);
  const silhouetteHeight = sourceHeight * (MEME_PIGEON_SILHOUETTE.bottom - MEME_PIGEON_SILHOUETTE.top);
  const fitScale = Math.min(
    (centered.width * 0.92) / silhouetteWidth,
    (centered.height * 0.92) / silhouetteHeight,
  );
  const minPresentationScale = (viewportWidth * (viewportHeight > viewportWidth ? 1.05 : 0.61)) / sourceWidth;
  const growthFactor = Math.min(1, 0.80 + Math.max(0, growthProgress) * 0.035);
  const scale = Math.min(fitScale, Math.max(minPresentationScale, fitScale * growthFactor));

  const displayWidth = sourceWidth * scale;
  const displayHeight = sourceHeight * scale;
  const silhouetteCenterX = (MEME_PIGEON_SILHOUETTE.left + MEME_PIGEON_SILHOUETTE.right) / 2;
  const silhouetteCenterY = (MEME_PIGEON_SILHOUETTE.top + MEME_PIGEON_SILHOUETTE.bottom) / 2;
  const x = viewportWidth / 2 - (silhouetteCenterX - 0.5) * displayWidth;
  const y = viewportHeight / 2 - (silhouetteCenterY - 0.5) * displayHeight;

  const left = x - displayWidth / 2 + MEME_PIGEON_SILHOUETTE.left * displayWidth;
  const top = y - displayHeight / 2 + MEME_PIGEON_SILHOUETTE.top * displayHeight;
  const right = x - displayWidth / 2 + MEME_PIGEON_SILHOUETTE.right * displayWidth;
  const bottom = y - displayHeight / 2 + MEME_PIGEON_SILHOUETTE.bottom * displayHeight;

  return {
    x,
    y,
    scale,
    silhouetteBounds: {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    },
  };
}

export function rectContainsBounds(
  rect: HeroSafeRect,
  bounds: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
  tolerance = 1,
): boolean {
  return bounds.x >= rect.x - tolerance
    && bounds.y >= rect.y - tolerance
    && bounds.x + bounds.width <= rect.x + rect.width + tolerance
    && bounds.y + bounds.height <= rect.y + rect.height + tolerance;
}

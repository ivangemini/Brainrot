export interface HeroSafeRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Runtime mirror of the DOM reserved UI zones.
 * The approved meme pigeon stays centered on the viewport, while its readable
 * silhouette must remain inside this safe rectangle and never collide with UI.
 */
export function getHeroSafeRect(viewportWidth: number, viewportHeight: number): HeroSafeRect {
  const portrait = viewportHeight > viewportWidth;

  if (portrait) {
    const topHudReserve = viewportWidth <= 560 ? 76 : 90;
    const bottomTrayHeight = Math.min(viewportHeight * (viewportWidth <= 560 ? 0.24 : 0.26), viewportWidth <= 560 ? 190 : 220);
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

/** Returns the largest centered box that fits inside the safe rectangle. */
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

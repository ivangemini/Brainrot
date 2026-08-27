export interface HeroSafeRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Runtime mirror of the DOM reserved UI zones.
 * The hero must stay fully inside this rectangle so its readable silhouette never
 * collides with the top HUD, desktop upgrade panel, or mobile bottom upgrade tray.
 */
export function getHeroSafeRect(viewportWidth: number, viewportHeight: number): HeroSafeRect {
  const portrait = viewportHeight > viewportWidth;

  if (portrait) {
    const topHudReserve = viewportWidth <= 560 ? 78 : 92;
    const bottomTrayHeight = Math.min(viewportHeight * (viewportWidth <= 560 ? 0.36 : 0.38), viewportWidth <= 560 ? 300 : 330);
    const edge = 12;
    const bottom = viewportHeight - bottomTrayHeight - 18;
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

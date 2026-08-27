import { describe, expect, it } from 'vitest';
import {
  getCenteredHeroBox,
  getHeroSafeRect,
  getMemePigeonScenePlacement,
  rectContainsBounds,
} from '../src/presentation/hero-layout';

describe('hero-first layout', () => {
  it('keeps desktop viewport center inside the safe area', () => {
    const width = 1440;
    const height = 900;
    const safe = getHeroSafeRect(width, height);
    const centered = getCenteredHeroBox(width, height);

    expect(width / 2).toBeGreaterThanOrEqual(safe.x);
    expect(width / 2).toBeLessThanOrEqual(safe.x + safe.width);
    expect(height / 2).toBeGreaterThanOrEqual(safe.y);
    expect(height / 2).toBeLessThanOrEqual(safe.y + safe.height);
    expect(rectContainsBounds(safe, centered)).toBe(true);
  });

  it('keeps mobile viewport center inside the safe area despite the bottom tray', () => {
    const width = 390;
    const height = 844;
    const safe = getHeroSafeRect(width, height);
    const centered = getCenteredHeroBox(width, height);

    expect(width / 2).toBeGreaterThanOrEqual(safe.x);
    expect(width / 2).toBeLessThanOrEqual(safe.x + safe.width);
    expect(height / 2).toBeGreaterThanOrEqual(safe.y);
    expect(height / 2).toBeLessThanOrEqual(safe.y + safe.height);
    expect(rectContainsBounds(safe, centered)).toBe(true);
  });

  it('centers the readable pigeon silhouette on desktop without UI collision', () => {
    const width = 1440;
    const height = 900;
    const placement = getMemePigeonScenePlacement(width, height, 710, 1000, 0);
    const bounds = placement.silhouetteBounds;
    expect(bounds.x + bounds.width / 2).toBeCloseTo(width / 2, 5);
    expect(bounds.y + bounds.height / 2).toBeCloseTo(height / 2, 5);
    expect(rectContainsBounds(getHeroSafeRect(width, height), bounds, 2)).toBe(true);
  });

  it('centers the readable pigeon silhouette on a narrow phone without touching the tray', () => {
    const width = 390;
    const height = 844;
    const placement = getMemePigeonScenePlacement(width, height, 710, 1000, 7);
    const bounds = placement.silhouetteBounds;
    expect(bounds.x + bounds.width / 2).toBeCloseTo(width / 2, 5);
    expect(bounds.y + bounds.height / 2).toBeCloseTo(height / 2, 5);
    expect(rectContainsBounds(getHeroSafeRect(width, height), bounds, 2)).toBe(true);
  });

  it('rejects hero bounds that intrude into reserved UI', () => {
    const safe = getHeroSafeRect(390, 844);
    expect(rectContainsBounds(safe, { x: 0, y: 0, width: 390, height: 844 })).toBe(false);
  });
});

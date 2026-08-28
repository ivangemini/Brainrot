import { describe, expect, it } from 'vitest';
import { GROWTH_STAGES } from '../src/content/economy-content';
import {
  GROWTH_VISUALS,
  getGrowthVisual,
  getUniqueGrowthVisuals,
} from '../src/content/growth-visual-content';
import { getGrowthStage } from '../src/domain/economy-formulas';

describe('Growth visual content', () => {
  it('covers every authoritative Growth stage id', () => {
    expect(GROWTH_VISUALS).toHaveLength(GROWTH_STAGES.length);
    expect(GROWTH_VISUALS.map((visual) => visual.stageId))
      .toEqual(GROWTH_STAGES.map((stage) => stage.id));
  });

  it('keeps the exact canonical meme-pigeon raster identity at every Growth stage', () => {
    const base = getGrowthVisual(0);
    expect(base.textureKey).toBe('meme-pigeon-canonical');
    expect(base.art.startsWith('data:image/webp;base64,')).toBe(true);

    for (const stage of GROWTH_VISUALS) {
      expect(stage.textureKey).toBe(base.textureKey);
      expect(stage.art).toBe(base.art);
      expect(stage.art.includes('/growth_stage_')).toBe(false);
    }
  });

  it('maps the 90/150/240/360/420 thresholds without changing character identity', () => {
    const thresholds = [90, 150, 240, 360, 420];
    const expectedStageIds = [4, 5, 6, 7, 8];
    expect(thresholds.map((total) => getGrowthStage(total).id)).toEqual(expectedStageIds);
    expect(thresholds.map((total) => getGrowthVisual(getGrowthStage(total).id).stageId))
      .toEqual(expectedStageIds);
    expect(new Set(thresholds.map((total) => getGrowthVisual(getGrowthStage(total).id).art)).size).toBe(1);
  });

  it('preloads one canonical raster instead of stage-specific substitute pigeons', () => {
    const unique = getUniqueGrowthVisuals();
    expect(unique).toHaveLength(1);
    expect(unique[0]!.textureKey).toBe('meme-pigeon-canonical');
  });

  it('grows monotonically through framing while keeping normalized click targeting', () => {
    let previousZoom = 0;
    for (const visual of GROWTH_VISUALS) {
      expect(visual.sceneZoom).toBeGreaterThan(previousZoom);
      previousZoom = visual.sceneZoom;
      expect(visual.hitbox.centerX).toBeGreaterThan(0);
      expect(visual.hitbox.centerX).toBeLessThan(1);
      expect(visual.hitbox.centerY).toBeGreaterThan(0);
      expect(visual.hitbox.centerY).toBeLessThan(1);
      expect(visual.hitbox.radiusX).toBeGreaterThan(0);
      expect(visual.hitbox.radiusY).toBeGreaterThan(0);
    }
  });

  it('does not apply legacy full-scene mutation overlays over the canonical hero', () => {
    for (const visual of GROWTH_VISUALS) {
      expect(visual.mutationAlpha).toBe(0);
    }
  });

  it('falls back safely to the canonical hero for unknown stage ids', () => {
    expect(getGrowthVisual(999)).toBe(getGrowthVisual(0));
  });
});

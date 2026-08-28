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

  it('keeps early stages on the established hero while major stages use distinct raster scenes', () => {
    const earlyArt = getGrowthVisual(0).art;
    expect(getGrowthVisual(1).art).toBe(earlyArt);
    expect(getGrowthVisual(2).art).toBe(earlyArt);
    expect(getGrowthVisual(3).art).toBe(earlyArt);

    const majorArts = [4, 5, 6, 7, 8].map((stageId) => getGrowthVisual(stageId).art);
    expect(new Set(majorArts).size).toBe(5);
    for (const art of majorArts) {
      expect(art.startsWith('/assets/generated/growth_stage_')).toBe(true);
      expect(art.endsWith('.png')).toBe(true);
      expect(art.endsWith('.svg')).toBe(false);
    }
  });

  it('maps the 90/150/240/360/420 thresholds to their intended major scenes', () => {
    const thresholds = [90, 150, 240, 360, 420];
    const expectedStageIds = [4, 5, 6, 7, 8];
    expect(thresholds.map((total) => getGrowthStage(total).id)).toEqual(expectedStageIds);
    expect(thresholds.map((total) => getGrowthVisual(getGrowthStage(total).id).stageId))
      .toEqual(expectedStageIds);
  });

  it('preloads only one copy of the shared early hero plus each major scene', () => {
    const unique = getUniqueGrowthVisuals();
    expect(unique).toHaveLength(6);
    expect(new Set(unique.map((visual) => visual.textureKey)).size).toBe(6);
  });

  it('keeps normalized hitboxes and non-shrinking mutation treatment scale', () => {
    let previousMutationScale = 0;
    for (const visual of GROWTH_VISUALS) {
      expect(visual.hitbox.centerX).toBeGreaterThan(0);
      expect(visual.hitbox.centerX).toBeLessThan(1);
      expect(visual.hitbox.centerY).toBeGreaterThan(0);
      expect(visual.hitbox.centerY).toBeLessThan(1);
      expect(visual.hitbox.radiusX).toBeGreaterThan(0);
      expect(visual.hitbox.radiusY).toBeGreaterThan(0);
      expect(visual.mutationScale).toBeGreaterThanOrEqual(previousMutationScale);
      previousMutationScale = visual.mutationScale;
    }
  });

  it('keeps Mutation treatments secondary once the world becomes the scale reference', () => {
    for (const stageId of [0, 1, 2, 3]) {
      expect(getGrowthVisual(stageId).mutationAlpha).toBe(1);
    }

    const giantAlphas = [4, 5, 6, 7, 8].map((stageId) => getGrowthVisual(stageId).mutationAlpha);
    expect(giantAlphas[0]).toBeLessThanOrEqual(0.34);
    for (let index = 1; index < giantAlphas.length; index += 1) {
      expect(giantAlphas[index]).toBeLessThan(giantAlphas[index - 1]!);
    }
  });

  it('falls back safely to the base hero for unknown stage ids', () => {
    expect(getGrowthVisual(999)).toBe(getGrowthVisual(0));
  });
});

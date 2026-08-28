import { MEME_PIGEON_HERO_DATA_URL } from '../assets/meme-pigeon/hero-data';

export interface GrowthHitboxDefinition {
  readonly centerX: number;
  readonly centerY: number;
  readonly radiusX: number;
  readonly radiusY: number;
}

export interface GrowthVisualDefinition {
  readonly stageId: number;
  readonly textureKey: string;
  readonly art: string;
  readonly sceneZoom: number;
  readonly mutationScale: number;
  readonly mutationAlpha: number;
  readonly hitbox: GrowthHitboxDefinition;
}

/**
 * Canonical player identity supplied by the user. Growth may change framing and
 * scale, but it must never silently replace this blue, orange-lipped meme pigeon
 * with a generic/grey pigeon render.
 */
const CANONICAL_HERO_ART = MEME_PIGEON_HERO_DATA_URL;
const CANONICAL_HERO_KEY = 'meme-pigeon-canonical';

// Normalized silhouette in the original meme-raster source. Kept aligned with
// presentation/hero-layout.ts so click targeting and UI-safe placement agree.
const CANONICAL_HITBOX: GrowthHitboxDefinition = {
  centerX: 0.51,
  centerY: 0.685,
  radiusX: 0.23,
  radiusY: 0.255,
};

export const GROWTH_VISUALS: readonly GrowthVisualDefinition[] = [
  { stageId: 0, textureKey: CANONICAL_HERO_KEY, art: CANONICAL_HERO_ART, sceneZoom: 1.000, mutationScale: 1, mutationAlpha: 0, hitbox: CANONICAL_HITBOX },
  { stageId: 1, textureKey: CANONICAL_HERO_KEY, art: CANONICAL_HERO_ART, sceneZoom: 1.018, mutationScale: 1, mutationAlpha: 0, hitbox: CANONICAL_HITBOX },
  { stageId: 2, textureKey: CANONICAL_HERO_KEY, art: CANONICAL_HERO_ART, sceneZoom: 1.036, mutationScale: 1, mutationAlpha: 0, hitbox: CANONICAL_HITBOX },
  { stageId: 3, textureKey: CANONICAL_HERO_KEY, art: CANONICAL_HERO_ART, sceneZoom: 1.054, mutationScale: 1, mutationAlpha: 0, hitbox: CANONICAL_HITBOX },
  { stageId: 4, textureKey: CANONICAL_HERO_KEY, art: CANONICAL_HERO_ART, sceneZoom: 1.072, mutationScale: 1, mutationAlpha: 0, hitbox: CANONICAL_HITBOX },
  { stageId: 5, textureKey: CANONICAL_HERO_KEY, art: CANONICAL_HERO_ART, sceneZoom: 1.090, mutationScale: 1, mutationAlpha: 0, hitbox: CANONICAL_HITBOX },
  { stageId: 6, textureKey: CANONICAL_HERO_KEY, art: CANONICAL_HERO_ART, sceneZoom: 1.108, mutationScale: 1, mutationAlpha: 0, hitbox: CANONICAL_HITBOX },
  { stageId: 7, textureKey: CANONICAL_HERO_KEY, art: CANONICAL_HERO_ART, sceneZoom: 1.126, mutationScale: 1, mutationAlpha: 0, hitbox: CANONICAL_HITBOX },
  { stageId: 8, textureKey: CANONICAL_HERO_KEY, art: CANONICAL_HERO_ART, sceneZoom: 1.144, mutationScale: 1, mutationAlpha: 0, hitbox: CANONICAL_HITBOX },
] as const;

export function getGrowthVisual(stageId: number): GrowthVisualDefinition {
  return GROWTH_VISUALS[stageId] ?? GROWTH_VISUALS[0]!;
}

export function getUniqueGrowthVisuals(): readonly GrowthVisualDefinition[] {
  return [GROWTH_VISUALS[0]!];
}

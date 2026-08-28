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
  readonly hitbox: GrowthHitboxDefinition;
}

const BASE_HERO_ART = '/assets/generated/main_scene_hero.webp';
const BASE_HERO_KEY = 'generated-main-hero';

const BASE_HITBOX: GrowthHitboxDefinition = {
  centerX: 0.535,
  centerY: 0.545,
  radiusX: 0.31,
  radiusY: 0.42,
};

export const GROWTH_VISUALS: readonly GrowthVisualDefinition[] = [
  {
    stageId: 0,
    textureKey: BASE_HERO_KEY,
    art: BASE_HERO_ART,
    sceneZoom: 1,
    mutationScale: 1,
    hitbox: BASE_HITBOX,
  },
  {
    stageId: 1,
    textureKey: BASE_HERO_KEY,
    art: BASE_HERO_ART,
    sceneZoom: 1.018,
    mutationScale: 1,
    hitbox: BASE_HITBOX,
  },
  {
    stageId: 2,
    textureKey: BASE_HERO_KEY,
    art: BASE_HERO_ART,
    sceneZoom: 1.036,
    mutationScale: 1,
    hitbox: BASE_HITBOX,
  },
  {
    stageId: 3,
    textureKey: BASE_HERO_KEY,
    art: BASE_HERO_ART,
    sceneZoom: 1.054,
    mutationScale: 1,
    hitbox: BASE_HITBOX,
  },
  {
    stageId: 4,
    textureKey: 'generated-growth-stage-4',
    art: '/assets/generated/growth_stage_04_human.png',
    sceneZoom: 1,
    mutationScale: 1.05,
    hitbox: { centerX: 0.51, centerY: 0.535, radiusX: 0.285, radiusY: 0.42 },
  },
  {
    stageId: 5,
    textureKey: 'generated-growth-stage-5',
    art: '/assets/generated/growth_stage_05_car.png',
    sceneZoom: 1,
    mutationScale: 1.09,
    hitbox: { centerX: 0.51, centerY: 0.53, radiusX: 0.31, radiusY: 0.43 },
  },
  {
    stageId: 6,
    textureKey: 'generated-growth-stage-6',
    art: '/assets/generated/growth_stage_06_building.png',
    sceneZoom: 1,
    mutationScale: 1.14,
    hitbox: { centerX: 0.505, centerY: 0.52, radiusX: 0.335, radiusY: 0.45 },
  },
  {
    stageId: 7,
    textureKey: 'generated-growth-stage-7',
    art: '/assets/generated/growth_stage_07_mega.png',
    sceneZoom: 1,
    mutationScale: 1.2,
    hitbox: { centerX: 0.505, centerY: 0.51, radiusX: 0.36, radiusY: 0.47 },
  },
  {
    stageId: 8,
    textureKey: 'generated-growth-stage-8',
    art: '/assets/generated/growth_stage_08_city.png',
    sceneZoom: 1,
    mutationScale: 1.26,
    hitbox: { centerX: 0.5, centerY: 0.49, radiusX: 0.39, radiusY: 0.49 },
  },
] as const;

export function getGrowthVisual(stageId: number): GrowthVisualDefinition {
  return GROWTH_VISUALS[stageId] ?? GROWTH_VISUALS[0]!;
}

export function getUniqueGrowthVisuals(): readonly GrowthVisualDefinition[] {
  const seen = new Set<string>();
  return GROWTH_VISUALS.filter((visual) => {
    if (seen.has(visual.textureKey)) return false;
    seen.add(visual.textureKey);
    return true;
  });
}

export type PigeonEventId = 'bread-rush' | 'pigeon-drop';

export const PIGEON_EVENT_SHARED_COOLDOWN_SECONDS = 5 * 60;

export interface BreadRushDefinition {
  readonly id: 'bread-rush';
  readonly unlockTotalLevel: number;
  readonly durationSeconds: number;
  readonly countdownSeconds: number;
  readonly cooldownActiveSeconds: number;
  readonly spawnIntervalSeconds: number;
  readonly targetLifetimeSeconds: number;
  readonly normalPoints: number;
  readonly goldenPoints: number;
  readonly goldenChance: number;
  readonly expectedScore: number;
  readonly normalizedScoreCap: number;
  readonly baseRewardSeconds: number;
  readonly performanceBase: number;
  readonly performancePerNormalizedScore: number;
  readonly performanceMax: number;
  readonly referenceTapsPerSecond: number;
  readonly referenceComboMultiplier: number;
}

export interface PigeonDropDefinition {
  readonly id: 'pigeon-drop';
  readonly unlockTotalLevel: number;
  readonly durationSeconds: number;
  readonly countdownSeconds: number;
  readonly cooldownActiveSeconds: number;
  readonly targetMinX: number;
  readonly targetMaxX: number;
  readonly targetSpeedPerSecond: number;
  readonly dropTravelSeconds: number;
  readonly attemptResetSeconds: number;
  readonly centerAccuracy: number;
  readonly nearAccuracy: number;
  readonly grazeAccuracy: number;
  readonly centerPoints: number;
  readonly nearPoints: number;
  readonly grazePoints: number;
  readonly expectedScore: number;
  readonly normalizedScoreCap: number;
  readonly baseRewardSeconds: number;
  readonly performanceBase: number;
  readonly performancePerNormalizedScore: number;
  readonly performanceMax: number;
  readonly referenceTapsPerSecond: number;
  readonly referenceComboMultiplier: number;
}

export const BREAD_RUSH: BreadRushDefinition = {
  id: 'bread-rush',
  unlockTotalLevel: 90,
  durationSeconds: 30,
  countdownSeconds: 3,
  cooldownActiveSeconds: 6 * 60,
  spawnIntervalSeconds: 0.9,
  targetLifetimeSeconds: 2.7,
  normalPoints: 1,
  goldenPoints: 4,
  goldenChance: 0.08,
  expectedScore: 22,
  normalizedScoreCap: 1.2,
  baseRewardSeconds: 60,
  performanceBase: 0.75,
  performancePerNormalizedScore: 1.25,
  performanceMax: 2,
  referenceTapsPerSecond: 3,
  referenceComboMultiplier: 1.15,
} as const;

// Second MVP Pigeon Event. Lv 180 deliberately lands after the first Mutation
// at 150 and before the next world-scale Growth beat at 240.
export const PIGEON_DROP: PigeonDropDefinition = {
  id: 'pigeon-drop',
  unlockTotalLevel: 180,
  durationSeconds: 30,
  countdownSeconds: 3,
  cooldownActiveSeconds: 7 * 60,
  targetMinX: 0.18,
  targetMaxX: 0.82,
  targetSpeedPerSecond: 0.29,
  dropTravelSeconds: 0.48,
  attemptResetSeconds: 0.62,
  centerAccuracy: 0.045,
  nearAccuracy: 0.10,
  grazeAccuracy: 0.16,
  centerPoints: 5,
  nearPoints: 2,
  grazePoints: 1,
  expectedScore: 30,
  normalizedScoreCap: 1.2,
  baseRewardSeconds: 75,
  performanceBase: 0.75,
  performancePerNormalizedScore: 1.25,
  performanceMax: 2,
  referenceTapsPerSecond: 3,
  referenceComboMultiplier: 1.15,
} as const;

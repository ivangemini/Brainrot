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

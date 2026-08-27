export type UpgradeBranchId = 'beak' | 'body' | 'nest' | 'wings' | 'swag' | 'brain';

export interface UpgradeDefinition {
  readonly id: UpgradeBranchId;
  readonly name: string;
  readonly icon: string;
  readonly unlockTotalLevel: number;
  readonly baseCost: number;
  readonly costGrowth: number;
  readonly milestoneLevels: readonly number[];
  readonly description: string;
  readonly nextDeltaLabel: string;
}

export const UPGRADE_ORDER: readonly UpgradeBranchId[] = [
  'beak',
  'body',
  'nest',
  'wings',
  'swag',
  'brain',
] as const;

export const UPGRADE_DEFINITIONS: Record<UpgradeBranchId, UpgradeDefinition> = {
  beak: {
    id: 'beak',
    name: 'Beak',
    icon: '/assets/ui/beak.png',
    unlockTotalLevel: 0,
    baseCost: 15,
    costGrowth: 1.18,
    milestoneLevels: [5, 10, 25, 50, 75, 100],
    description: 'Stronger pecks. More Feathers per tap.',
    nextDeltaLabel: '+0.20 base tap',
  },
  body: {
    id: 'body',
    name: 'Body',
    icon: '/assets/ui/body.png',
    unlockTotalLevel: 10,
    baseCost: 70,
    costGrowth: 1.20,
    milestoneLevels: [5, 10, 25, 50, 75, 100],
    description: 'Makes every source of Feathers stronger.',
    nextDeltaLabel: '+4% global production',
  },
  nest: {
    id: 'nest',
    name: 'Nest',
    icon: '/assets/ui/nest.png',
    unlockTotalLevel: 20,
    baseCost: 160,
    costGrowth: 1.18,
    milestoneLevels: [5, 10, 25, 50, 75, 100],
    description: 'Build a passive Feather machine.',
    nextDeltaLabel: '+0.30 Feathers/sec',
  },
  wings: {
    id: 'wings',
    name: 'Wings',
    icon: '/assets/ui/wings.png',
    unlockTotalLevel: 30,
    baseCost: 400,
    costGrowth: 1.19,
    milestoneLevels: [5, 10, 25, 50, 75, 100],
    description: 'Raise and preserve your active combo.',
    nextDeltaLabel: '+0.03 combo cap',
  },
  swag: {
    id: 'swag',
    name: 'Swag',
    icon: '/assets/ui/swag.png',
    unlockTotalLevel: 45,
    baseCost: 950,
    costGrowth: 1.20,
    milestoneLevels: [5, 10, 25, 50, 75, 100],
    description: 'More critical taps. More disrespect.',
    nextDeltaLabel: '+0.3% crit chance',
  },
  brain: {
    id: 'brain',
    name: 'Brain',
    icon: '/assets/ui/brain.png',
    unlockTotalLevel: 65,
    baseCost: 2500,
    costGrowth: 1.20,
    milestoneLevels: [5, 10, 25, 50, 75, 100],
    description: 'Automate pecks and improve offline gains.',
    nextDeltaLabel: '+0.12 auto taps/sec',
  },
};

export interface GrowthStageDefinition {
  readonly id: number;
  readonly threshold: number;
  readonly name: string;
  readonly subtitle: string;
  readonly bodyTier: 1 | 2 | 3;
  readonly scale: number;
}

export const GROWTH_STAGES: readonly GrowthStageDefinition[] = [
  { id: 0, threshold: 0, name: 'Street Pigeon', subtitle: 'Suspiciously ordinary.', bodyTier: 1, scale: 0.78 },
  { id: 1, threshold: 10, name: 'Chubby Pigeon', subtitle: 'The bench has noticed.', bodyTier: 1, scale: 0.86 },
  { id: 2, threshold: 25, name: 'Big Pigeon', subtitle: 'Human furniture feels smaller.', bodyTier: 2, scale: 0.94 },
  { id: 3, threshold: 50, name: 'Huge Pigeon', subtitle: 'People have started filming.', bodyTier: 2, scale: 1.03 },
  { id: 4, threshold: 90, name: 'Human-Sized Pigeon', subtitle: 'Municipal concern intensifies.', bodyTier: 3, scale: 1.12 },
  { id: 5, threshold: 150, name: 'Car Pigeon', subtitle: 'Traffic is now optional.', bodyTier: 3, scale: 1.22 },
  { id: 6, threshold: 240, name: 'Building Pigeon', subtitle: 'Urban planning has failed.', bodyTier: 3, scale: 1.34 },
  { id: 7, threshold: 360, name: 'Mega Pigeon', subtitle: 'Airspace negotiations begin.', bodyTier: 3, scale: 1.48 },
  { id: 8, threshold: 420, name: 'City Pigeon', subtitle: 'The pigeon is the landmark.', bodyTier: 3, scale: 1.62 },
] as const;

export const BALANCE_VERSION = 'economy-v0.1';

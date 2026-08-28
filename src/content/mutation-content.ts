export type MutationId = 'muscle' | 'business' | 'chaos';

export interface MutationDefinition {
  readonly id: MutationId;
  readonly name: string;
  readonly tagline: string;
  readonly playstyle: string;
  readonly modifiers: readonly string[];
  readonly art: string;
}

export const MUTATION_UNLOCK_TOTAL_LEVEL = 150;
export const MUTATION_REQUIRED_GROWTH_STAGE = 5;

export const MUSCLE_ACTIVE_TAP_MULTIPLIER = 1.35;
export const MUSCLE_COMBO_CAP_BONUS = 0.15;

export const BUSINESS_PASSIVE_MULTIPLIER = 1.35;
export const BUSINESS_OFFLINE_EFFICIENCY_BONUS = 0.10;
export const OFFLINE_EFFICIENCY_HARD_CAP = 0.85;

export const CHAOS_CRIT_CHANCE_BONUS = 0.05;
export const BASE_CRIT_CHANCE_CAP = 0.25;
// The first mutation tier adds exactly +5 percentage points above the base cap.
// Keeping the hard cap at 30% makes the advertised bonus meaningful even at max Swag
// without creating unspecified headroom for future mutation tiers.
export const MUTATION_CRIT_CHANCE_HARD_CAP = 0.30;
export const CHAOS_CRIT_MULTIPLIER = 1.15;
export const CHAOS_EVENT_REWARD_MULTIPLIER = 1.15;

export const MUTATION_ORDER: readonly MutationId[] = ['muscle', 'business', 'chaos'] as const;

export const MUTATION_DEFINITIONS: Record<MutationId, MutationDefinition> = {
  muscle: {
    id: 'muscle',
    name: 'Muscle Pigeon',
    tagline: 'Peck first. Ask never.',
    playstyle: 'Active tapping + sustained combo',
    modifiers: [
      'Active taps ×1.35',
      'Combo cap +0.15',
      'Passive production unchanged',
    ],
    art: '/assets/generated/mutation_muscle.png',
  },
  business: {
    id: 'business',
    name: 'Business Pigeon',
    tagline: 'The passive income has a tie now.',
    playstyle: 'Automation + offline progress',
    modifiers: [
      'Passive production ×1.35',
      'Offline efficiency +10%',
      'Upgrade prices unchanged',
    ],
    art: '/assets/generated/mutation_business.png',
  },
  chaos: {
    id: 'chaos',
    name: 'Chaos Pigeon',
    tagline: 'Statistics are merely a suggestion.',
    playstyle: 'Critical taps + Pigeon Events',
    modifiers: [
      'Crit chance +5% (30% hard cap)',
      'Crit multiplier ×1.15',
      'Pigeon Event rewards ×1.15',
    ],
    art: '/assets/generated/mutation_chaos.png',
  },
};

export function isMutationId(value: unknown): value is MutationId {
  return typeof value === 'string' && MUTATION_ORDER.includes(value as MutationId);
}

export function hasMutation(mutations: readonly MutationId[], id: MutationId): boolean {
  return mutations.includes(id);
}

import { BALANCE_VERSION, type UpgradeBranchId } from '../content/economy-content';
import type { PigeonEventId } from '../content/event-content';
import type { MutationId } from '../content/mutation-content';
import { createEmptyBranchLevels, type BranchLevels } from './economy-formulas';

export interface EventProgressState {
  breadRushBestScore: number;
  breadRushRuns: number;
  breadRushCooldownSeconds: number;
  pigeonDropBestScore: number;
  pigeonDropRuns: number;
  pigeonDropCooldownSeconds: number;
  sharedCooldownSeconds: number;
  lastEventId: PigeonEventId | null;
}

export interface GameState {
  schemaVersion: 1;
  balanceVersion: string;
  feathers: number;
  branchLevels: BranchLevels;
  mutationIds: MutationId[];
  comboCharge: number;
  lastTapAt: number;
  saveRevision: number;
  lastSavedAt: number;
  discoveredGrowthStages: number[];
  appliedRewardIds: string[];
  events: EventProgressState;
}

export function createNewGameState(now = Date.now()): GameState {
  return {
    schemaVersion: 1,
    balanceVersion: BALANCE_VERSION,
    feathers: 0,
    branchLevels: createEmptyBranchLevels(),
    mutationIds: [],
    comboCharge: 0,
    lastTapAt: 0,
    saveRevision: 0,
    lastSavedAt: now,
    discoveredGrowthStages: [0],
    appliedRewardIds: [],
    events: {
      breadRushBestScore: 0,
      breadRushRuns: 0,
      breadRushCooldownSeconds: 0,
      pigeonDropBestScore: 0,
      pigeonDropRuns: 0,
      pigeonDropCooldownSeconds: 0,
      sharedCooldownSeconds: 0,
      lastEventId: null,
    },
  };
}

export function cloneState(state: GameState): GameState {
  return {
    ...state,
    branchLevels: { ...state.branchLevels },
    mutationIds: [...state.mutationIds],
    discoveredGrowthStages: [...state.discoveredGrowthStages],
    appliedRewardIds: [...state.appliedRewardIds],
    events: { ...state.events },
  };
}

export function isUpgradeBranchId(value: string): value is UpgradeBranchId {
  return ['beak', 'body', 'nest', 'wings', 'swag', 'brain'].includes(value);
}

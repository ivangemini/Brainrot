import { BALANCE_VERSION, type UpgradeBranchId } from '../content/economy-content';
import { createEmptyBranchLevels, type BranchLevels } from './economy-formulas';

export interface EventProgressState {
  breadRushBestScore: number;
  breadRushRuns: number;
  breadRushCooldownSeconds: number;
}

export interface GameState {
  schemaVersion: 1;
  balanceVersion: string;
  feathers: number;
  branchLevels: BranchLevels;
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
    },
  };
}

export function cloneState(state: GameState): GameState {
  return {
    ...state,
    branchLevels: { ...state.branchLevels },
    discoveredGrowthStages: [...state.discoveredGrowthStages],
    appliedRewardIds: [...state.appliedRewardIds],
    events: { ...state.events },
  };
}

export function isUpgradeBranchId(value: string): value is UpgradeBranchId {
  return ['beak', 'body', 'nest', 'wings', 'swag', 'brain'].includes(value);
}

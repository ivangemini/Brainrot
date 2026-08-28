import { isPigeonEventId } from '../content/event-content';
import { isMutationId, type MutationId } from '../content/mutation-content';
import { getOfflineEfficiency, getPassiveRate } from '../domain/economy-formulas';
import { createNewGameState, type GameState } from '../domain/game-state';

const SAVE_KEY = 'pigeon-maxxing:save:v1';
const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
const MAX_APPLIED_REWARD_IDS = 128;
const MAX_PERSISTED_MUTATIONS = 8;

export interface LoadResult {
  readonly state: GameState;
  readonly offlineFeathers: number;
  readonly elapsedSeconds: number;
}

function sanitizeState(candidate: unknown, now: number): GameState {
  const fresh = createNewGameState(now);
  if (!candidate || typeof candidate !== 'object') return fresh;

  const raw = candidate as Partial<GameState>;
  if (raw.schemaVersion !== 1) return fresh;

  const branchLevels = raw.branchLevels;
  if (!branchLevels || typeof branchLevels !== 'object') return fresh;

  const readLevel = (key: keyof GameState['branchLevels']): number => {
    const value = branchLevels[key];
    return Number.isFinite(value) ? Math.max(0, Math.floor(value as number)) : 0;
  };

  const rewardIds = Array.isArray(raw.appliedRewardIds)
    ? Array.from(new Set(raw.appliedRewardIds.filter((value): value is string => (
      typeof value === 'string' && value.length > 0 && value.length <= 120
    )))).slice(-MAX_APPLIED_REWARD_IDS)
    : [];

  const mutationIds: MutationId[] = Array.isArray(raw.mutationIds)
    ? Array.from(new Set(raw.mutationIds.filter(isMutationId))).slice(0, MAX_PERSISTED_MUTATIONS)
    : [];

  const rawEvents = raw.events && typeof raw.events === 'object' ? raw.events : fresh.events;
  const readEventInteger = (value: unknown): number => (
    Number.isFinite(value) ? Math.max(0, Math.floor(value as number)) : 0
  );
  const readEventSeconds = (value: unknown): number => (
    Number.isFinite(value) ? Math.max(0, value as number) : 0
  );

  return {
    ...fresh,
    balanceVersion: typeof raw.balanceVersion === 'string' ? raw.balanceVersion : fresh.balanceVersion,
    feathers: Number.isFinite(raw.feathers) ? Math.max(0, raw.feathers as number) : 0,
    branchLevels: {
      beak: readLevel('beak'),
      body: readLevel('body'),
      nest: readLevel('nest'),
      wings: readLevel('wings'),
      swag: readLevel('swag'),
      brain: readLevel('brain'),
    },
    mutationIds,
    comboCharge: 0,
    lastTapAt: 0,
    saveRevision: Number.isFinite(raw.saveRevision) ? Math.max(0, Math.floor(raw.saveRevision as number)) : 0,
    lastSavedAt: Number.isFinite(raw.lastSavedAt) ? Math.min(now, raw.lastSavedAt as number) : now,
    discoveredGrowthStages: Array.isArray(raw.discoveredGrowthStages)
      ? raw.discoveredGrowthStages.filter((v): v is number => Number.isInteger(v) && v >= 0)
      : [0],
    appliedRewardIds: rewardIds,
    events: {
      breadRushBestScore: readEventInteger(rawEvents.breadRushBestScore),
      breadRushRuns: readEventInteger(rawEvents.breadRushRuns),
      breadRushCooldownSeconds: readEventSeconds(rawEvents.breadRushCooldownSeconds),
      pigeonDropBestScore: readEventInteger(rawEvents.pigeonDropBestScore),
      pigeonDropRuns: readEventInteger(rawEvents.pigeonDropRuns),
      pigeonDropCooldownSeconds: readEventSeconds(rawEvents.pigeonDropCooldownSeconds),
      sharedCooldownSeconds: readEventSeconds(rawEvents.sharedCooldownSeconds),
      lastEventId: isPigeonEventId(rawEvents.lastEventId) ? rawEvents.lastEventId : null,
    },
  };
}

export function loadGame(now = Date.now(), storage: Pick<Storage, 'getItem'> = localStorage): LoadResult {
  const serialized = storage.getItem(SAVE_KEY);
  if (!serialized) return { state: createNewGameState(now), offlineFeathers: 0, elapsedSeconds: 0 };

  try {
    const state = sanitizeState(JSON.parse(serialized), now);
    const elapsedSeconds = Math.max(0, Math.min(OFFLINE_CAP_SECONDS, (now - state.lastSavedAt) / 1000));
    const offlineEfficiency = getOfflineEfficiency(state.branchLevels, state.mutationIds);
    const offlineFeathers = getPassiveRate(state.branchLevels, state.mutationIds) * elapsedSeconds * offlineEfficiency;
    return { state, offlineFeathers, elapsedSeconds };
  } catch {
    return { state: createNewGameState(now), offlineFeathers: 0, elapsedSeconds: 0 };
  }
}

export function saveGame(
  state: Readonly<GameState>,
  now = Date.now(),
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  const payload: GameState = {
    ...state,
    branchLevels: { ...state.branchLevels },
    mutationIds: [...state.mutationIds].slice(0, MAX_PERSISTED_MUTATIONS),
    comboCharge: 0,
    lastTapAt: 0,
    lastSavedAt: now,
    saveRevision: state.saveRevision,
    discoveredGrowthStages: [...state.discoveredGrowthStages],
    appliedRewardIds: [...state.appliedRewardIds].slice(-MAX_APPLIED_REWARD_IDS),
    events: { ...state.events },
  };
  storage.setItem(SAVE_KEY, JSON.stringify(payload));
}

export function clearSave(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  storage.removeItem(SAVE_KEY);
}

import { BREAD_RUSH } from '../content/event-content';
import type { UpgradeBranchId } from '../content/economy-content';
import {
  MUTATION_REQUIRED_GROWTH_STAGE,
  MUTATION_UNLOCK_TOTAL_LEVEL,
  isMutationId,
  type MutationId,
} from '../content/mutation-content';
import {
  getComboCap,
  getCritChance,
  getGrowthStage,
  getPassiveRate,
  getTapPayout,
  getTotalUpgradeLevel,
  getUpgradeCost,
  isBranchUnlocked,
} from './economy-formulas';
import { cloneState, type GameState } from './game-state';

const MAX_APPLIED_REWARD_IDS = 128;

export interface TapResult {
  readonly payout: number;
  readonly critical: boolean;
  readonly comboMultiplier: number;
}

export interface PurchaseResult {
  readonly ok: boolean;
  readonly reason?: 'locked' | 'insufficient' | 'mutation-required';
  readonly branch: UpgradeBranchId;
  readonly oldLevel: number;
  readonly newLevel: number;
  readonly cost: number;
  readonly oldGrowthStage: number;
  readonly newGrowthStage: number;
}

export interface MutationSelectionResult {
  readonly applied: boolean;
  readonly mutationId: MutationId | null;
  readonly reason?: 'invalid' | 'not-eligible' | 'already-selected';
}

export interface RewardApplyResult {
  readonly applied: boolean;
  readonly reason?: 'duplicate' | 'invalid';
  readonly transactionId: string;
  readonly amount: number;
}

export type GameStoreListener = (state: Readonly<GameState>) => void;

export class GameStore {
  private readonly state: GameState;
  private readonly listeners = new Set<GameStoreListener>();
  private readonly random: () => number;

  public constructor(initialState: GameState, random: () => number = Math.random) {
    this.state = cloneState(initialState);
    this.random = random;
  }

  public getSnapshot(): Readonly<GameState> {
    return cloneState(this.state);
  }

  public subscribe(listener: GameStoreListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  public tap(now = performance.now()): TapResult {
    const sinceLastTap = this.state.lastTapAt === 0 ? Number.POSITIVE_INFINITY : now - this.state.lastTapAt;
    if (sinceLastTap > 750) {
      this.state.comboCharge = Math.max(0, this.state.comboCharge - Math.min(0.35, sinceLastTap / 8000));
    }

    this.state.comboCharge = Math.min(1, this.state.comboCharge + 0.045);
    this.state.lastTapAt = now;

    const comboCap = getComboCap(this.state.branchLevels, this.state.mutationIds);
    const comboMultiplier = 1 + (comboCap - 1) * this.state.comboCharge;
    const critical = this.random() < getCritChance(this.state.branchLevels, this.state.mutationIds);
    const payout = getTapPayout(this.state.branchLevels, comboMultiplier, critical, this.state.mutationIds);

    this.state.feathers += payout;
    this.emit();
    return { payout, critical, comboMultiplier };
  }

  public tick(deltaSeconds: number, now = performance.now()): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;

    let changed = false;
    const passive = getPassiveRate(this.state.branchLevels, this.state.mutationIds);
    if (passive > 0) {
      this.state.feathers += passive * deltaSeconds;
      changed = true;
    }

    if (this.state.events.breadRushCooldownSeconds > 0) {
      const nextCooldown = Math.max(0, this.state.events.breadRushCooldownSeconds - deltaSeconds);
      if (nextCooldown !== this.state.events.breadRushCooldownSeconds) {
        this.state.events.breadRushCooldownSeconds = nextCooldown;
        changed = true;
      }
    }

    if (this.state.lastTapAt > 0 && now - this.state.lastTapAt > 750 && this.state.comboCharge > 0) {
      const retention = 1 + this.state.branchLevels.wings * 0.012;
      const nextCharge = Math.max(0, this.state.comboCharge - deltaSeconds * (0.46 / retention));
      if (nextCharge !== this.state.comboCharge) {
        this.state.comboCharge = nextCharge;
        changed = true;
      }
    }

    if (changed) this.emit();
  }

  public purchase(branch: UpgradeBranchId): PurchaseResult {
    const oldLevel = this.state.branchLevels[branch];
    const oldGrowthStage = getGrowthStage(getTotalUpgradeLevel(this.state.branchLevels)).id;
    const cost = getUpgradeCost(branch, oldLevel);

    if (this.isMutationEligible()) {
      return {
        ok: false,
        reason: 'mutation-required',
        branch,
        oldLevel,
        newLevel: oldLevel,
        cost,
        oldGrowthStage,
        newGrowthStage: oldGrowthStage,
      };
    }

    if (!isBranchUnlocked(branch, this.state.branchLevels)) {
      return {
        ok: false,
        reason: 'locked',
        branch,
        oldLevel,
        newLevel: oldLevel,
        cost,
        oldGrowthStage,
        newGrowthStage: oldGrowthStage,
      };
    }

    if (this.state.feathers + 1e-9 < cost) {
      return {
        ok: false,
        reason: 'insufficient',
        branch,
        oldLevel,
        newLevel: oldLevel,
        cost,
        oldGrowthStage,
        newGrowthStage: oldGrowthStage,
      };
    }

    this.state.feathers = Math.max(0, this.state.feathers - cost);
    this.state.branchLevels[branch] = oldLevel + 1;

    const newGrowthStage = getGrowthStage(getTotalUpgradeLevel(this.state.branchLevels)).id;
    if (!this.state.discoveredGrowthStages.includes(newGrowthStage)) {
      this.state.discoveredGrowthStages.push(newGrowthStage);
    }

    this.emit();
    return {
      ok: true,
      branch,
      oldLevel,
      newLevel: oldLevel + 1,
      cost,
      oldGrowthStage,
      newGrowthStage,
    };
  }

  public isMutationEligible(state: Readonly<GameState> = this.state): boolean {
    if (state.mutationIds.length > 0) return false;
    const total = getTotalUpgradeLevel(state.branchLevels);
    return total >= MUTATION_UNLOCK_TOTAL_LEVEL
      && getGrowthStage(total).id >= MUTATION_REQUIRED_GROWTH_STAGE;
  }

  public selectMutation(value: string): MutationSelectionResult {
    if (!isMutationId(value)) {
      return { applied: false, mutationId: null, reason: 'invalid' };
    }

    if (this.state.mutationIds.includes(value)) {
      return { applied: false, mutationId: value, reason: 'already-selected' };
    }

    if (!this.isMutationEligible()) {
      return {
        applied: false,
        mutationId: this.state.mutationIds[0] ?? null,
        reason: this.state.mutationIds.length > 0 ? 'already-selected' : 'not-eligible',
      };
    }

    this.state.mutationIds.push(value);
    this.emit();
    return { applied: true, mutationId: value };
  }

  public addFeathers(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.state.feathers += amount;
    this.emit();
  }

  public isBreadRushAvailable(): boolean {
    return !this.isMutationEligible()
      && getTotalUpgradeLevel(this.state.branchLevels) >= BREAD_RUSH.unlockTotalLevel
      && this.state.events.breadRushCooldownSeconds <= 0;
  }

  public recordBreadRushCompletion(score: number): void {
    const safeScore = Math.max(0, Math.floor(Number.isFinite(score) ? score : 0));
    this.state.events.breadRushRuns += 1;
    this.state.events.breadRushBestScore = Math.max(this.state.events.breadRushBestScore, safeScore);
    this.state.events.breadRushCooldownSeconds = BREAD_RUSH.cooldownActiveSeconds;
    this.emit();
  }

  public hasAppliedReward(transactionId: string): boolean {
    return this.state.appliedRewardIds.includes(transactionId);
  }

  public applyRewardOnce(transactionId: string, amount: number): RewardApplyResult {
    const normalizedId = transactionId.trim();
    if (!normalizedId || normalizedId.length > 120 || !Number.isFinite(amount) || amount <= 0) {
      return { applied: false, reason: 'invalid', transactionId: normalizedId, amount: 0 };
    }

    if (this.state.appliedRewardIds.includes(normalizedId)) {
      return { applied: false, reason: 'duplicate', transactionId: normalizedId, amount: 0 };
    }

    this.state.feathers += amount;
    this.state.appliedRewardIds.push(normalizedId);
    if (this.state.appliedRewardIds.length > MAX_APPLIED_REWARD_IDS) {
      this.state.appliedRewardIds.splice(0, this.state.appliedRewardIds.length - MAX_APPLIED_REWARD_IDS);
    }
    this.emit();
    return { applied: true, transactionId: normalizedId, amount };
  }

  public markSaved(now = Date.now()): void {
    this.state.lastSavedAt = now;
    this.state.saveRevision += 1;
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}

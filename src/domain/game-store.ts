import type { UpgradeBranchId } from '../content/economy-content';
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

export interface TapResult {
  readonly payout: number;
  readonly critical: boolean;
  readonly comboMultiplier: number;
}

export interface PurchaseResult {
  readonly ok: boolean;
  readonly reason?: 'locked' | 'insufficient';
  readonly branch: UpgradeBranchId;
  readonly oldLevel: number;
  readonly newLevel: number;
  readonly cost: number;
  readonly oldGrowthStage: number;
  readonly newGrowthStage: number;
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

    const comboCap = getComboCap(this.state.branchLevels);
    const comboMultiplier = 1 + (comboCap - 1) * this.state.comboCharge;
    const critical = this.random() < getCritChance(this.state.branchLevels);
    const payout = getTapPayout(this.state.branchLevels, comboMultiplier, critical);

    this.state.feathers += payout;
    this.emit();
    return { payout, critical, comboMultiplier };
  }

  public tick(deltaSeconds: number, now = performance.now()): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;

    let changed = false;
    const passive = getPassiveRate(this.state.branchLevels);
    if (passive > 0) {
      this.state.feathers += passive * deltaSeconds;
      changed = true;
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

  public addFeathers(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.state.feathers += amount;
    this.emit();
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

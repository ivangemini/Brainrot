import {
  UPGRADE_DEFINITIONS,
  UPGRADE_ORDER,
  type UpgradeBranchId,
} from '../content/economy-content';
import {
  formatEconomyNumber,
  getComboCap,
  getGrowthStage,
  getNextGrowthStage,
  getNextMilestone,
  getPassiveRate,
  getTotalUpgradeLevel,
  getUpgradeCost,
  isBranchUnlocked,
} from '../domain/economy-formulas';
import type { GameStore } from '../domain/game-store';
import type { GameState } from '../domain/game-state';

export interface UiShell {
  readonly destroy: () => void;
  readonly showOfflineReward: (amount: number, seconds: number) => void;
}

export function createUiShell(root: HTMLElement, store: GameStore): UiShell {
  root.innerHTML = `
    <header class="top-hud">
      <div class="currency-card glass-panel">
        <img src="/assets/ui/feather.png" alt="" />
        <div>
          <span class="eyebrow">FEATHERS</span>
          <strong id="feather-total">0</strong>
          <small id="passive-rate">Tap the pigeon</small>
        </div>
      </div>
      <div class="growth-card glass-panel">
        <div class="growth-copy">
          <span class="eyebrow" id="growth-stage">STREET PIGEON</span>
          <strong id="growth-progress-copy">0 / 10</strong>
        </div>
        <div class="growth-track" aria-label="Growth progress">
          <div id="growth-fill"></div>
        </div>
        <small id="growth-next">Next: the bench gets nervous.</small>
      </div>
      <div class="combo-card glass-panel">
        <span class="eyebrow">COMBO</span>
        <strong id="combo-value">x1.00</strong>
        <div class="combo-track"><div id="combo-fill"></div></div>
      </div>
    </header>

    <div class="tap-hint" id="tap-hint">
      <strong>TAP THE PIGEON</strong>
      <span>Earn Feathers. Make bad decisions.</span>
    </div>

    <aside class="upgrade-panel glass-panel" aria-label="Pigeon upgrades">
      <div class="upgrade-heading">
        <div>
          <span class="eyebrow">MAXXING LAB</span>
          <h1>Upgrade the pigeon</h1>
        </div>
        <div class="total-level">
          <span>Total</span>
          <strong id="total-level">0</strong>
        </div>
      </div>
      <div id="upgrade-list" class="upgrade-list"></div>
    </aside>

    <div id="toast-host" class="toast-host" aria-live="polite"></div>
  `;

  const featherTotal = mustElement(root, '#feather-total');
  const passiveRate = mustElement(root, '#passive-rate');
  const growthStage = mustElement(root, '#growth-stage');
  const growthProgressCopy = mustElement(root, '#growth-progress-copy');
  const growthFill = mustElement(root, '#growth-fill');
  const growthNext = mustElement(root, '#growth-next');
  const comboValue = mustElement(root, '#combo-value');
  const comboFill = mustElement(root, '#combo-fill');
  const totalLevel = mustElement(root, '#total-level');
  const upgradeList = mustElement(root, '#upgrade-list');
  const tapHint = mustElement(root, '#tap-hint');
  const toastHost = mustElement(root, '#toast-host');

  const upgradeButtons = new Map<UpgradeBranchId, HTMLButtonElement>();
  let previousState: Readonly<GameState> | undefined;

  const render = (state: Readonly<GameState>): void => {
    const total = getTotalUpgradeLevel(state.branchLevels);
    const currentStage = getGrowthStage(total);
    const nextStage = getNextGrowthStage(total);
    const passive = getPassiveRate(state.branchLevels);
    const comboCap = getComboCap(state.branchLevels);
    const comboMultiplier = 1 + (comboCap - 1) * state.comboCharge;

    featherTotal.textContent = formatEconomyNumber(state.feathers);
    passiveRate.textContent = passive > 0 ? `+${formatEconomyNumber(passive)}/sec` : 'Tap the pigeon';
    totalLevel.textContent = String(total);
    growthStage.textContent = currentStage.name.toUpperCase();
    comboValue.textContent = `x${comboMultiplier.toFixed(2)}`;
    comboFill.style.width = `${Math.round(state.comboCharge * 100)}%`;

    if (nextStage) {
      const span = nextStage.threshold - currentStage.threshold;
      const progress = Math.max(0, Math.min(1, (total - currentStage.threshold) / span));
      growthProgressCopy.textContent = `${total} / ${nextStage.threshold}`;
      growthFill.style.width = `${Math.round(progress * 100)}%`;
      growthNext.textContent = `Next: ${nextStage.name} — ${nextStage.subtitle}`;
    } else {
      growthProgressCopy.textContent = `${total} / MAX`;
      growthFill.style.width = '100%';
      growthNext.textContent = 'This city cannot contain you.';
    }

    tapHint.classList.toggle('is-hidden', state.feathers > 5 || total > 0);
    renderUpgradeCards(state, upgradeList, upgradeButtons, store, toastHost);

    if (previousState) {
      const oldTotal = getTotalUpgradeLevel(previousState.branchLevels);
      const oldStage = getGrowthStage(oldTotal);
      if (currentStage.id > oldStage.id) {
        showToast(toastHost, `${currentStage.name}: ${currentStage.subtitle}`, 'growth');
      }

      for (const branch of UPGRADE_ORDER) {
        const oldLevel = previousState.branchLevels[branch];
        const newLevel = state.branchLevels[branch];
        if (newLevel <= oldLevel) continue;
        const milestone = UPGRADE_DEFINITIONS[branch].milestoneLevels.includes(newLevel);
        if (milestone) showToast(toastHost, `${UPGRADE_DEFINITIONS[branch].name} Lv ${newLevel} — visual upgrade`, 'milestone');
      }
    }

    previousState = state;
  };

  const unsubscribe = store.subscribe(render);

  return {
    destroy: unsubscribe,
    showOfflineReward: (amount, seconds) => {
      if (amount <= 0) return;
      showToast(
        toastHost,
        `While you were gone: +${formatEconomyNumber(amount)} Feathers (${formatDuration(seconds)})`,
        'offline',
      );
    },
  };
}

function renderUpgradeCards(
  state: Readonly<GameState>,
  list: HTMLElement,
  buttonMap: Map<UpgradeBranchId, HTMLButtonElement>,
  store: GameStore,
  toastHost: HTMLElement,
): void {
  const total = getTotalUpgradeLevel(state.branchLevels);

  for (const branch of UPGRADE_ORDER) {
    const definition = UPGRADE_DEFINITIONS[branch];
    const unlocked = isBranchUnlocked(branch, state.branchLevels);
    const nearUnlock = definition.unlockTotalLevel - total <= 10;
    const existing = list.querySelector<HTMLElement>(`[data-branch="${branch}"]`);

    if (!unlocked && !nearUnlock && existing) {
      existing.remove();
      buttonMap.delete(branch);
      continue;
    }
    if (!unlocked && !nearUnlock) continue;

    const level = state.branchLevels[branch];
    const cost = getUpgradeCost(branch, level);
    const milestone = getNextMilestone(branch, level);
    const affordable = unlocked && state.feathers + 1e-9 >= cost;

    let card = existing;
    if (!card) {
      card = document.createElement('article');
      card.className = 'upgrade-card';
      card.dataset.branch = branch;
      card.innerHTML = `
        <img class="upgrade-icon" src="${definition.icon}" alt="" />
        <div class="upgrade-copy">
          <div class="upgrade-title-row">
            <strong class="upgrade-name"></strong>
            <span class="upgrade-level"></span>
          </div>
          <small class="upgrade-description"></small>
          <div class="milestone-copy"></div>
        </div>
        <button type="button" class="buy-button"></button>
      `;
      list.append(card);
      const button = card.querySelector<HTMLButtonElement>('.buy-button')!;
      buttonMap.set(branch, button);
      button.addEventListener('click', () => {
        const result = store.purchase(branch);
        if (!result.ok) {
          showToast(
            toastHost,
            result.reason === 'locked'
              ? `Reach Total Lv ${definition.unlockTotalLevel} to unlock ${definition.name}.`
              : 'Not enough Feathers.',
            'reject',
          );
          card?.classList.remove('reject');
          void card?.offsetWidth;
          card?.classList.add('reject');
        }
      });
    }

    card.classList.toggle('locked', !unlocked);
    card.classList.toggle('affordable', affordable);
    card.querySelector<HTMLElement>('.upgrade-name')!.textContent = definition.name;
    card.querySelector<HTMLElement>('.upgrade-level')!.textContent = unlocked ? `Lv ${level}` : 'LOCKED';
    card.querySelector<HTMLElement>('.upgrade-description')!.textContent = unlocked
      ? `${definition.nextDeltaLabel} · ${definition.description}`
      : `Unlocks at Total Lv ${definition.unlockTotalLevel}`;
    card.querySelector<HTMLElement>('.milestone-copy')!.textContent = unlocked && milestone
      ? `Next visual milestone: Lv ${milestone} (${milestone - level} away)`
      : unlocked
        ? 'Era mastery reached'
        : 'Keep maxxing';

    const button = buttonMap.get(branch)!;
    button.disabled = !unlocked;
    button.innerHTML = unlocked
      ? `<span>BUY</span><b>${formatEconomyNumber(cost)}</b>`
      : `<span>UNLOCK</span><b>${definition.unlockTotalLevel}</b>`;
    button.setAttribute('aria-label', unlocked
      ? `Buy ${definition.name} level ${level + 1} for ${formatEconomyNumber(cost)} Feathers`
      : `${definition.name} unlocks at total level ${definition.unlockTotalLevel}`);
  }
}

function mustElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Missing UI element: ${selector}`);
  return element;
}

function showToast(host: HTMLElement, message: string, kind: string): void {
  const toast = document.createElement('div');
  toast.className = `toast toast-${kind}`;
  toast.textContent = message;
  host.append(toast);
  window.setTimeout(() => toast.classList.add('show'), 10);
  window.setTimeout(() => {
    toast.classList.remove('show');
    window.setTimeout(() => toast.remove(), 220);
  }, 2500);
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

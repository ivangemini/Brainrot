import { formatEconomyNumber } from '../domain/economy-formulas';
import type { BreadRushSnapshot } from '../domain/bread-rush';
import type { BreadRushResult } from '../events/bread-rush-service';
import type { RewardDoubleResult } from '../monetization/monetization-service';

export interface BreadRushUi {
  readonly showOffer: (onStart: () => void) => void;
  readonly hideOffer: () => void;
  readonly showActive: () => void;
  readonly updateActive: (snapshot: BreadRushSnapshot) => void;
  readonly showResult: (
    result: BreadRushResult,
    canDouble: boolean,
    onDouble: () => Promise<RewardDoubleResult>,
    onContinue: () => void,
  ) => void;
  readonly hideEvent: () => void;
  readonly destroy: () => void;
}

export function createBreadRushUi(root: HTMLElement): BreadRushUi {
  const host = document.createElement('div');
  host.className = 'bread-rush-host';
  host.innerHTML = `
    <button type="button" class="bread-rush-offer glass-panel" hidden>
      <img src="/assets/events/bread_normal.png" alt="" />
      <span><small>EVENT READY</small><strong>BREAD RUSH</strong></span>
      <b>PLAY</b>
    </button>
    <div class="bread-rush-hud" hidden>
      <div class="bread-rush-score glass-panel"><small>SCORE</small><strong>0</strong></div>
      <div class="bread-rush-title"><small>PIGEON EVENT</small><strong>BREAD RUSH</strong></div>
      <div class="bread-rush-time glass-panel"><small>TIME</small><strong>30.0</strong></div>
      <div class="bread-rush-countdown"></div>
    </div>
    <div class="bread-rush-result-shell" hidden></div>
  `;
  root.append(host);

  const offer = host.querySelector<HTMLButtonElement>('.bread-rush-offer')!;
  const hud = host.querySelector<HTMLElement>('.bread-rush-hud')!;
  const score = host.querySelector<HTMLElement>('.bread-rush-score strong')!;
  const time = host.querySelector<HTMLElement>('.bread-rush-time strong')!;
  const countdown = host.querySelector<HTMLElement>('.bread-rush-countdown')!;
  const resultShell = host.querySelector<HTMLElement>('.bread-rush-result-shell')!;
  let startHandler: (() => void) | undefined;

  const clickOffer = (): void => startHandler?.();
  offer.addEventListener('click', clickOffer);

  return {
    showOffer: (onStart) => {
      startHandler = onStart;
      offer.hidden = false;
    },
    hideOffer: () => {
      offer.hidden = true;
      startHandler = undefined;
    },
    showActive: () => {
      root.classList.add('event-mode');
      offer.hidden = true;
      resultShell.hidden = true;
      hud.hidden = false;
    },
    updateActive: (snapshot) => {
      score.textContent = String(snapshot.score);
      time.textContent = snapshot.timeRemaining.toFixed(1);
      if (snapshot.phase === 'countdown') {
        countdown.textContent = snapshot.countdownRemaining <= 0.12
          ? 'GO!'
          : String(Math.max(1, Math.ceil(snapshot.countdownRemaining)));
        countdown.classList.add('visible');
      } else {
        countdown.classList.remove('visible');
      }
    },
    showResult: (result, canDouble, onDouble, onContinue) => {
      hud.hidden = true;
      resultShell.hidden = false;
      resultShell.replaceChildren();
      const card = document.createElement('section');
      card.className = 'bread-rush-result glass-panel';
      card.innerHTML = `
        <span class="eyebrow">EVENT COMPLETE</span>
        <h2>BREAD RUSH</h2>
        <div class="bread-rush-result-grid">
          <div><small>SCORE</small><strong>${result.score}</strong></div>
          <div><small>BEST</small><strong>${result.bestScore}</strong></div>
          <div><small>REWARD</small><strong>+${formatEconomyNumber(result.baseReward)}</strong></div>
        </div>
        <p>${result.isNewBest ? 'NEW PERSONAL BEST · ' : ''}Base reward secured. Performance ×${result.performanceMultiplier.toFixed(2)}.</p>
        <div class="bread-rush-result-actions">
          <button type="button" class="event-double" ${canDouble ? '' : 'disabled'}>
            <span>${canDouble ? 'WATCH AD' : 'NO AD'}</span>
            <b>${canDouble ? '2× REWARD' : 'BASE KEPT'}</b>
          </button>
          <button type="button" class="event-continue"><span>BACK TO CITY</span><b>CONTINUE</b></button>
        </div>
        <small class="bread-rush-result-status">${canDouble ? `Watch an ad to add another +${formatEconomyNumber(result.baseReward)} Feathers.` : 'Rewarded ads are unavailable; nothing is lost.'}</small>
      `;
      resultShell.append(card);

      const doubleButton = card.querySelector<HTMLButtonElement>('.event-double')!;
      const continueButton = card.querySelector<HTMLButtonElement>('.event-continue')!;
      const status = card.querySelector<HTMLElement>('.bread-rush-result-status')!;

      doubleButton.addEventListener('click', async () => {
        if (!canDouble || doubleButton.disabled) return;
        doubleButton.disabled = true;
        doubleButton.innerHTML = '<span>OPENING</span><b>AD…</b>';
        status.textContent = 'Base reward is already safe.';
        const doubled = await onDouble();
        if (doubled.status === 'rewarded') {
          doubleButton.innerHTML = '<span>CLAIMED</span><b>2× REWARD</b>';
          status.textContent = `Bonus secured: +${formatEconomyNumber(doubled.amount)} Feathers.`;
          card.classList.add('rewarded');
        } else if (doubled.status === 'closed') {
          doubleButton.disabled = false;
          doubleButton.innerHTML = '<span>TRY AGAIN</span><b>2× REWARD</b>';
          status.textContent = 'Ad closed before reward confirmation. Base reward remains yours.';
        } else if (doubled.status === 'duplicate') {
          doubleButton.innerHTML = '<span>ALREADY</span><b>CLAIMED</b>';
          status.textContent = 'This bonus was already applied.';
        } else {
          doubleButton.innerHTML = '<span>NO BONUS</span><b>BASE KEPT</b>';
          status.textContent = 'Rewarded ad unavailable. Base reward remains yours.';
        }
      });
      continueButton.addEventListener('click', onContinue, { once: true });
    },
    hideEvent: () => {
      root.classList.remove('event-mode');
      hud.hidden = true;
      resultShell.hidden = true;
      resultShell.replaceChildren();
      countdown.classList.remove('visible');
    },
    destroy: () => {
      offer.removeEventListener('click', clickOffer);
      host.remove();
    },
  };
}

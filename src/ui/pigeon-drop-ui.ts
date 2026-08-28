import { formatEconomyNumber } from '../domain/economy-formulas';
import type { PigeonDropSnapshot } from '../domain/pigeon-drop';
import type { PigeonDropResult } from '../events/pigeon-drop-service';
import type { RewardDoubleResult } from '../monetization/monetization-service';

export interface PigeonDropUi {
  readonly showOffer: (onStart: () => void) => void;
  readonly hideOffer: () => void;
  readonly showActive: (onDrop: () => boolean) => void;
  readonly updateActive: (snapshot: PigeonDropSnapshot) => void;
  readonly showResult: (
    result: PigeonDropResult,
    canDouble: boolean,
    onDouble: () => Promise<RewardDoubleResult>,
    onContinue: () => void,
  ) => void;
  readonly hideEvent: () => void;
  readonly destroy: () => void;
}

export function createPigeonDropUi(root: HTMLElement): PigeonDropUi {
  const host = document.createElement('div');
  host.className = 'pigeon-drop-host';
  host.innerHTML = `
    <button type="button" class="pigeon-drop-offer glass-panel" hidden>
      <img src="/assets/ui/tap_burst.png" alt="" />
      <span><small>NEW EVENT READY</small><strong>PIGEON DROP</strong></span>
      <b>PLAY</b>
    </button>
    <div class="pigeon-drop-hud" hidden>
      <div class="pigeon-drop-score glass-panel"><small>SCORE</small><strong>0</strong></div>
      <div class="pigeon-drop-title"><small>PIGEON EVENT</small><strong>PIGEON DROP</strong></div>
      <div class="pigeon-drop-attempts glass-panel"><small>HITS</small><strong>0</strong></div>
      <div class="pigeon-drop-time glass-panel"><small>TIME</small><strong>30.0</strong></div>
      <div class="pigeon-drop-countdown"></div>
      <button type="button" class="pigeon-drop-action" disabled>
        <span>LINE UP THE TARGET</span>
        <b>DROP NOW</b>
      </button>
      <small class="pigeon-drop-tip">Perfect center hit = 5 points · tap anywhere or use the button</small>
    </div>
    <div class="pigeon-drop-result-shell" hidden></div>
  `;
  root.append(host);

  const offer = host.querySelector<HTMLButtonElement>('.pigeon-drop-offer')!;
  const hud = host.querySelector<HTMLElement>('.pigeon-drop-hud')!;
  const score = host.querySelector<HTMLElement>('.pigeon-drop-score strong')!;
  const attempts = host.querySelector<HTMLElement>('.pigeon-drop-attempts strong')!;
  const time = host.querySelector<HTMLElement>('.pigeon-drop-time strong')!;
  const countdown = host.querySelector<HTMLElement>('.pigeon-drop-countdown')!;
  const action = host.querySelector<HTMLButtonElement>('.pigeon-drop-action')!;
  const resultShell = host.querySelector<HTMLElement>('.pigeon-drop-result-shell')!;
  let startHandler: (() => void) | undefined;
  let dropHandler: (() => boolean) | undefined;

  const clickOffer = (): void => startHandler?.();
  const clickDrop = (): void => { dropHandler?.(); };
  offer.addEventListener('click', clickOffer);
  action.addEventListener('click', clickDrop);

  return {
    showOffer: (onStart) => {
      startHandler = onStart;
      offer.hidden = false;
    },
    hideOffer: () => {
      offer.hidden = true;
      startHandler = undefined;
    },
    showActive: (onDrop) => {
      root.classList.add('event-mode', 'pigeon-drop-mode');
      dropHandler = onDrop;
      offer.hidden = true;
      resultShell.hidden = true;
      hud.hidden = false;
      action.disabled = true;
    },
    updateActive: (snapshot) => {
      score.textContent = String(snapshot.score);
      attempts.textContent = String(snapshot.attempts);
      time.textContent = snapshot.timeRemaining.toFixed(1);
      action.disabled = !snapshot.canDrop;
      action.classList.toggle('is-ready', snapshot.canDrop);
      action.querySelector('span')!.textContent = snapshot.canDrop
        ? 'TARGET MOVING · TIME THE HIT'
        : snapshot.phase === 'countdown'
          ? 'GET READY'
          : snapshot.dropProgress !== null
            ? 'DROP AWAY…'
            : 'RESETTING…';

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
      const accuracy = result.attempts > 0 ? result.score / result.attempts : 0;
      const card = document.createElement('section');
      card.className = 'pigeon-drop-result glass-panel';
      card.innerHTML = `
        <span class="eyebrow">EVENT COMPLETE</span>
        <h2>PIGEON DROP</h2>
        <div class="pigeon-drop-result-grid">
          <div><small>SCORE</small><strong>${result.score}</strong></div>
          <div><small>BEST</small><strong>${result.bestScore}</strong></div>
          <div><small>ATTEMPTS</small><strong>${result.attempts}</strong></div>
          <div><small>AVG PTS</small><strong>${accuracy.toFixed(1)}</strong></div>
          <div class="reward"><small>REWARD</small><strong>+${formatEconomyNumber(result.baseReward)}</strong></div>
        </div>
        <p>${result.isNewBest ? 'NEW PERSONAL BEST · ' : ''}Base reward secured. Performance ×${result.performanceMultiplier.toFixed(2)}.</p>
        <div class="pigeon-drop-result-actions">
          <button type="button" class="event-double" ${canDouble ? '' : 'disabled'}>
            <span>${canDouble ? 'WATCH AD' : 'NO AD'}</span>
            <b>${canDouble ? '2× REWARD' : 'BASE KEPT'}</b>
          </button>
          <button type="button" class="event-continue"><span>BACK TO CITY</span><b>CONTINUE</b></button>
        </div>
        <small class="pigeon-drop-result-status">${canDouble ? `Watch an ad to add another +${formatEconomyNumber(result.baseReward)} Feathers.` : 'Rewarded ads are unavailable; nothing is lost.'}</small>
      `;
      resultShell.append(card);

      const doubleButton = card.querySelector<HTMLButtonElement>('.event-double')!;
      const continueButton = card.querySelector<HTMLButtonElement>('.event-continue')!;
      const status = card.querySelector<HTMLElement>('.pigeon-drop-result-status')!;

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
      root.classList.remove('event-mode', 'pigeon-drop-mode');
      hud.hidden = true;
      resultShell.hidden = true;
      resultShell.replaceChildren();
      countdown.classList.remove('visible');
      action.disabled = true;
      action.classList.remove('is-ready');
      dropHandler = undefined;
    },
    destroy: () => {
      offer.removeEventListener('click', clickOffer);
      action.removeEventListener('click', clickDrop);
      host.remove();
    },
  };
}

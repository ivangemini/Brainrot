import {
  MUTATION_DEFINITIONS,
  MUTATION_ORDER,
  type MutationId,
} from '../content/mutation-content';

export interface MutationChoiceHandlers {
  readonly onSelect: (mutationId: MutationId) => boolean | Promise<boolean>;
  readonly onResolved: (mutationId: MutationId) => void | Promise<void>;
}

export interface MutationUi {
  readonly showChoice: (handlers: MutationChoiceHandlers) => void;
  readonly hide: () => void;
  readonly destroy: () => void;
  readonly isVisible: () => boolean;
}

export function createMutationUi(root: HTMLElement): MutationUi {
  const host = document.createElement('div');
  host.className = 'mutation-host';
  host.hidden = true;
  root.append(host);

  let generation = 0;

  const hide = (): void => {
    generation += 1;
    host.hidden = true;
    host.classList.remove('is-resolving');
    host.replaceChildren();
  };

  const showChoice = (handlers: MutationChoiceHandlers): void => {
    generation += 1;
    const renderGeneration = generation;
    host.hidden = false;
    host.classList.remove('is-resolving');
    host.innerHTML = `
      <section class="mutation-modal glass-panel" role="dialog" aria-modal="true" aria-labelledby="mutation-title">
        <div class="mutation-heading">
          <span class="eyebrow">GROWTH STAGE 5 · EVOLUTION EVENT</span>
          <h2 id="mutation-title">Choose what the pigeon becomes</h2>
          <p>This mutation defines your first-run playstyle. The choice is saved and lasts until prestige.</p>
        </div>
        <div class="mutation-grid" role="list"></div>
        <footer class="mutation-footer">
          <span>No random roll.</span>
          <strong>No ad. No reroll on refresh.</strong>
        </footer>
      </section>
    `;

    const grid = host.querySelector<HTMLElement>('.mutation-grid')!;
    const buttons: HTMLButtonElement[] = [];

    for (const mutationId of MUTATION_ORDER) {
      const definition = MUTATION_DEFINITIONS[mutationId];
      const card = document.createElement('article');
      card.className = `mutation-card mutation-${mutationId}`;
      card.dataset.mutation = mutationId;
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <div class="mutation-preview" aria-hidden="true">
          <img class="mutation-preview-base" src="/assets/generated/main_scene_hero.webp" alt="" />
          <img class="mutation-preview-layer" src="${definition.art}" alt="" />
        </div>
        <div class="mutation-card-copy">
          <span class="mutation-playstyle">${definition.playstyle}</span>
          <h3>${definition.name}</h3>
          <p>${definition.tagline}</p>
          <ul>${definition.modifiers.map((modifier) => `<li>${modifier}</li>`).join('')}</ul>
        </div>
        <button type="button" class="mutation-select" data-mutation="${mutationId}">
          <span>CHOOSE</span>
          <b>${definition.name.replace(' Pigeon', '')}</b>
        </button>
      `;
      grid.append(card);

      const button = card.querySelector<HTMLButtonElement>('.mutation-select')!;
      buttons.push(button);
      button.addEventListener('click', async () => {
        if (host.classList.contains('is-resolving')) return;
        host.classList.add('is-resolving');
        for (const other of buttons) other.disabled = true;
        card.classList.add('is-selected');
        button.innerHTML = '<span>EVOLVING</span><b>…</b>';

        let accepted = false;
        try {
          accepted = await handlers.onSelect(mutationId);
        } catch (error) {
          console.error('Mutation selection failed.', error);
        }

        if (!accepted) {
          host.classList.remove('is-resolving');
          card.classList.remove('is-selected');
          button.innerHTML = `<span>CHOOSE</span><b>${definition.name.replace(' Pigeon', '')}</b>`;
          for (const other of buttons) other.disabled = false;
          return;
        }

        card.classList.add('is-confirmed');
        button.innerHTML = '<span>MUTATION</span><b>LOCKED IN</b>';
        const heading = host.querySelector<HTMLElement>('.mutation-heading')!;
        heading.innerHTML = `
          <span class="eyebrow">MUTATION LOCKED</span>
          <h2>${definition.name}</h2>
          <p>${definition.tagline} Your build modifier is active immediately.</p>
        `;

        window.setTimeout(() => {
          if (generation !== renderGeneration) return;
          hide();
          void handlers.onResolved(mutationId);
        }, 1050);
      });
    }
  };

  return {
    showChoice,
    hide,
    isVisible: () => !host.hidden,
    destroy: () => {
      generation += 1;
      host.remove();
    },
  };
}

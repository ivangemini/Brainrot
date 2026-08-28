import type { PigeonEventId } from '../content/event-content';

export interface EventAvailabilityInput {
  readonly breadRush: boolean;
  readonly pigeonDrop: boolean;
  readonly lastEventId: PigeonEventId | null;
}

export function selectEventOffer(input: EventAvailabilityInput): PigeonEventId | null {
  if (!input.breadRush && !input.pigeonDrop) return null;
  if (input.breadRush && !input.pigeonDrop) return 'bread-rush';
  if (!input.breadRush && input.pigeonDrop) return 'pigeon-drop';

  // When both are ready, alternate away from the last completed event.
  if (input.lastEventId === 'bread-rush') return 'pigeon-drop';
  if (input.lastEventId === 'pigeon-drop') return 'bread-rush';
  return 'pigeon-drop';
}

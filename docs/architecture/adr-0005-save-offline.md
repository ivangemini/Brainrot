# ADR-0005 — Versioned Save and Offline Earnings

- **Status**: Accepted
- **Date**: 2026-08-27

## Context
The clicker must survive refreshes, long absences and later portal cloud sync without duplicating rewards or serializing renderer/runtime objects.

## Decision
Persist a compact versioned `GameState` DTO. Local storage is the MVP authority; cloud transport will wrap the same schema later. Offline earnings use saved passive production, clamped real elapsed time and explicit efficiency rules. Transient combo state is not restored.

## Consequences
- Corrupt/unsupported saves fall back safely instead of crashing boot.
- Save migrations are explicit as schema versions advance.
- Baseline offline rewards are deterministic and separate from any optional rewarded-ad multiplier.
- Phaser/DOM objects are never serialized.

## Implementation Guidelines
- Clamp/validate loaded numeric values.
- Cap offline elapsed time at the configured limit.
- Apply rewarded offline bonuses exactly once through the reward ledger when monetization is implemented.
- Save on cadence plus page visibility/pagehide boundaries.

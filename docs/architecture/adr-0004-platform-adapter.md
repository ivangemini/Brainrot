# ADR-0004 — Portal Platform Adapter Boundary

- **Status**: Accepted
- **Date**: 2026-08-27

## Context
Yandex Games, CrazyGames and generic web expose different advertising, lifecycle and cloud APIs. Gameplay must remain playable when a portal capability is unavailable.

## Decision
All portal SDK access lives behind a semantic `PlatformAdapter`. Gameplay/UI never call Yandex/CrazyGames globals directly. Adapter results normalize rewarded, interstitial, cloud and lifecycle outcomes.

## Consequences
- Generic web can run with ads/cloud disabled.
- Portal integrations are independently testable with mocks.
- Ad callbacks cannot directly mutate the economy.
- Future portal support does not fork core gameplay.

## Implementation Guidelines
- Keep SDK globals inside `src/platform/*-adapter.ts` only.
- Pause/resume gameplay through a shared lifecycle boundary around external ads.
- A rewarded benefit is applied only after `completed` and through an idempotent reward transaction.
- Treat SDK errors/unavailability as normal recoverable results.

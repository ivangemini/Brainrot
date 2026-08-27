# ADR-0003 — Data-Driven Tuning and EconomyNumber Boundary

- **Status**: Accepted
- **Date**: 2026-08-27

## Context
Incremental-game balance will be tuned repeatedly. Values must not diverge between UI, simulation and runtime, and late-game magnitude may eventually outgrow ordinary JavaScript precision.

## Decision
Upgrade costs, unlocks, milestones and growth definitions are canonical content data consumed by pure economy formulas. MVP economy uses JavaScript `number` behind a narrow economy utility boundary; a larger-number representation is deferred until measured progression requires it.

## Consequences
- No progression magic numbers in UI/scene code.
- Balance tests pin opening behavior, including Beak cost 15 and Beak Lv1 tap value 1.2.
- Future number migration can happen behind the economy boundary instead of across every screen.

## Implementation Guidelines
- Keep tunable values in content/config modules or machine-readable balance data.
- Validate finite/non-negative currency values at boundaries.
- Update deterministic balance tests when intentional tuning changes occur.

# Active Session — Mutation v1

> Updated: 2026-08-28
> Working branch: `codex/mutation-choice-v1`
> Task: Implement the first build-defining Mutation choice end-to-end after Growth Stage 5, including persistent modifiers, generated-raster presentation, lifecycle gating, balance validation and browser QA.

## Completed

- Preserved all existing playable systems: Feathers, six upgrade branches, Total Upgrade Level, Growth, combo/crit/passive/automation, save/offline, platform/rewarded layer and Bread Rush.
- Implemented the first Mutation decision at Total Upgrade Level 150 / Growth Stage 5:
  - `muscle` — active taps ×1.35 and combo cap +0.15;
  - `business` — passive production ×1.35 and offline efficiency +0.10, capped at 0.85;
  - `chaos` — crit chance +0.05 with a 0.30 first-tier hard cap, crit multiplier ×1.15 and Pigeon Event rewards ×1.15.
- Added `src/content/mutation-content.ts` as the runtime tuning/content authority for mutation IDs, copy, art paths and numeric modifiers.
- Added ordered `mutationIds` to `GameState` while keeping existing schema-v1 saves backward compatible:
  - missing mutation state loads as `[]`;
  - malformed/duplicate IDs sanitize safely;
  - selected mutation persists immediately and cannot be rerolled by refresh;
  - repeated callbacks are idempotent and cannot stack the same modifier.
- `GameStore` now owns eligibility and selection atomically:
  - progression purchases freeze while the eligible choice is unresolved;
  - Bread Rush is unavailable while the decision is pending;
  - UI/Phaser remain consumers of authoritative state.
- Economy formulas are mutation-aware without rewriting branch definitions:
  - Muscle only affects active production/combo;
  - Business only affects passive/offline;
  - Chaos owns crit/event modifiers;
  - HUD passive/combo readouts use the same mutation-aware formulas.
- Bread Rush reference income now reflects the selected production profile, then Chaos applies its separate ×1.15 event reward factor deterministically.
- Added a dedicated Mutation comparison modal:
  - three simultaneous cards on desktop;
  - horizontal comparison on compact/mobile layouts;
  - exact modifiers and persistence rule shown before selection;
  - no ad/payment/random roll;
  - Growth ceremony receives the first beat before the modal pauses gameplay;
  - refresh on an unresolved choice safely returns to the decision.
- Added generated raster mutation treatments built before runtime:
  - `mutation_muscle.png`;
  - `mutation_business.png`;
  - `mutation_chaos.png`;
  - Phaser consumes these as full-scene aligned raster layers over the approved generated hero; no SVG/runtime vector character fallback was introduced.
- Mutation reveal and tap feedback now react to the selected identity while authoritative progression remains domain-owned.
- Added deterministic mutation coverage for eligibility, gating, idempotency, per-archetype formulas, persistence/sanitization and Business offline rewards.
- Added `tools/balance/mutation_profiles.py`:
  - reads shipped numeric Mutation constants directly from `src/content/mutation-content.ts`;
  - compares representative Total Lv 150 active, passive/offline and event-heavy profiles;
  - CI asserts intended identity winners: Muscle active, Business passive/offline, Chaos event-heavy.
- Expanded browser Visual QA to capture and assert:
  - desktop Mutation choice;
  - mobile Mutation choice;
  - three-card count;
  - Business selection persistence;
  - post-selection runtime state;
  - existing main/Bread Rush states and console/page-error checks remain covered.
- Updated `design/gdd/mutation-choices.md` to implemented v0.1 and documented the explicit 0.30 Chaos crit hard cap.

## Verification Evidence

Runtime/UI implementation SHA `003733c87fc77c684cbaa69c3dcb461abdadde08`:

- CI run `33144537914`: PASS.
  - raster generation/gate: PASS;
  - mutation Vitest coverage: PASS;
  - strict TypeScript compile: PASS;
  - Vite production build: PASS.
- Browser Visual QA run `33144537874`: PASS.
  - desktop main 1440x900: captured;
  - mobile main 390x844: captured;
  - Bread Rush ready/active: captured and clock assertion PASS;
  - desktop Mutation choice: captured;
  - mobile Mutation choice: captured;
  - Business selection persisted to local save: PASS;
  - post-selection Business runtime state: captured;
  - console/page errors: none reported by the QA script.

Balance/CI guard SHA `1728e2d8c400b7c1a8c14992f909b26dd9de90a1`:

- CI run `33144699791`: PASS.
  - mutation profile identity check: PASS;
  - raster generation/gate: PASS;
  - Vitest: PASS;
  - strict TypeScript compile: PASS;
  - Vite production build: PASS.

## Current Runtime Status

- The first major build-defining choice now exists in the real game rather than only in the GDD.
- Mutation state survives reload and immediately changes authoritative economy output.
- The choice cannot be bypassed through another upgrade purchase or Bread Rush.
- Mutation UI and runtime presentation are covered at desktop and mobile viewport sizes.
- Generated-raster Mutation treatments are the first additional persistent visual layer on top of the approved hero state.
- The overall game is still not release-complete; Growth stages beyond the current hero framing need stronger unique generated visual states and content depth remains limited after the first Mutation.

## Next

1. Expand generated art across Growth milestones so stages 90/150/240+ visibly change silhouette/environment, not primarily framing/zoom.
2. Add the next meaningful content/event beat after Mutation so the post-150 loop does not collapse back into only upgrade purchasing.
3. Add audio and stronger game-feel layering for Growth, Mutation, crits and Bread Rush.
4. Continue portal/mobile QA and release-readiness work after the progression presentation pass.

## Blockers

None for continued development. Mutation v0.1 is implemented and verified; the broader game remains in active production.

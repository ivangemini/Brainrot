# Active Session — Pigeon Drop v1

> Updated: 2026-08-28
> Working branch: `codex/pigeon-drop-v1`
> Task: Complete the next roadmap item after Growth Art Stages v1 — add the second MVP Pigeon Event as a meaningful post-Mutation content beat, with deterministic gameplay, economy-scaled rewards, persistence, responsive presentation and browser QA.

## Completed

- Preserved the existing clicker, Growth, Mutation, Bread Rush, save/offline and monetization systems.
- Implemented **Pigeon Drop** as the second MVP Pigeon Event:
  - unlock at Total Upgrade Level 180, after first Mutation at 150 and before Growth Stage 6 at 240;
  - 3-second countdown + 30-second active run;
  - one primary pointer/touch action;
  - target position locks when a drop is accepted so click timing remains authoritative during the fixed 0.48-second visible flight;
  - deterministic center / near / graze / miss scoring at impact;
  - short attempt reset and no Feather penalty on misses.
- Added `src/domain/pigeon-drop.ts` as a deterministic, frame-rate-independent session model driven only by active gameplay time.
- Added `src/domain/event-economy.ts` and moved both Bread Rush and Pigeon Drop onto the same mutation-aware reference-income / bounded reward pipeline.
- Added `PigeonDropService` using the existing idempotent reward ledger:
  - base result reward is applied once and persisted before optional rewarded doubling;
  - repeated completion callbacks cannot duplicate reward, run count or cooldown state;
  - rewarded bonus has a separate transaction ID;
  - Chaos event multiplier remains authoritative and applies to both events.
- Extended additive schema-v1 event progress with:
  - Pigeon Drop best score / runs / cooldown;
  - shared Pigeon Event cooldown;
  - last completed event ID.
- Old schema-v1 saves containing only Bread Rush event fields load with safe default Pigeon Drop/shared fields; no save reset or schema bump is required.
- Added deterministic event opportunity selection in `src/events/event-availability.ts`:
  - shared 5-minute anti-clumping cooldown after either event;
  - Bread Rush own cooldown remains 6 minutes;
  - Pigeon Drop own cooldown is 7 minutes;
  - when both are ready, offer the event opposite `lastEventId`;
  - with no event history after Lv 180, surface Pigeon Drop first.
- Integrated the two-event coordinator in `src/main.ts`:
  - only one event can own the runtime event slot;
  - normal clicker production remains paused during active event play;
  - event offers stay suppressed during unresolved Mutation choice;
  - return from either event safely wakes MainScene and resets simulation timing.
- Added responsive Pigeon Drop UI and Phaser presentation:
  - current generated Growth raster environment and Mutation treatment remain the production-art layer;
  - large `DROP NOW` action plus playfield tap input;
  - score / attempts / time HUD;
  - moving bullseye, aim guide, falling marker, impact burst and score text are transient Phaser interaction/VFX primitives only;
  - result card with score, best, attempts, average points, secured reward and optional rewarded ×2.
- Removed the obsolete shape-generated Pigeon Drop target/projectile/impact texture pipeline:
  - deleted `tools/art/generate-pigeon-drop-assets.mjs`;
  - removed it from `npm run art:generate`;
  - removed the Pigeon Drop offer's dependency on its generated target PNG and reused the existing raster hero asset instead;
  - production raster-only/no-SVG guard remains unchanged.
- Added tests for:
  - deterministic center hit and miss resolution;
  - target-lock / flight / reset timing and completion;
  - reward bounds and economy scaling;
  - Business/Mutation-aware reference income;
  - base reward idempotency;
  - event alternation and shared/per-event cooldown semantics;
  - schema-v1 two-event round trip and old Bread Rush-only save migration;
  - malformed event progress sanitization.
- Expanded browser Visual QA so Bread Rush and Pigeon Drop are seeded independently instead of relying on whichever offer the rotation chooses.
- Pigeon Drop browser QA covers:
  - desktop ready state;
  - desktop active state and a resolved live attempt;
  - full 30-second result flow;
  - localStorage assertion for exactly one run increment, `lastEventId`, shared cooldown and base reward transaction;
  - compact 390x844 portrait active state;
  - existing Growth, Bread Rush and Mutation regression captures remain in the same workflow.
- Updated `design/gdd/pigeon-events.md` to implemented v0.2 with shipped tuning, click-authoritative target lock, transient-VFX art policy, shared event economy, rotation/cooldown contract and save/reward safety.

## Verification Evidence

Final gameplay/art presentation HEAD before housekeeping: `34a38462d511ac5cf906415c03a0e846da9c55d1`.

- CI run `33147842237`: PASS.
  - generated raster art pipeline: PASS;
  - raster-only / no-SVG production-art gate: PASS;
  - Mutation balance profile guard: PASS;
  - Vitest including Pigeon Drop/event rotation/save migration coverage: PASS;
  - strict TypeScript + Vite production build: PASS.
- Browser Visual QA run `33147838985`: PASS.
  - production build / preview: PASS;
  - Bread Rush regression clock path: PASS;
  - Pigeon Drop desktop offer -> active -> resolved attempt -> result: PASS;
  - Pigeon Drop result persistence assertions: PASS;
  - Pigeon Drop compact portrait capture: PASS;
  - Growth Stage 4–8 render uniqueness regression: PASS;
  - Mutation desktop/mobile regression and persistence: PASS.
- Manual review of the `34a3846...` Visual QA artifact: PASS.
  - transient precision marker reads more cleanly than the discarded shape-generated target texture;
  - desktop and portrait layouts keep target, fixed aim lane and action hierarchy legible;
  - production Growth/Mutation raster identity remains intact behind the event VFX;
  - HUD label correctly says `ATTEMPTS`.

The final housekeeping branch head must also pass CI and Visual QA before PR #4 is merged.

## Current Runtime Status

- The roadmap's post-Mutation content/event-depth bottleneck is closed for the current MVP scope.
- Both designed MVP Pigeon Events are implemented: Bread Rush and Pigeon Drop.
- Pigeon Drop creates a distinct skill/timing beat after the first Mutation instead of letting the post-150 loop collapse back into upgrade purchasing only.
- Both events share authoritative economy/reward semantics, use safe persisted result transactions, and cannot clump or overlap.
- Growth and Mutation identity carry through event presentation instead of events reverting the player to an early-game visual state.
- Pigeon Drop no longer depends on a shape-generated production texture pack; its precision marker and impact feedback are transient runtime VFX.
- The project is still not release-complete; the next roadmap bottleneck is presentation polish rather than missing MVP event count.

## Next

1. Add **audio and stronger game-feel layering** for normal taps, combo tiers, crits, Growth ceremonies, Mutation selection/reveal, Bread Rush and Pigeon Drop.
2. After audio/game-feel, continue portal/mobile/release-readiness QA and close remaining commercial-MVP polish issues.
3. Do not add unrelated progression trees, currencies or new game modes before those roadmap items are complete.

## Blockers

None for continued development. Pigeon Drop v1 and the two-event MVP set are implemented; final housekeeping is complete pending branch-head verification and merge.

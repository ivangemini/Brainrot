# Active Session — Pigeon Drop v1

> Updated: 2026-08-28
> Status: **COMPLETE / MERGED TO MAIN**
> Runtime merge: `5c62c60f36615cc89f65449d95ee08f49c751478`
> Source branch: `codex/pigeon-drop-v1`

## Completed

- Implemented **Pigeon Drop** as the second MVP Pigeon Event:
  - unlock at Total Upgrade Level 180;
  - 3-second countdown + 30-second active run;
  - one primary pointer/touch action;
  - target position locks when a drop is accepted so click timing is authoritative during the 0.48-second visible flight;
  - deterministic center / near / graze / miss scoring;
  - short reset between attempts and no Feather penalty for misses.
- Added deterministic `PigeonDropSession` driven by the authoritative active-gameplay clock.
- Added shared event-economy reference/reward calculations for Bread Rush and Pigeon Drop.
- Added duplicate-safe Pigeon Drop base reward and optional rewarded ×2 transaction flow.
- Extended schema-v1 event state with Pigeon Drop best/runs/cooldown, shared event cooldown and last-event rotation state while preserving old Bread Rush-only saves.
- Added deterministic two-event arbitration:
  - 5-minute shared anti-clumping cooldown;
  - Bread Rush own cooldown remains 6 minutes;
  - Pigeon Drop own cooldown is 7 minutes;
  - when both are ready, the offer alternates away from the last completed event.
- Integrated both events into one authoritative runtime event slot; clicker production remains paused while an event is active and Mutation choice keeps priority.
- Added responsive Pigeon Drop desktop/mobile HUD, action, result flow and Growth/Mutation presentation carry-through.
- Removed the rejected Paint-like Pigeon Drop production texture path:
  - deleted the obsolete shape-generated event asset generator;
  - removed its build dependency;
  - removed the offer dependency on its generated target PNG;
  - moving bullseye, aim guide, falling marker and impact feedback are transient Phaser VFX only;
  - generated Growth/Mutation raster art remains the production visual layer.
- Fixed timing fairness: the moving target freezes for the accepted drop flight, so the result reflects the player's click moment rather than drifting during travel.
- Added unit/save/event-rotation coverage and expanded Chromium Visual QA with deterministic Bread Rush/Pigeon Drop seeds, desktop result persistence and 390×844 portrait capture.
- Updated `design/gdd/pigeon-events.md` to the shipped two-event contract.

## Final Verification

Branch head before merge: `0d84f19bbab433f19e5d00507051717b9de0c14a`.

- Branch CI run `33148470960`: **PASS**.
- Branch Visual QA run `33148470950`: **PASS**.
- Manual review of the final Visual QA artifact: **PASS**.
  - the rejected procedural car/target texture is absent;
  - desktop and portrait precision marker/action hierarchy remain legible;
  - result screen is readable;
  - Growth/Mutation raster identity remains behind the event VFX.
- Merged runtime tree: `0deb402f9e5b384bb31e323552aa8b8ae802bbb3`.
- Main runtime merge commit: `5c62c60f36615cc89f65449d95ee08f49c751478`.
- Post-merge main CI run `33148693696`: **PASS**.
- Post-merge main Visual QA run `33148693701`: **PASS**.

## Current Runtime Status

- Both designed MVP Pigeon Events are implemented: **Bread Rush + Pigeon Drop**.
- The post-Mutation event-depth gap is closed for the current MVP scope.
- Event rewards share authoritative, mutation-aware economy semantics and duplicate-safe persistence.
- Events cannot overlap or clump back-to-back through the shared coordinator/cooldown rules.
- Pigeon Drop no longer depends on shape-generated production textures.
- No Pigeon Drop v1 blocker remains.

## Next Roadmap Bottleneck

1. **Audio + stronger game-feel layering** for taps, combo tiers, crits, Growth ceremonies, Mutation reveal/selection, Bread Rush and Pigeon Drop.
2. Then portal/mobile/release-readiness QA and remaining commercial-MVP presentation polish.
3. Do not add unrelated progression trees, currencies or new game modes before those passes are complete.

## Blockers

None.
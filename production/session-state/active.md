# Active Session — Generated Art Runtime Integration

> Updated: 2026-08-27
> Working branch: `codex/generated-art-runtime-v2`
> Task: Replace the rejected procedural/shape-based presentation with generated raster production art and verify it in the real runtime.

## Completed

- Preserved the playable systems: Feathers, six upgrade branches, Total Upgrade Level, Growth, combo/crit/passive/automation, save/offline, platform/rewarded layer and Bread Rush.
- Replaced the old shape-composed pigeon/world presentation in `MainScene` with generated production raster art:
  - `public/assets/generated/main_scene_hero.webp`;
  - real feather/material detail, sunglasses, gold beak/chain and detailed park/city environment;
  - no SVG or vector fallback;
  - tap hit testing, floating payout feedback, camera impact and Growth ceremony remain live Phaser behavior.
- Growth now changes generated-art framing/zoom instead of swapping old procedural body/beak/wing shapes.
- Reworked `BreadRushScene` to use the generated hero scene full-screen while keeping targets, timer and scoring interactive.
- Added generated raster bread target `public/assets/generated/bread_target.png`; golden bread is a runtime-tinted variant.
- Removed the Bread Rush desktop dead strip by making the event scene cover the full viewport.
- Visual QA permanently covers `codex/generated-art-runtime-v2` and `main` in addition to the original event branch.

## Verification Evidence

Runtime SHA `36713f0e84a998601f39ee6793909f4cbd6b18e6`:

- CI run `33098008679`: PASS.
  - raster generation: PASS;
  - raster-only / no-SVG gate: PASS;
  - Vitest: 5 files / 21 tests PASS;
  - strict TypeScript compile: PASS;
  - Vite production build: PASS.
- Browser Visual QA run `33098008711`: PASS.
  - desktop main 1440x900: captured;
  - mobile main 390x844: captured;
  - event-ready state: captured;
  - active Bread Rush after countdown: captured;
  - Bread Rush clock assertion: PASS;
  - console/page errors: none.
- Final screenshot review confirmed the old right-side Bread Rush dead strip is gone and the event target is generated raster art rather than the rejected flat procedural bread.

## Current Visual Status

- The primary runtime now uses the approved generated-raster visual direction rather than PNGs painted from geometric primitives.
- Main screen and Bread Rush share a coherent detailed pigeon/park art target while gameplay/UI remain live and responsive.
- The current hero is one production visual state. Future Growth and Mutation work should add additional generated raster states rather than reintroducing procedural character construction.

## Next

1. Implement the first Mutation choice with generated raster mutation states and persistent modifiers.
2. Expand generated art across additional Growth milestones so physical progression changes silhouette/materials as well as framing.
3. Continue event/content depth after Mutation is stable.
4. Add audio/game-feel and broader portal QA before release readiness.

## Blockers

None for continued development. The generated-art runtime pass is complete and verified; the overall game is not yet release-complete.

# Active Session — First Playable

> Updated: 2026-08-27
> Working branch: `codex/playable-v1c`
> Task: Build the first playable Pigeon Maxxing vertical slice

## Completed

- Vite + TypeScript strict + Phaser 4.2.1 browser scaffold.
- Authoritative Phaser-independent `GameStore`.
- Core progression economy: Feathers, Beak/Body/Nest/Wings/Swag/Brain, costs, branch unlocks, milestones, combo/crit/passive/automation formulas and Growth stages.
- Opening invariant: first Beak costs 15 Feathers and Beak Lv1 raises base tap 1.0 -> 1.2.
- Responsive DOM HUD and upgrade panel for mobile/desktop.
- Phaser main world scene with layered raster pigeon, tap feedback, tier swaps and Growth ceremony.
- Versioned local save with validation and capped offline earnings.
- Deterministic build-time raster texture generator (`tools/art/generate-raster-assets.mjs`) producing 25 PNG textures.
- Raster-only contract locked in Art Bible, technical preferences, production standard and ADR-0006; SVG player-facing production art is forbidden.
- Unit coverage for economy formulas, store transactions and save corruption/round-trip.
- CI pipeline generates art, rejects SVG in `public/assets`, runs Vitest and performs TypeScript + Vite production build.
- Obsolete base64 bootstrap workflow/payload and duplicate Python generator removed.
- ADR-0001 through ADR-0006 authored for the implemented architecture.

## Verification Evidence

GitHub Actions CI run `33084072171` on commit `8a5c0cee22558a59d1ca70883946e5a7c59dfeaf` passed:
- raster generator: PASS;
- raster-only check: PASS;
- Vitest: 3 files / 10 tests PASS;
- TypeScript compile: PASS;
- Vite 8.2.2 production build: PASS;
- JS bundle at that checkpoint: ~1.39 MB minified / ~365 KB gzip (Phaser-dominant; code-splitting warning recorded for later optimization).

Later documentation/ADR commits require the ordinary CI run for their final HEAD before merge.

## Next

1. Confirm CI green on final branch HEAD.
2. Fast-forward `main` without force.
3. Verify `main` status.
4. Continue next coherent slice: generic PlatformAdapter + rewarded transaction ledger, then Yandex adapter integration and first Pigeon Event/Mutation after platform lifecycle is safe.
5. Add real browser responsive/playtest evidence before calling the vertical slice release-ready.

## Blockers

None currently known. Browser visual QA has not yet been executed, so visual completion is not claimed.

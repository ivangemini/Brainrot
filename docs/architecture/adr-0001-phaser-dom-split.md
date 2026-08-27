# ADR-0001 — Phaser World + DOM UI Split

- **Status**: Accepted
- **Date**: 2026-08-27

## Context
The game needs a touch-first animated world and dense responsive upgrade UI across mobile/desktop web portals.

## Decision
Phaser owns the rendered world, layered pigeon, raster VFX, camera and minigames. HTML/CSS DOM owns HUD, upgrade controls, menus and accessible text/buttons. Neither presentation layer owns authoritative progression state.

## Consequences
- World input remains Phaser pointer input.
- UI commands call domain/application services.
- DOM may provide layout/panels/typography but not substitute illustrated vector art for raster assets.
- Responsive UI can evolve without coupling economy logic to Phaser scene objects.

## Implementation Guidelines
- Keep `src/presentation/` and `src/ui/` presentation-only.
- Share state through `GameStore` subscriptions/selectors.
- Do not duplicate economy formulas in DOM/scene code.

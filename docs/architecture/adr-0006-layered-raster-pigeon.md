# ADR-0006 — Layered Generated-Raster Pigeon

- **Status**: Accepted
- **Date**: 2026-08-27

## Context
Hundreds of upgrade levels must visibly change the pigeon without requiring a unique full-body render for every combination. The user explicitly requires generated raster textures only and forbids SVG/vector production art.

## Decision
The pigeon is composed from generated raster PNG/WebP layers using canonical semantic slots and anchors. Upgrade milestones swap raster tiers; Growth Stage changes body silhouette tier and scale. Runtime tweens animate those textures but do not generate substitute vector art.

## Consequences
- Beak/Body/Wings/Nest/Swag can combine without full-skin combinatorial explosion.
- Higher-fidelity generated textures can replace first-playable art without rewriting domain rules.
- `public/assets` is raster-only; CI rejects SVG files.
- HTML/CSS remains valid for interface layout/typography, not illustrated assets.

## Implementation Guidelines
- Maintain shared anchor canvas/pivots for modular assets.
- Load only art required by current/near progression.
- Major Growth stages require meaningful silhouette/environment changes rather than uniform scaling alone.
- Any production icon/logo/character/world/prop/VFX asset must be generated raster art.

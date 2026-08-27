# Source Directory

This directory contains the production browser game.

Follow the root `AGENTS.md`, `studio/docs/technical-preferences.md`, approved GDDs, and architecture documents.

## Runtime rules

- TypeScript strict mode.
- Domain economy/progression logic stays Phaser-independent.
- Phaser owns world rendering and transient visual feedback, not authoritative progression state.
- HTML/CSS UI consumes store state and sends commands; it does not duplicate economy formulas.
- All progression numbers come from content/config modules or approved tuning data.
- Save data is versioned and sanitized at load boundaries.
- Portal SDKs may only be referenced by dedicated platform adapter modules.
- Production visual assets are generated raster textures (PNG masters / WebP runtime where available). Do not add SVG art, CSS-drawn characters, or vector placeholder world assets.

## Tests

Gameplay formulas and state transitions require deterministic Vitest coverage. Browser smoke checks should be added as the playable grows.

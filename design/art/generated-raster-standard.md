# Generated Raster Production Standard

> Status: LOCKED
> Last updated: 2026-08-27
> Governing instruction: user requires generated textures only; no SVG/vector production art.

## Hard rules

1. Player-facing illustrated assets are generated raster textures.
2. Allowed asset formats are PNG and WebP, including raster atlas pages.
3. SVG is forbidden for production characters, world art, props, accessories, illustrated UI icons/logos and VFX.
4. CSS/HTML may provide UI layout, typography, panel backgrounds, borders and responsive geometry; it may not replace illustrated production art.
5. Runtime tweening/scaling/rotation may animate raster layers but may not substitute for missing art.
6. Placeholder status does not exempt an asset from these rules.

## First playable

`tools/art/generate-raster-assets.mjs` deterministically generates the initial raster texture pack before development and production builds. CI verifies that the pack contains at least 25 PNG textures and rejects any SVG under `public/assets`.

The deterministic pack is an implementation-quality first-playable asset set, not the final fidelity ceiling. Higher-fidelity generated raster replacements should retain the same semantic slots/anchors so art can improve without rewriting progression logic.

## Pigeon composition

The pigeon uses independent raster layers for body, head, eyes, beak, wings, legs, shadow, Nest props, Swag accessories and future mutation/aura layers. Major upgrade milestones swap raster tiers; Total Upgrade Level changes Growth Stage and body silhouette/scale.

## Acceptance

A player-facing art change fails review if it introduces SVG/vector illustrated assets, CSS-drawn character/world art, or a vector placeholder intended to be replaced later.

# Meme Pigeon Identity — Canonical Visual Contract

Status: **LOCKED** unless the user explicitly changes direction.

## Hero identity

The game is built around the user-approved meme pigeon reference, not a generic pigeon.

Canonical traits:
- saturated bright blue body and head;
- human-like orange lips integrated into the beak/mouth area;
- uncanny frontal expression and direct eye contact;
- slightly absurd body proportions;
- surreal pond / jungle / luminous-nature mood;
- immediately recognizable brainrot/TikTok visual read at thumbnail size.

The acquisition thumbnail, store card, loading art and in-game hero must all read as the same character family.

## Progression rule

Growth and cosmetics must amplify the meme identity rather than replace it.

Allowed changes:
- physical scale and chonk;
- body mass / chest / stance;
- sunglasses, chains, crowns and other large readable cosmetics;
- glow, aura, water and environmental escalation;
- absurd late-game mutations;
- helper pigeons and world reactions.

Must remain recognizable:
- blue color identity;
- human-like orange lips;
- uncanny face;
- core pigeon silhouette;
- meme-first tone.

Do not evolve into a generic fantasy bird, realistic city pigeon or unrelated monster.

## Raster-only production rule

Character and environment production assets are generated raster images (WebP/PNG). SVG/vector/primitive-built character art is forbidden as production art. Procedural effects may supplement raster art but may not replace the hero illustration.

## Current implementation asset

The first runtime asset is a compact WebP derived from the user-supplied reference and embedded as raster data in `src/assets/meme-pigeon/`. The text embedding is only a repository-transport mechanism; the decoded browser asset is WebP raster art.

Future higher-resolution generated variants should preserve the exact identity contract above and can replace the compact transport asset without changing gameplay code.

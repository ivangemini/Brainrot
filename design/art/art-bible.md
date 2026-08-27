# Pigeon Maxxing — Art Bible

> **Status**: Approved production direction v0.3
> **Last Updated**: 2026-08-27
> **Canonical Hero**: user-approved blue meme pigeon with human-like orange lips
> **Target**: mobile/desktop web, generated-raster presentation

## 1. Canonical visual identity

The acquisition hook and in-game hero are the same recognizable meme-pigeon identity.

The hero is **not** a generic city pigeon. Mandatory traits:
- saturated bright blue body/head;
- human-like orange lips integrated into the mouth/beak area;
- uncanny frontal expression and direct eye contact;
- slightly absurd proportions;
- surreal pond/jungle/luminous-nature mood;
- immediate meme/brainrot readability at thumbnail size.

Canonical detail: `design/art/meme-pigeon-identity.md`.

## 2. One-line art rule

**Take the absurd meme pigeon completely seriously: premium generated-raster rendering, beautiful environments, escalating progression and an intentionally uncanny hero.**

The comedy comes from the contrast between polished presentation and a ridiculous central character.

## 3. Hero-first composition

The pigeon is the primary focal point.

- Hero anchor = actual viewport center.
- Do not shift the hero left merely because a desktop upgrade panel exists.
- UI routes around the hero.
- Hero face, lips, torso and readable silhouette may not be covered by UI.
- Hero growth may not intrude into the top HUD, desktop upgrade panel or mobile bottom tray.
- If a Growth tier would collide with UI, reduce framing/zoom or change scene composition instead of allowing overlap.
- Decorative background may continue behind translucent UI; the readable hero silhouette may not.

Canonical layout contract: `design/ui/hero-first-layout.md`.

## 4. Progression identity

Growth, cosmetics and mutations amplify the same meme identity instead of replacing it.

### Must remain recognizable
- blue body identity;
- orange human-like lips;
- uncanny eyes/expression;
- core pigeon silhouette language;
- meme-first tone.

### Allowed escalation
- chonk/body mass;
- chest/stance changes;
- larger physical scale;
- sunglasses, chains, crowns and other large readable cosmetics;
- aura, glow, water/environment changes;
- followers/helper pigeons;
- absurd late-game transformations.

Do not evolve into a generic fantasy bird, realistic city pigeon or unrelated monster.

## 5. Growth language

Total Upgrade Level controls physical scale and major visual tiers.

Small progression:
- small scale increase;
- stronger tap reactions;
- cosmetic milestone additions;
- stronger environment response.

Major Growth stages:
- visibly larger body / framing;
- stronger surrounding water/world reaction;
- new large readable cosmetic or body treatment;
- environment escalation;
- new mechanic unlock where designed.

At every stage the character must still be recognizable as the same meme pigeon.

## 6. Cosmetics

Cosmetics must be legible immediately at gameplay scale.

Good examples:
- large sunglasses;
- thick gold chain;
- crown;
- luminous feather/aura treatment;
- obvious chest/body tier;
- large head/neck accessory;
- surrounding follower pigeons;
- environment props tied to the build.

Avoid tiny decorative details that are only visible when zoomed in.

## 7. Environment direction

The baseline environment follows the meme reference more closely than the previous ordinary-city direction:
- luminous pond / shallow water;
- jungle/tropical vegetation;
- strong sunlight shafts;
- lilies and reflective water;
- surreal but beautiful atmosphere.

Later zones may add city/wealth/cosmic elements, but the hero identity remains dominant.

The environment should react to progression rather than becoming unrelated scenery.

## 8. UI direction

Phaser/WebGL canvas owns:
- hero;
- world/background;
- raster VFX;
- minigame targets;
- camera feedback.

HTML/CSS owns:
- layout;
- typography;
- HUD;
- upgrade cards;
- event/result panels;
- platform dialogs.

UI can use translucent/glass panels over the decorative background, but interactive cards must stay in reserved zones and must not cover the hero silhouette.

### Desktop
- compact HUD across top;
- upgrades on right;
- hero remains centered on full viewport;
- hero size is constrained so it ends before the upgrade panel.

### Mobile portrait
- compact top HUD;
- hero remains at physical viewport center;
- upgrades use a shallow scrollable bottom tray;
- no tall bottom sheet that forces the hero upward;
- no persistent center-screen cards.

## 9. Raster-only production rule

All player-facing illustrated production art is generated raster art.

Allowed:
- WebP;
- PNG;
- raster atlases;
- runtime transforms/tweens/particles over raster assets.

Forbidden as production character/environment art:
- SVG;
- CSS illustration;
- vector/shape-built pigeon;
- canvas primitives used as replacement art;
- temporary primitive art presented as production-ready.

The current approved meme-pigeon reference is embedded as compact WebP raster data under `src/assets/meme-pigeon/` because the repository connector is text-only. This is a transport mechanism, not a return to procedural art.

## 10. Animation / game feel

Tap cycle target: roughly 120–190 ms.
- short squash/recoil;
- small camera impulse;
- raster tap burst;
- floating payout;
- stronger but restrained critical response.

Growth ceremony:
- quick anticipation;
- scale/framing change;
- short flash/impact;
- milestone title;
- return to stable centered composition.

Do not use movement that permanently shifts the hero away from viewport center.

## 11. Bread Rush

Bread Rush uses the same canonical meme pigeon.
- hero remains centered;
- event HUD stays outside the readable hero silhouette;
- bread targets may appear around the hero but must remain clearly tappable;
- targets cannot hide the face for sustained periods;
- event background remains visually connected to the main pond/jungle world.

## 12. Accessibility / readability

- Do not encode affordability/readiness by color alone.
- Important state requires text/icon/shape redundancy.
- Avoid excessive flashes and sustained shake.
- Preserve touch target size on mobile.
- Prioritize hero silhouette and target readability over decorative effects.

## 13. Runtime acceptance tests

A player-facing visual pass is not accepted until:
- hero identity matches the approved meme-pigeon direction;
- hero is centered on desktop and mobile;
- `data-hero-centered="true"` in browser QA;
- `data-hero-safe="true"` in browser QA;
- no UI covers hero face/torso/readable silhouette;
- Growth remains inside safe bounds;
- Bread Rush follows the same contract;
- no SVG/vector production fallback appears;
- desktop and mobile screenshots are reviewed at real runtime size;
- no console/page errors are present.

## 14. Prohibitions

Do not:
- revert to a generic gray pigeon;
- remove the human-like orange lips from the core identity;
- shift the hero out of screen center to solve UI layout;
- let UI sit over the hero;
- let Growth scale through UI reserved zones;
- replace generated raster art with primitive/vector character art;
- turn late-game progression into an unrelated creature;
- use a polished store thumbnail that does not match the in-game hero.

# Active Session — Meme Pigeon Runtime Integration

> Updated: 2026-08-28
> Working branch: `codex/meme-pigeon-hero-v1`
> Task: Lock the user-approved blue meme pigeon as the production hero, keep it centered and UI-safe, and verify the result in the real runtime.

## Locked Visual Contract

- The production hero identity is the bright blue uncanny meme pigeon with human-like orange lips from the user-approved reference.
- Growth, cosmetics and future mutations must preserve the same recognizable blue body, head/face language, orange lips and uncanny meme identity.
- Production character/environment art remains raster-first. Do not replace the hero with SVG/vector/primitive shape art.
- The readable pigeon silhouette is centered on the actual viewport, not merely the leftover content column.
- The hero may not intrude into the top HUD, right upgrade panel, mobile bottom tray, event/result UI or desktop bottom CTA matte.
- UI may not cover the hero's readable face/torso/silhouette.
- Growth may enlarge the hero only until the safe-zone boundary; framing must adapt before overlap is allowed.
- The runtime must render exactly one full hero layer. Never use a second enlarged/mirrored pigeon image as background fill.

Canonical rules:
- `AGENTS.md` — mandatory meme-pigeon visual contract;
- `design/art/meme-pigeon-identity.md`;
- `design/ui/hero-first-layout.md`.

## Completed

- Replaced the prior generic pigeon identity with the user-approved blue/orange-lipped meme pigeon raster in the live Phaser runtime.
- `MainScene` positions the source by the measured pigeon silhouette so the bird itself is centered on the viewport.
- `BreadRushScene` uses the same identity and the same center/safe geometry while keeping bread targets, timer and scoring live.
- Preserved existing gameplay/economy/save/platform behavior: Feathers, six upgrade branches, Total Upgrade Level, Growth, combo/crit/passive/automation, save/offline, rewarded transactions and Bread Rush.
- Added hard runtime QA markers:
  - `heroCentered=true`;
  - `heroSafe=true`;
  - `heroLayers=1`.
- Browser Visual QA asserts all three invariants on desktop, mobile, event-ready and active Bread Rush captures.
- Removed the failed cloned-background approach. There is no second/background pigeon render.
- Wide desktop composition now treats unused portrait-raster space as intentional HUD matte instead of stretching or mirroring the character art.
- Added a desktop-only `NEXT CHAOS / BREAD RUSH` progression rail in the left safe zone. It reflects the existing event's Total Lv 90 unlock, cooldown/readiness and best score; no new gameplay system was added.
- Added a deliberate desktop bottom CTA matte and keeps `TAP THE PIGEON` below the hero instead of over its face/body.
- Mobile keeps the hero dominant and centered while the upgrade tray stays below the readable silhouette.

## Verification Evidence

Verified runtime candidate SHA `303a12e9a3277893b0b343f2f09df15dad3077f7`:

- CI run `33146254160`: PASS.
  - raster generation: PASS;
  - raster-only / no-SVG gate: PASS;
  - Vitest: PASS;
  - strict TypeScript / Vite production build: PASS.
- Browser Visual QA run `33146254159`: PASS.
  - desktop main 1440x900: captured and manually reviewed;
  - mobile main 390x844: captured and manually reviewed;
  - event-ready: captured;
  - active Bread Rush: captured and manually reviewed;
  - Bread Rush clock assertion: PASS;
  - `heroCentered`: PASS;
  - `heroSafe`: PASS;
  - `heroLayers=1`: PASS;
  - console/page errors: none.
- Manual review confirmed the full feet/legs are visible again, there is no second/ghost pigeon, the hero remains centered, and the UI routes around the readable silhouette.

## Current Visual Status

- The meme pigeon is now the runtime focal identity rather than a generic pigeon.
- Desktop and mobile both obey the hero-first safe-zone contract.
- The current raster is still one base visual state. It is intentionally not yet a full cosmetics/Growth asset set.

## Next

1. Produce Growth milestone variants around the same meme identity instead of changing character identity.
2. Build visible cosmetics sized for this body/face: glasses, chains, crowns, aura and later absurd variants.
3. Keep every new variant inside the same hero-safe composition contract and extend Visual QA to representative cosmetic/Growth states.
4. Continue event/content depth, audio/game-feel and portal QA after the visual progression set is established.

## Blockers

None for continued development. The meme-pigeon identity/layout pass is implemented and browser-verified; the overall game is not yet release-complete.

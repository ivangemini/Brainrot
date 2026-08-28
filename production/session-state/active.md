# Active Session — Growth Art Stages v1

> Updated: 2026-08-28
> Working branch: `codex/growth-art-stages-v1`
> Task: Execute the next roadmap item after Mutation v1 — replace late-game Growth zoom/reframing with distinct generated-raster scale scenes at Total Lv 90/150/240/360/420 while preserving the approved hero fidelity and existing gameplay systems.

## Completed

- Kept the authoritative progression thresholds and mechanics unchanged. This pass is presentation/integration work, not a new progression system.
- Added `src/content/growth-visual-content.ts` as the data-driven mapping between authoritative Growth stage IDs and runtime art state:
  - stages 0–3 keep the established hero with mild reframe;
  - Stage 4 / Total Lv 90 -> human-scale scene;
  - Stage 5 / Total Lv 150 -> car-scale scene;
  - Stage 6 / Total Lv 240 -> building-scale scene;
  - Stage 7 / Total Lv 360 -> mega-city scale scene;
  - Stage 8 / Total Lv 420 -> city-landmark scale scene.
- Added stage-specific normalized tap hitboxes so interaction remains aligned as the visible pigeon footprint changes.
- Added a deterministic raster compositor at `tools/art/generate-growth-stage-assets.mjs` and wired it into `npm run art:generate` before event/mutation generation.
- Added `sharp` as the build-time raster compositor dependency.
- Preserved the approved `main_scene_hero.webp` as the material/detail source for all major Growth scenes:
  - soft raster pigeon extraction from the approved hero;
  - preserved feather, neck-iridescence, chain, beak and sunglasses detail;
  - progressively recomposed scene footprint;
  - flattened human/car/building/skyline/city scale-reference layers;
  - no SVG/runtime vector fallback.
- Rejected an earlier low-fidelity giant-pigeon redraw after manual browser screenshot review, despite its green automated checks. It was replaced before merge with the high-fidelity hero-source compositor.
- MainScene now preloads the unique Growth textures and switches them from authoritative Growth state.
- Scene-changing Growth transitions crossfade previous -> next raster state, then run controlled flash/shake plus the canonical stage name/subtitle.
- Initial load of an existing late-game save immediately uses the correct stage art without replaying an old Growth ceremony.
- Stage 4+ Mutation treatments are progressively attenuated so build identity remains visible but cannot cover the Growth scene payoff.
- Bread Rush now inherits both the player's current Growth scene and selected Mutation treatment instead of reverting to the original park hero.
- Added deterministic Growth visual tests covering:
  - every authoritative stage ID;
  - exact 90/150/240/360/420 mapping;
  - unique major raster paths;
  - no SVG paths;
  - preload de-duplication;
  - normalized stage hitboxes;
  - Mutation scale/opacity policy;
  - safe unknown-stage fallback.
- Expanded browser Visual QA:
  - desktop Stage 4/5/6/7/8 screenshots;
  - mobile Stage 6 screenshot;
  - SHA-256 hash assertion that all five major Phaser canvas renders are distinct;
  - Bread Rush tested at Stage 6 with Business Mutation active;
  - existing desktop/mobile main and Mutation choice/persistence checks remain covered.
- Added `design/art/growth-stage-scenes.md` documenting the implemented scene matrix, fidelity pipeline, transition contract and QA requirements.

## Verification Evidence

Final gameplay/art code SHA `f51c534f782b4b7e5f0c3e8bd1fb9ac764abfd8b`:

- CI run `33146031848`: PASS.
  - `sharp` raster compositor install: PASS;
  - all Growth raster scenes generated: PASS;
  - raster-only / no-SVG gate: PASS;
  - Mutation balance identity guard: PASS;
  - Vitest including Growth visual mapping/opacity coverage: PASS;
  - strict TypeScript + Vite production build: PASS.
- Browser Visual QA run `33146031793`: PASS.
  - desktop Growth Stage 4/5/6/7/8: captured;
  - five major canvas hashes all distinct: PASS;
  - mobile Growth Stage 6: captured;
  - Bread Rush Stage 6 + Business Mutation: captured and clock assertion PASS;
  - desktop/mobile Mutation choice regression coverage: PASS;
  - Business Mutation persistence: PASS;
  - console/page errors: none reported by the QA script.
- Manual screenshot review: PASS after one required revision.
  - first generated giant-pigeon pass was rejected for lower fidelity than the approved hero;
  - final pass preserves detailed feather/material rendering while making scale readable through human -> car -> building -> skyline -> city references;
  - late-stage Business treatment opacity was reduced after screenshot review so it no longer masks the Growth art;
  - compact mobile Stage 6 remains readable and the Growth scale reference survives the portrait crop.

## Current Runtime Status

- Roadmap item 1 after Mutation v1 is complete: late Growth progression now changes actual runtime art/environment instead of primarily changing camera framing.
- Total Lv 90, 150, 240, 360 and 420 each have distinct generated-raster runtime scenes.
- The approved hero identity/material quality is retained across the sequence.
- Growth art remains composable with Mutation state and Bread Rush.
- The overall game is still not release-complete; post-Mutation content depth is now the next roadmap bottleneck rather than late Growth visual differentiation.

## Next

1. Add the next meaningful content/event beat after Mutation so the post-150 loop does not collapse back into only upgrade purchasing.
2. Add audio and stronger game-feel layering for Growth, Mutation, crits and Bread Rush.
3. Continue portal/mobile QA and release-readiness work after the post-Mutation content pass.

## Blockers

None for continued development. Growth Art Stages v1 is implemented and verified; continue with the next roadmap item, post-Mutation content/event depth.

# Growth Stage Scene Matrix

> Status: Implemented v0.1
> Updated: 2026-08-28
> Scope: Roadmap visual-progression pass after Mutation v1

## Goal

Major Growth thresholds must change the readable scale relationship between the pigeon and the world. Stages 90/150/240+ are not allowed to read as the same hero illustration with a larger CSS/Phaser scale value.

## Runtime matrix

| Growth Stage | Total Level | Runtime scene | Scale reference |
|---:|---:|---|---|
| 0–3 | 0–89 | established park hero | bench / park / human furniture |
| 4 — Human-Sized | 90 | `growth_stage_04_human.png` | broken bench, people, lamp, park edge |
| 5 — Car Pigeon | 150 | `growth_stage_05_car.png` | roadway, cars, traffic signal |
| 6 — Building Pigeon | 240 | `growth_stage_06_building.png` | rooftops, skyline, helicopter |
| 7 — Mega Pigeon | 360 | `growth_stage_07_mega.png` | skyscrapers below body mass, clouds, aircraft |
| 8 — City Pigeon | 420 | `growth_stage_08_city.png` | dense city foreground, atmospheric skyline |

All major scene files are deterministic generated raster PNGs built by `tools/art/generate-growth-stage-assets.mjs` before dev/build. No SVG or runtime vector illustration is introduced.

## Fidelity pipeline

The approved `main_scene_hero.webp` remains the material/detail authority. The Growth generator uses it as the raster source, extracts a soft pigeon layer, preserves the existing feather/chain/beak/sunglasses detail, recomposes that layer at the new Growth silhouette/footprint, and adds flattened raster scale-reference foreground/background layers. `sharp` performs the raster extraction, resizing, blur and composition before the game starts; the browser never reconstructs the illustrated scene from vectors or CSS shapes.

A rejected earlier pass redrew the giant pigeon from simple raster primitives. Browser screenshot review showed that it lost too much fidelity relative to the approved hero, so it was replaced before merge rather than accepted merely because CI was green.

## Composition rules

- The pigeon remains near the established normalized center so Mutation treatments remain composable across Growth stages.
- Major stages change the visible pigeon footprint and environment relationship rather than relying on uniform runtime scale alone.
- Environment props become the primary scale proof: human -> car -> building -> skyline -> city.
- Familiar city references remain dominant through Stage 8; cosmic/surreal backgrounds are reserved for later progression.
- Mutation treatments become progressively more transparent from Stage 4 onward so the Growth scene remains the primary payoff while build identity stays readable.
- Stage-specific hitboxes remain data-driven because the visible pigeon footprint changes substantially.

## Transition behavior

- Stages 0–3 retain the established hero with mild reframe only.
- Crossing into a scene-changing stage crossfades the previous raster scene into the new one.
- Growth ceremony adds a controlled flash/shake plus stage name and subtitle.
- Loading an existing save uses the correct stage scene immediately without replaying an old Growth ceremony.
- Bread Rush uses the player's current Growth scene and current Mutation treatment rather than reverting to the original park hero.

## QA contract

Browser Visual QA captures desktop Stage 4/5/6/7/8 and mobile Stage 6. It hashes the Phaser canvas for each major desktop stage and fails if any two major Growth renders are identical. Existing Bread Rush and Mutation screenshots remain in the same workflow. Human review of the final browser captures is also required because hash uniqueness cannot establish visual fidelity by itself.

## Acceptance

- [x] Total 90 has a distinct human-scale scene and silhouette.
- [x] Total 150 has a distinct car-scale scene and silhouette.
- [x] Total 240 has a distinct building-scale scene and silhouette.
- [x] Total 360 has a distinct mega-city scale scene and silhouette.
- [x] Total 420 has a distinct city-landmark scene and silhouette.
- [x] Major stages retain approved hero material/detail fidelity instead of replacing it with low-fidelity redraws.
- [x] Major stages use generated raster assets only.
- [x] Mutation visual identity remains composable without obscuring giant Growth art.
- [x] Bread Rush inherits current Growth/Mutation visuals.
- [x] Major stage renders are covered by deterministic unit mapping, browser screenshot/hash QA and manual screenshot review.

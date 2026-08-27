# Technical Preferences

> **Configured**: 2026-08-27
> **Project**: Pigeon Maxxing (working title)
> **Architecture style**: Web-first, data-driven incremental game with platform adapters

## Engine & Language

- **Engine**: Phaser 4.2.1
- **Language**: TypeScript (strict mode)
- **Bundler / Dev Server**: Vite
- **Rendering**: Phaser WebGL scene for world/pigeon/raster VFX/minigames + HTML/CSS DOM overlay for primary UI
- **Physics**: No general-purpose physics dependency for the core clicker. Use deterministic lightweight geometry/collision for minigames unless a concrete feature justifies more.

## Input & Platform

- **Target Platforms**: Web/browser portals — Yandex Games first, CrazyGames and generic web adapters; desktop + mobile browsers
- **Input Methods**: Touch/pointer, mouse; limited keyboard shortcuts where useful
- **Primary Input**: Pointer/touch tap
- **Gamepad Support**: None for MVP
- **Touch Support**: Full
- **Platform Notes**:
  - responsive portrait and landscape layouts;
  - no hover-only required interactions;
  - active tap/minigame controls must remain clear of portal ad-safe regions;
  - game flow must support pause/mute during external fullscreen/rewarded ads;
  - gameplay code must not call portal SDK globals directly.

## Naming Conventions

- **Classes / Types / Interfaces**: PascalCase (`UpgradeDefinition`, `PlatformAdapter`)
- **Variables / Functions**: camelCase (`totalUpgradeLevel`, `purchaseUpgrade()`)
- **Events**: namespaced kebab strings (`upgrade:purchased`, `growth:stage-changed`)
- **Files**: kebab-case (`upgrade-system.ts`, `yandex-platform-adapter.ts`)
- **Asset folders/files**: lowercase snake/kebab according to Art Bible naming grammar
- **Constants**: UPPER_SNAKE_CASE for true constants; tunable numbers must live in config/content data
- **CSS classes**: kebab-case with component namespace where useful

## Performance Budgets

### Runtime
- **Target Framerate**: 60 fps on supported mobile/desktop browsers
- **Frame Budget**: 16.67 ms target; sustained gameplay should keep main-thread spikes below 50 ms outside intentional loading transitions
- **Draw Calls**: target <150 in ordinary clicker scene; investigate if sustained >200
- **Decorative Particles**: pooled and capped by quality tier

### Memory / Loading
- **Initial compressed payload target**: <=12 MB for first playable screen including code and essential assets
- **Initial decoded texture target**: <=64 MB on mobile
- **Typical loaded texture ceiling**: <=128 MB mobile; unload/lazy-load later zones and high-tier art
- **Atlas pages**: prefer <=2048×2048 per page
- **Late content**: lazy-load before first required use

The first CI-verified code bundle is ~1.39 MB minified / ~365 KB gzip before raster textures. Phaser is currently the dominant chunk; code splitting is a later optimization, not a blocker for the first playable.

## Testing

- **Unit / deterministic logic**: Vitest
- **Browser / integration / responsive smoke**: Playwright
- **Balance simulation**: deterministic scripts under `tools/balance/`
- **CI**: Node 24, deterministic raster generation, raster-only contract check, unit tests, TypeScript compile, Vite production build
- **Minimum expectation**:
  - economy formulas and purchase rules: automated tests;
  - save migrations: fixture tests;
  - rewarded-ad transaction idempotency: automated tests;
  - platform adapters: mocked contract tests;
  - primary game screen: browser smoke at phone + desktop viewport;
  - visual milestone combinations: manual/runtime evidence plus screenshot checks where practical.

## Architecture Principles

1. **Domain logic is Phaser-independent** — economy/progression/save rules live in plain TypeScript modules where possible.
2. **Portal SDKs are adapter-only** — no direct Yandex/CrazyGames calls from gameplay systems or UI components.
3. **Tuning is data** — upgrade curves, thresholds, multipliers and rewards are external config structures, not scattered numeric literals.
4. **Presentation consumes state/events** — Phaser scene and DOM UI do not own authoritative progression state.
5. **Save schema is versioned from day one** — migrations are explicit and tested.
6. **Reward transactions are idempotent** — ad retries/callback duplication cannot duplicate rewards.
7. **Graceful degradation** — analytics, ads and cloud APIs may fail without breaking the base game.
8. **Generated raster only** — player-facing illustrated production assets are PNG/WebP textures or raster atlases, never SVG/vector substitutes.

## Forbidden Patterns

- direct `window.YaGames` / `window.CrazyGames` access outside platform adapter modules;
- hardcoded progression/economy values in UI or scene code;
- authoritative state duplicated independently between Phaser objects and DOM UI;
- saving raw runtime objects/classes instead of a compact schema DTO;
- awarding rewarded-ad benefits before confirmed completion;
- timers based only on `Date.now()` without clock/offline validation boundaries;
- loading all future growth/zone art at initial boot;
- **any SVG player-facing production art, including icons/logos**;
- CSS/canvas/vector primitives used as replacement illustrated art for pigeon/world/props/accessories/icons/VFX;
- irreversible save-schema changes without a migration path.

## Allowed Libraries / Tooling

Approved core stack:
- Phaser 4.2.1
- TypeScript
- Vite
- Vitest
- Playwright

Do not add additional runtime libraries until a concrete feature requires them.

## Platform Adapter Contract

The platform layer should expose capabilities rather than portal-specific APIs, approximately:

```ts
interface PlatformAdapter {
  initialize(): Promise<void>;
  getCapabilities(): PlatformCapabilities;
  loadCloudSave(): Promise<CloudSaveResult>;
  saveCloud(payload: string): Promise<SaveResult>;
  showRewarded(request: RewardedAdRequest): Promise<RewardedAdResult>;
  showInterstitial(reason: InterstitialReason): Promise<InterstitialResult>;
  setGameplayActive(active: boolean): Promise<void>;
}
```

Exact signatures are finalized by ADR/architecture work; this section records the boundary intent.

## Rendering / Art Pipeline

- layered pigeon composition with canonical pivots/anchors;
- **generated raster PNG/WebP only** for pigeon, world, props, accessories, illustrated UI icons and production VFX;
- first playable generates 25 PNG textures deterministically with `tools/art/generate-raster-assets.mjs` before dev/build;
- production replacements may use higher-fidelity generated PNG masters and WebP runtime exports for compression;
- raster texture atlases for small repeated assets as the pack grows;
- tween/procedural **motion** may animate raster layers but does not replace asset art;
- major growth stages use body/silhouette raster tiers, not only uniform scaling;
- DOM/CSS is limited to UI layout, typography and panel geometry; it is not an illustration pipeline;
- SVG is forbidden from the player-facing production asset pipeline.

## Architecture Decisions Log

- ADR-0001: Phaser + DOM split.
- ADR-0002: Authoritative GameStore.
- ADR-0003: Tuning / EconomyNumber boundary.
- ADR-0004: Platform Adapter boundary.
- ADR-0005: Save/offline contract.
- ADR-0006: Layered generated-raster pigeon composition.
- Current platform research: `docs/architecture/platform-research.md`.

## Engine Specialists / Role Routing

The imported engine-specific Unity/Godot/Unreal profiles do not govern this web stack. Apply general roles instead:

- **Primary architecture**: `agents/technical-director.md`, `agents/lead-programmer.md`
- **Gameplay/domain TypeScript**: `agents/gameplay-programmer.md`
- **UI**: `agents/ui-programmer.md`, `agents/ux-designer.md`
- **Rendering/art pipeline**: `agents/technical-artist.md`, `agents/art-director.md`
- **Performance**: `agents/performance-analyst.md`
- **Economy**: `agents/economy-designer.md`, `agents/systems-designer.md`
- **QA**: `agents/qa-lead.md`, `agents/qa-tester.md`

### File Extension Routing

| File Extension / Type | Role Profile |
|---|---|
| TypeScript game/domain (`.ts`) | gameplay-programmer / lead-programmer as appropriate |
| Phaser rendering/scene (`.ts`) | gameplay-programmer + technical-artist |
| HTML/CSS UI | ui-programmer + ux-designer |
| Raster art / texture pipeline | technical-artist + art-director |
| Balance/config data | economy-designer + systems-designer |
| Platform adapters | lead-programmer + security-engineer where relevant |
| Architecture | technical-director |

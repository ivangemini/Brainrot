# Pigeon Maxxing — Master Architecture

## Document Status

- **Version**: 1.0-preproduction
- **Last Updated**: 2026-08-27
- **Runtime**: Browser
- **Engine**: Phaser 4.2.1
- **Language**: TypeScript strict
- **Bundler**: Vite
- **UI**: HTML/CSS DOM overlay
- **Target**: Yandex Games first; CrazyGames + generic web via adapters
- **Technical Director Sign-Off**: APPROVED FOR SCAFFOLD — remaining ADRs listed below

## 1. Architecture Goals

1. Core incremental economy is deterministic, testable and independent of rendering/portal SDKs.
2. One authoritative serializable state prevents Phaser/UI/save disagreement.
3. Tuning values are data consumed by runtime and balance tools.
4. Portal advertising/cloud behavior is isolated behind capability adapters.
5. Visual progression can combine many upgrade states without full-skin combinatorial explosion.
6. The game boots and remains playable when ads, cloud or analytics are unavailable.
7. Initial architecture stays small enough for a browser clicker; do not introduce enterprise abstractions without a concrete need.

## 2. System Layer Map

```text
┌────────────────────────────────────────────────────────────────────┐
│ PRESENTATION                                                       │
│  Phaser WorldScene / PigeonComposer / VFX / Event Scenes          │
│  DOM HUD / Upgrade Panel / Modals / Collection / Results           │
├────────────────────────────────────────────────────────────────────┤
│ FEATURE                                                            │
│  Pigeon Events | Mutation | Collection | Monetization Orchestrator │
├────────────────────────────────────────────────────────────────────┤
│ CORE DOMAIN                                                        │
│  GameStore | Economy | Upgrades | Growth | Combo/Crit | Rewards    │
│  Derived Selectors | Domain Events                                 │
├────────────────────────────────────────────────────────────────────┤
│ FOUNDATION                                                         │
│  Content Registry | Save/Migrations | Game Clock | RNG abstraction │
│  Asset Manifest | Analytics Port                                  │
├────────────────────────────────────────────────────────────────────┤
│ PLATFORM                                                           │
│  Browser APIs | Yandex Adapter | CrazyGames Adapter | Generic Web  │
└────────────────────────────────────────────────────────────────────┘
```

Dependency direction is downward for commands/contracts. Presentation never becomes a source of authoritative progression state.

## 3. Proposed Source Tree

```text
src/
  app/
    bootstrap.ts
    game-app.ts
    app-lifecycle.ts

  content/
    content-registry.ts
    content-schema.ts
    economy-content.ts
    visual-content.ts

  domain/
    state/
      game-state.ts
      game-store.ts
      selectors.ts
    economy/
      economy-service.ts
      economy-formulas.ts
      upgrade-service.ts
      growth-service.ts
      combo-service.ts
      passive-service.ts
    rewards/
      reward-ledger.ts
      reward-types.ts
    mutations/
      mutation-service.ts
    collection/
      collection-service.ts
    events/
      pigeon-event-service.ts
      bread-rush-model.ts
      pigeon-drop-model.ts
    events-bus/
      domain-events.ts
      domain-event-bus.ts

  time/
    game-clock.ts
    wall-clock-provider.ts

  persistence/
    save-schema.ts
    save-service.ts
    migrations/
      v1.ts

  platform/
    platform-adapter.ts
    platform-capabilities.ts
    generic-web-adapter.ts
    yandex-platform-adapter.ts
    crazygames-platform-adapter.ts

  monetization/
    monetization-service.ts
    rewarded-transactions.ts
    ad-policy.ts

  presentation/
    phaser/
      create-phaser-game.ts
      scenes/
        boot-scene.ts
        main-scene.ts
        bread-rush-scene.ts
        pigeon-drop-scene.ts
      pigeon/
        pigeon-composer.ts
        attachment-manifest.ts
      vfx/
        tap-feedback-controller.ts
        growth-ceremony-controller.ts
    dom/
      ui-shell.ts
      hud.ts
      upgrade-panel.ts
      growth-meter.ts
      modal-host.ts
      event-result.ts
      mutation-modal.ts
      collection-screen.ts

  infrastructure/
    analytics/
      analytics-port.ts
      noop-analytics.ts
      analytics-service.ts

  shared/
    assert.ts
    id.ts
    number-format.ts
    economy-number.ts

tests/
  unit/
  integration/
  fixtures/

tools/
  balance/
```

The exact file count can be reduced during implementation; module boundaries matter more than matching this tree literally.

## 4. Module Ownership

### GameStore
**Owns** the current authoritative `GameState` DTO-like data during runtime.

It does not expose uncontrolled mutable references. Domain services apply commands/transactions through defined methods or a controlled reducer-style mutation boundary.

Minimum state slices:
- economy currency;
- upgrade levels;
- growth/run progression;
- combo transient state (not necessarily persisted);
- mutation state;
- collection state;
- event state;
- pending/completed reward transaction ledger subset;
- settings;
- meta/prestige later.

### ContentRegistry
**Owns** immutable canonical definitions for current balance/content version.

Responsibilities:
- parse/validate data;
- resolve stable IDs;
- provide branch/growth/mutation/visual definitions;
- expose schema/balance version.

It does not own player progress.

### EconomyService
**Owns** commands that produce/spend Feathers and compute authoritative economic effects.

Public intent:
- credit tap;
- query/perform upgrade purchase;
- calculate production snapshot;
- apply non-ad reward transaction through RewardLedger.

Economy formulas are pure functions where possible.

### UpgradeService
**Owns** branch purchase validation, level mutation, milestone crossing detection and unlock evaluation.

### GrowthService
**Owns** derived Growth Stage from total branch levels and stage-transition domain events. It exposes semantic stage IDs; it does not manipulate Phaser scale/camera directly.

### ComboService
**Owns** transient active combo charge/multiplier using ActiveGameplayClock. Presentation consumes normalized combo state.

### RewardLedger
**Owns** idempotent reward application IDs.

Any external/async reward (rewarded ad, offline claim, event result if persisted asynchronously) is applied through a stable transaction ID. This is a central anti-duplication boundary.

### MutationService
**Owns** mutation eligibility and selected stable IDs/modifier contributions.

### CollectionService
**Owns** discovered IDs and condition evaluation from domain events/state.

### PigeonEventService
**Owns** event availability/lifecycle/reward result contract. Event-specific models own score state. Phaser event scenes are presentation/input implementations of these models.

### GameClock
**Owns** pause tokens and active-time deltas. Domain timers never use Phaser scene time as their only authority.

### SaveService
**Owns** serialization, local storage, cloud sync coordination, revision/conflict logic and migrations.

It consumes a compact state snapshot; it does not reach into scene objects.

### PlatformAdapter
**Owns** all direct portal SDK interaction.

No other module may reference Yandex/CrazyGames global SDK objects.

### MonetizationService
**Owns** ad candidate policy and rewarded transaction orchestration. It translates game-domain offers into adapter calls and then RewardLedger application.

It does not own underlying economic formulas.

### PigeonComposer
**Owns** runtime mapping from semantic visual state to Phaser sprites/layers/anchors. It consumes domain state/selectors and content manifests.

### DOM UI
**Owns** interactive controls and display state only. Commands call domain/application services. It subscribes to state/events/selectors.

### Analytics
**Owns** telemetry serialization/transport through a no-op-safe port. Gameplay never awaits analytics to complete a progression transaction.

## 5. State Model

Conceptual TypeScript shape:

```ts
interface GameState {
  schemaVersion: number;
  balanceVersion: string;
  saveRevision: number;
  economy: {
    feathers: EconomyNumber;
    branchLevels: Record<UpgradeBranchId, number>;
  };
  run: {
    growthStageId: GrowthStageId;
    mutationIds: MutationId[];
  };
  collection: {
    discoveredIds: string[];
  };
  rewards: {
    appliedTransactionIds: string[];
    pending?: PendingRewardTransaction[];
  };
  settings: PlayerSettings;
  meta: MetaProgressionState;
}
```

Transient scene/animation/combo internals may live outside the persisted DTO but still have one authoritative runtime owner.

## 6. EconomyNumber Boundary

MVP values are expected to remain comfortably representable by JavaScript `number`, but the domain must not leak raw number assumptions everywhere.

Define an `EconomyNumber` alias/utility boundary initially backed by `number` plus invariants/formatting helpers. Avoid adding a decimal/bignum runtime dependency until actual progression requires it.

If future prestige pushes values near unsafe integer precision, replace/migrate behind this boundary rather than refactoring every UI/domain API.

MVP invariants:
- finite;
- non-negative for currency/production;
- economy tests exercise large expected late-MVP values;
- values at/near unsafe precision trigger development assertions/telemetry before production content reaches them.

## 7. Command and Event Boundary

### Rule
Use **direct commands/service calls** to cause state changes and **typed domain events** to notify presentation/secondary systems after a committed change.

Do not turn the entire architecture into an opaque global event bus.

Examples:

Command:
`upgradeService.purchase('beak')`

Committed events:
- `upgrade:purchased`
- optionally `upgrade:milestone-reached`
- optionally `growth:stage-changed`
- optionally `branch:unlocked`

Consumers:
- PigeonComposer refreshes visuals;
- DOM UI refreshes selectors;
- VFX starts ceremony;
- Collection evaluates discovery;
- Analytics records event;
- SaveService marks high-value state dirty/immediate.

## 8. Key Data Flows

### 8.1 Tap

```text
Pointer/Touch
  -> MainScene input
  -> EconomyService.creditTap(inputContext)
  -> Combo/Crit calculation
  -> GameStore Feather mutation
  -> TapResult returned + domain event
  -> VFX controller / HUD / Analytics aggregate
```

Render FPS does not determine payout math.

### 8.2 Upgrade purchase

```text
DOM Upgrade button
  -> UpgradeService.purchase(branchId)
  -> ContentRegistry cost/effect lookup
  -> validate funds/unlock
  -> atomic currency + level transaction
  -> recompute derived selectors
  -> emit purchase/milestone/growth/unlock events
  -> UI + PigeonComposer + Growth ceremony
  -> SaveService checkpoint
```

### 8.3 Growth transition

Domain state changes first. Presentation ceremony is then allowed to temporarily block normal input. If animation fails, state remains correctly grown.

```text
Upgrade transaction
 -> GrowthService detects new stage
 -> GameStore stage ID updated
 -> growth:stage-changed
 -> App flow adds growth-ceremony pause token
 -> MainScene/PigeonComposer transition body/framing/environment
 -> ceremony complete
 -> pause token removed
```

### 8.4 Rewarded ad

```text
DOM result/offer
 -> MonetizationService.createRewardedTransaction
 -> GameClock add external-ad token
 -> PlatformAdapter.showRewarded
 -> result
 -> finally release ad lifecycle safely
 -> if completed: RewardLedger.applyOnce(transactionId, reward)
 -> GameStore mutation
 -> Save immediate
 -> UI result
```

Baseline offline/event reward is not held hostage by this async flow.

### 8.5 Save

```text
GameStore snapshot
 -> SaveService serialize SaveDTO
 -> local commit
 -> optional PlatformAdapter cloud save
 -> revision metadata update
```

Cloud errors do not rollback already valid local gameplay transactions.

### 8.6 Boot

```text
bootstrap
 -> detect/select PlatformAdapter
 -> initialize adapter (bounded failure handling)
 -> load/validate content
 -> load local/cloud save + migrate/resolve
 -> construct GameStore/services
 -> create DOM shell
 -> create Phaser game
 -> preload essential assets
 -> ready/main scene
```

A generic development build uses GenericWebPlatformAdapter.

## 9. Rendering Architecture

### Phaser owns
- world background/props;
- pigeon layered sprites;
- particles/VFX;
- camera;
- event/minigame play fields;
- pointer hit target over world.

### DOM owns
- HUD text;
- Growth meter;
- upgrade cards/buttons;
- collection/settings/modals;
- rewarded offer buttons;
- responsive layout/safe-area adaptation.

### Integration
DOM and Phaser read the same authoritative domain/store/selectors. Neither copies progression into an independently mutated state model.

Use CSS variables/layout tokens for canvas-safe regions and portal banner reservations.

## 10. Asset Architecture

### Manifest-driven pigeon composition

Content maps semantic state to asset IDs. Asset manifest maps IDs to URLs/atlas frames and attachment metadata.

```text
branch/growth/mutation state
 -> VisualStateSelector
 -> semantic layer IDs
 -> AssetManifest
 -> Phaser textures/frames + canonical anchor transforms
 -> PigeonComposer
```

### Loading groups
- `boot`: minimal UI/loading assets;
- `main-early`: base pigeon + first Growth/branch states + Park;
- `event-bread-rush`;
- `event-pigeon-drop`;
- later growth/zone/mutation groups loaded before eligibility or reveal.

Do not load every future form at startup.

## 11. Persistence Architecture

### Local adapter
Wrap storage behind an interface so Yandex safe storage or normal browser storage can be selected without domain code changes.

### Cloud
SaveService asks PlatformAdapter for cloud capability. Yandex payload budget target remains far below current 200 KB documented limit.

### Revision/conflict
Persist metadata envelope separately/within DTO:
- schema;
- balance;
- revision;
- timestamps;
- progression summary for diagnostics.

### Migration
Pure functions transform DTO versions before GameStore construction.

## 12. Platform Architecture

Adapter selection may use build/environment detection:
- explicit dev override;
- Yandex SDK environment;
- CrazyGames SDK environment;
- generic web fallback.

The adapter exposes semantic promises/results, not raw callback shapes.

Example result enums:
- rewarded: `completed | cancelled | unavailable | error`;
- interstitial: `shown | not-shown | unavailable | error`;
- cloud: `ok | unavailable | error`.

Portal-specific lifecycle mapping remains internal to adapter.

## 13. Testing Architecture

### Unit
Vitest:
- formulas;
- costs;
- milestone/growth crossings;
- combo time semantics;
- crit expected/capped rules;
- reward idempotency;
- mutation modifiers;
- collection unlock predicates;
- save migrations;
- clock pause tokens.

### Contract
Mock PlatformAdapter:
- rewarded success/error/duplicate callback semantics;
- cloud unavailable/conflict paths;
- lifecycle pause/resume.

### Browser integration
Playwright:
- new save -> first purchase;
- several purchases -> Growth ceremony;
- refresh persistence;
- portrait/landscape/desktop main UI;
- event launch/result;
- mocked rewarded flow;
- no portal SDK generic build.

### Balance
Python/tooling simulation reports milestone timing by tuning version and representative play profile.

### Visual/runtime evidence
Capture real runtime screenshots for:
- early main screen;
- at least five Growth stages as assets arrive;
- representative multi-branch compositions;
- ad-safe responsive layouts.

Mockups are not sufficient evidence of production visual completion.

## 14. Performance Architecture

- 60 fps target.
- Pool frequent particles/floating values.
- Coalesce high-frequency visual payout text.
- Avoid DOM mutation per tap for heavy structures; update minimal text/transform state.
- Keep economy calculations independent of render-loop frequency.
- Lazy-load later art.
- Cap helpers/effects visually even if simulation rate is large.
- Profile actual mobile Safari/Chromium-class browsers during production pass.

## 15. Security / Integrity Boundaries

This is a client-side casual game; determined users can modify local state. Do not over-engineer anti-cheat before backend/competitive features exist.

Protect instead against accidental/integration corruption:
- validate loaded save/config;
- clamp invalid numeric values;
- idempotent rewards;
- never eval remote content;
- portal adapter inputs treated as external/untrusted boundaries;
- no secrets embedded for nonexistent backend services.

Leaderboards/competitive integrity, if later introduced, require a separate trust model.

## 16. Required ADRs Before/Alongside Gameplay Scaffold

### ADR-0001 — Phaser + DOM split
Records why world/rendering uses Phaser while primary UI stays DOM/CSS.

### ADR-0002 — Authoritative GameStore and command/event boundary
Defines state ownership, command flow and typed notification events.

### ADR-0003 — Tuning/config and EconomyNumber boundary
Defines content source of truth and initial `number` representation with migration seam.

### ADR-0004 — Platform Adapter + ad lifecycle
Defines capability contract and portal isolation.

### ADR-0005 — Save schema, offline time and cloud conflict
Defines DTO versioning, migration and conflict strategy.

### ADR-0006 — Layered pigeon asset manifest
Defines semantic slots, attachment anchors and lazy loading.

These can be authored immediately during scaffold implementation; no other unresolved decision blocks setting up the repository/toolchain.

## 17. Architecture Principles

1. **State before spectacle** — commit progression, then animate it.
2. **Data before magic numbers** — economy/config is canonical content.
3. **Adapters at unstable boundaries** — portals, persistence transports and analytics are replaceable.
4. **Composition before asset explosion** — layered art + milestones create variation.
5. **Failure is a normal path** — ads/cloud/analytics can be unavailable.
6. **Measure before slowing the player** — retention/economy changes require telemetry/simulation evidence.
7. **Ship the core loop before expanding the universe** — no large live-ops/content systems until first-hour pacing and runtime presentation work.

## 18. Open Questions / Deferred Decisions

Not blockers for scaffold:
- final prestige architecture/content;
- final late-game large-number representation if values outgrow safe `number` range;
- production analytics provider;
- exact localization language list;
- whether generic non-portal hosting eventually gets its own ad provider (not in MVP).

# Pigeon Maxxing — Systems Index

> **Status**: Pre-production v0.1
> **Last Updated**: 2026-08-27
> **Design order principle**: Foundation -> Core -> Feature -> Presentation -> Polish

## System Enumeration

| # | System | Category | Layer | Priority | Status | Purpose |
|---:|---|---|---|---|---|---|
| 1 | Tuning & Content Data | Data | Foundation | MVP | Not Started | Owns upgrade definitions, costs, milestones, growth thresholds and other tunable data. |
| 2 | Save & Offline Time | Persistence | Foundation | MVP | Durable local/cloud progress, versioning, migrations and offline-duration calculation. |
| 3 | Platform Adapter | Platform | Foundation | MVP | Normalizes Yandex, CrazyGames and generic web SDK capabilities behind one interface. |
| 4 | Game State / Clock | Core Infrastructure | Foundation | MVP | App lifecycle, pause/resume, deterministic timing and ad-safe pause states. |
| 5 | Feather Generation | Economy | Core | MVP | Tap production, passive production, source accounting and display-safe numeric values. |
| 6 | Upgrade System | Progression | Core | MVP | Six upgrade branches, purchases, levels, unlocks and milestones. |
| 7 | Growth / Giantification | Progression | Core | MVP | Converts total upgrade level into physical growth stages and unlock gates. |
| 8 | Pigeon Visual Composition | Rendering | Core | MVP | Layered pigeon assembly, body tiers, accessories, branch visuals and growth scaling. |
| 9 | Active Combo & Criticals | Gameplay | Feature | MVP | Makes tapping skillful/satisfying through combo, decay, crits and feedback tiers. |
| 10 | Passive / Automation | Economy | Feature | MVP | Nest/Brain idle income, helpers, auto-taps and offline gain integration. |
| 11 | Pigeon Events | Minigames | Feature | MVP | 20–45 second arcade events and result/reward flow. |
| 12 | Mutation Choices | Progression | Feature | MVP | Infrequent build forks with mechanical and visual identity. |
| 13 | Collection & Discoveries | Meta | Feature | Vertical Slice | Records meaningful pigeon states, secrets and daily discovery goals. |
| 14 | Prestige / Ascension | Meta Progression | Feature | Alpha | Run reset, permanent bonuses and late-game tier expansion. |
| 15 | World / Zone Progression | Content | Feature | Vertical Slice | Park -> street/downtown -> later scale contexts and environment reaction sets. |
| 16 | Monetization | Ads | Feature | MVP | Rewarded/interstitial/banner policy and reward transactions through Platform Adapter. |
| 17 | Main HUD & Upgrade UI | UX/UI | Presentation | MVP | Responsive resource, growth, combo and upgrade interaction layer. |
| 18 | VFX / Animation Feedback | Presentation | Presentation | MVP | Tap juice, milestone effects, growth ceremonies and performance caps. |
| 19 | Audio | Presentation | Presentation | Vertical Slice | Layered tap/combo sounds, UI, growth stingers and music/ambience. |
| 20 | Analytics | Telemetry | Polish | MVP | Progression funnel, economy timing, ad engagement and retention events. |
| 21 | Accessibility & Localization | UX | Polish | Vertical Slice | Reduced motion, readable scaling, semantic backups, language-safe UI. |
| 22 | Daily / Live Content | Live Ops | Polish | Alpha | Daily Pigeon rotations and limited lightweight return hooks. |

## Dependency Map

### Foundation

**Tuning & Content Data**
- No gameplay dependency.
- Provides canonical numeric/config definitions to most systems.

**Save & Offline Time**
- Depends on: Platform Adapter for optional cloud capabilities.
- Must function locally when platform cloud APIs are unavailable.

**Platform Adapter**
- No gameplay dependency.
- Wraps ads, cloud save, authorization/profile, gameplay lifecycle and portal events.

**Game State / Clock**
- Depends on: Platform Adapter lifecycle callbacks.
- Provides pause-safe time to combo, events, offline calculations and ads.

### Core

**Feather Generation**
- Depends on: Tuning & Content Data, Game State / Clock.
- Consumed by: Upgrade System, UI, analytics, rewarded multipliers.

**Upgrade System**
- Depends on: Tuning & Content Data, Feather Generation, Save.
- Produces: branch levels, milestone events, Total Upgrade Level.

**Growth / Giantification**
- Depends on: Upgrade System, Tuning & Content Data.
- Produces: growth stage, scale target, camera/environment stage, unlock events.

**Pigeon Visual Composition**
- Depends on: Upgrade System, Growth / Giantification, art attachment manifest.
- Consumed by: VFX/Animation, mutations, collection screenshots/reveals.

### Features

**Active Combo & Criticals**
- Depends on: Feather Generation, Upgrade System, Game State / Clock.

**Passive / Automation**
- Depends on: Feather Generation, Upgrade System, Save & Offline Time.

**Pigeon Events**
- Depends on: Game State / Clock, Feather Generation, Tuning Data, VFX/UI.

**Mutation Choices**
- Depends on: Growth / Giantification, Upgrade System, Save, Visual Composition.

**Collection & Discoveries**
- Depends on: Growth, Mutations, Visual Composition, Save.

**Prestige / Ascension**
- Depends on: all core progression/economy systems plus Save.

**World / Zone Progression**
- Depends on: Growth, Visual Composition, Save.

**Monetization**
- Depends on: Platform Adapter, Game State / Clock, reward transaction service, Analytics.
- Rewarded rewards feed Feather/Events/Offline systems but monetization never owns base economy values.

### Presentation / Polish

**Main HUD & Upgrade UI** depends on core progression/economy state but owns no gameplay state.

**VFX / Animation Feedback** consumes gameplay events; it never decides progression.

**Audio** consumes gameplay/UI events.

**Analytics** consumes events but must never be required for game progression.

**Accessibility & Localization** constrain UI/audio/VFX presentation.

**Daily / Live Content** depends on Collection, Save and platform-safe time but must degrade gracefully offline.

## Bottleneck / High-Risk Systems

### Progression Economy
Upgrade System + Feather Generation + Growth are the central design bottleneck. Weak pacing here cannot be repaired by more content. Balance simulation is required before values are considered production-ready.

### Pigeon Visual Composition
Many systems rely on visible milestone state. Attachment anchors, layer ordering and art-state selection must be stable before high-volume asset production.

### Platform Adapter
Ad and save behavior differs by portal. Gameplay code must not call portal SDKs directly.

### Save & Offline Time
Incremental games are unusually sensitive to lost progress, clock exploits and save-schema churn. Versioning/migration begins in MVP.

## Design Order

1. **Tuning & Content Data** — define canonical config model.
2. **Feather Generation** — define primary economy sources.
3. **Upgrade System** — define branch effects/purchase rules.
4. **Growth / Giantification** — define total-level thresholds and unlock semantics.
5. **Active Combo & Criticals** — define active-play value.
6. **Passive / Automation** — define idle value and offline relationship.
7. **Pigeon Visual Composition** — define how design state maps to layers.
8. **Save & Offline Time** — define persistent state/contracts.
9. **Game State / Clock** — define lifecycle/time semantics.
10. **Platform Adapter** — define portal boundaries.
11. **Monetization** — define rewarded/interstitial transactions.
12. **Main HUD & Upgrade UI** — define primary interaction screen.
13. **VFX / Animation Feedback** — define game-feel budgets/tier mapping.
14. **Pigeon Events** — define minigame contract and first events.
15. **Mutation Choices** — define first build fork.
16. **Analytics** — finalize event taxonomy before vertical-slice testing.
17. **Collection & Discoveries**.
18. **World / Zone Progression**.
19. **Audio**.
20. **Accessibility & Localization**.
21. **Prestige / Ascension**.
22. **Daily / Live Content**.

## MVP Scope Summary

### Required for first commercial-quality MVP
- Tuning & Content Data
- Save & Offline Time
- Platform Adapter
- Game State / Clock
- Feather Generation
- Upgrade System
- Growth / Giantification
- Pigeon Visual Composition
- Active Combo & Criticals
- Passive / Automation
- Pigeon Events (at least 2)
- Mutation Choices (first decision)
- Monetization
- Main HUD & Upgrade UI
- VFX / Animation Feedback
- Analytics

### Vertical Slice expansion
- Collection shell/content
- second zone context
- production audio
- accessibility/localization pass

### Alpha/full vision
- prestige depth
- broader collection
- multiple later zones
- daily/live content rotation

## Scope Guardrails

Not in current architecture unless explicitly promoted later:
- PvP/multiplayer;
- user-generated content;
- narrative campaign;
- open-world movement;
- physics sandbox;
- native iOS/Android build;
- backend-required progression;
- multiple premium currencies;
- gacha monetization.
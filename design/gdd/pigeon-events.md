# Pigeon Events

> **Status**: Implemented v0.1
> **Last Updated**: 2026-08-28
> **Priority**: MVP Feature
> **Initial content**: Bread Rush + Pigeon Drop

## 1. Overview

Pigeon Events are short 20–45 second arcade bursts that periodically interrupt the pure clicker rhythm with a simple skill challenge. They reuse the game's pigeon/world identity, produce meaningful but bounded rewards, and create clean result screens for optional rewarded doubling and occasional interstitial/midgame candidates.

Events are not a second full game mode. They must be understandable within seconds and return the player to the main progression loop quickly.

The first commercial-MVP event set is now implemented as two distinct one-input activities: Bread Rush and Pigeon Drop.

## 2. Player Fantasy

The player briefly uses their absurdly upgraded pigeon instead of only upgrading it. Events should feel like small consequences of being a city pigeon — grabbing food, dropping something on targets, escaping chaos — while providing a competence moment inside an otherwise progression-driven game.

## 3. Detailed Rules

### Event eligibility
- Bread Rush unlocks at Total Upgrade Level 90.
- Pigeon Drop unlocks at Total Upgrade Level 180, deliberately after the first Mutation choice at 150 and before the Building Pigeon Growth beat at 240.
- Event invitation never interrupts a Growth ceremony, unresolved mutation choice, ad or another active event.
- A shared 5-minute active-play cooldown prevents event clumping after a completed run.
- Each event also retains its own cooldown (Bread Rush 6 minutes, Pigeon Drop 7 minutes in v0.1).
- When both events are available, the coordinator alternates away from the last completed event. With no event history after Pigeon Drop unlock, Pigeon Drop is surfaced first so the post-Mutation loop exposes the new content beat.

### Common event lifecycle
`available -> countdown -> active -> result -> rewardClaimed -> return`

During `active`:
- normal main-scene Feather tap transactions are paused;
- event timer uses the authoritative ActiveGameplayClock;
- external ad/background pauses timer through the existing gameplay lifecycle;
- event has one primary pointer/touch rule;
- only one Pigeon Event can own the runtime event slot at a time.

### Reward model
Every event has:
- a bounded economy-scaled completion reward;
- score-performance multiplier with bounded min/max;
- optional rewarded ×2 on result after the base reward is already secured;
- duplicate-safe transaction IDs so repeated completion/ad callbacks cannot grant twice.

Both events share the same event-economy reference pipeline. The reference snapshot is mutation-aware and includes representative active tap value, expected crit contribution and passive income. Chaos then applies its explicit Pigeon Event reward modifier separately.

### Event 1 — Bread Rush

#### Goal
Collect bread pieces appearing/moving across a compact play field before time expires.

#### Input
Tap/click bread targets. Pigeon snaps/leans toward the target with exaggerated peck/reach feedback.

#### Duration
30 seconds after a 3-second countdown.

#### Scoring
- normal bread = 1 point;
- rare golden bread = 4 points;
- miss taps have no punitive currency loss.

Current v0.1 tuning:
- target spawn interval: 0.9 s;
- target lifetime: 2.7 s baseline;
- golden chance: 8%;
- expected reward-normalization score: 22.

### Event 2 — Pigeon Drop

#### Goal
Time a single-action drop while a target moves below. Accuracy at impact creates score.

#### Input
One large `DROP NOW` button or the Phaser play field. After each impact a short reset makes the next attempt immediately legible.

#### Duration
30 seconds after a 3-second countdown.

#### Deterministic scoring
The target moves continuously in normalized coordinates and bounces between its configured field bounds. A requested drop has a fixed 0.48-second travel time; score uses target position at impact, not at input time.

Accuracy bands around field center:
- center distance <= 0.045 -> 5 points;
- near distance <= 0.10 -> 2 points;
- graze distance <= 0.16 -> 1 point;
- otherwise -> 0 points / miss.

Current v0.1 tuning:
- target field: 0.18–0.82 normalized X;
- target speed: 0.29 normalized units/sec;
- post-impact reset: 0.62 s;
- expected reward-normalization score: 30.

The session model is deterministic with respect to ActiveGameplayClock time. Drop flight and target movement are resolved in sub-slices so scoring does not depend on renderer FPS.

The illustrated treatment is intentionally abstract/comedic. Runtime art uses generated raster target, projectile and impact textures; there is no graphic bodily-fluid rendering.

### Event frequency
After unlock, completed events start a 5-minute shared anti-clumping cooldown plus the event-specific cooldown. This keeps the initial target around one meaningful event opportunity every 5–10 minutes of active progression without allowing both MVP events to stack back-to-back.

### Result screen
Shows:
- score;
- personal best;
- event-specific attempt/performance information;
- base Feathers reward;
- optional `Watch ad — 2× reward`;
- Continue.

Base reward is committed through a unique reward transaction and persisted before the optional rewarded action is offered.

### Event progression
MVP events have no separate permanent upgrade tree. Growth/Mutation state follows the player into event presentation and reward reference calculations rather than creating a parallel progression economy.

## 4. Formulas

### Shared event reference income
Conceptually:

`expectedCritFactor = 1 + critChance * (critMultiplier - 1)`

`referenceTapIncome = tapPayout(referenceCombo, nonCrit) * referenceTapsPerSecond * expectedCritFactor`

`referenceIncome = max(1, referenceTapIncome + passiveRate)`

All component formulas are mutation-aware.

### Event reward
`normalizedScore = min(normalizedScoreCap, score / expectedScore)`

`performanceMult = min(performanceMax, performanceBase + normalizedScore * performancePerNormalizedScore)`

`baseEventReward = referenceIncome * baseRewardSeconds * performanceMult`

`finalEventReward = baseEventReward * explicitEventModifiers`

Current common performance tuning:
- performance base = 0.75;
- performance per normalized score = 1.25;
- max = 2.0;
- normalized score cap = 1.2.

Bread Rush uses 60 reward-seconds; Pigeon Drop uses 75 reward-seconds.

The rewarded result option adds one additional copy of the already-calculated final base reward through a second unique transaction ID.

## 5. Edge Cases

- Browser backgrounds/ad overlays: ActiveGameplayClock stops; event timer and deterministic motion do not advance.
- Player reloads during active event: MVP abandons the transient session and returns safely to main state; no result transaction exists until completion.
- Duplicate `finishRun` callback: base transaction applies once; runs/best/cooldowns persist once.
- Duplicate rewarded callback: reward ledger prevents a second bonus grant.
- Rewarded ad unavailable/closed: Continue remains available and base reward remains committed.
- Event becomes eligible during unresolved Mutation: availability remains suppressed until Mutation is selected.
- Both events become ready simultaneously: deterministic coordinator uses last-event history to choose one invitation.
- Old schema-v1 save contains only Bread Rush fields: Pigeon Drop/shared fields sanitize to zero/null without invalidating the save.
- Malformed event progress: negative/NaN values sanitize safely; invalid event ID becomes null.
- Orientation change: Pigeon Drop target positions remain normalized and presentation reflows around the authoritative session state.
- Touch target/ad-safe layout: large Pigeon Drop action remains inside the gameplay region and has dedicated compact portrait treatment.

## 6. Dependencies

Upstream:
- Game State / ActiveGameplayClock;
- Progression Economy;
- Mutation modifiers;
- Save/reward ledger;
- Platform Monetization.

Presentation:
- Phaser scenes inherit current Growth art and Mutation treatment;
- DOM HUD/result overlays;
- generated raster event assets.

Downstream:
- Collection/event achievements may consume best scores later;
- analytics can consume event availability, participation, score and reward transactions without changing event rules.

## 7. Tuning Knobs

Common:
- unlock thresholds;
- shared cooldown;
- per-event cooldown;
- duration/countdown;
- rewardSeconds;
- performance curve/cap;
- event alternation policy.

Bread Rush:
- spawn interval;
- target lifetime/speed;
- target size;
- golden bread frequency/value.

Pigeon Drop:
- target range/speed;
- drop travel time;
- attempt reset time;
- accuracy band widths;
- score per band;
- expected score.

## 8. Implementation Notes — 2026-08-28

- `src/domain/event-economy.ts` is the common reward/reference pipeline for both MVP events.
- `src/domain/pigeon-drop.ts` owns the deterministic Pigeon Drop session and scoring state.
- `src/events/event-availability.ts` owns deterministic event opportunity selection/alternation.
- `GameStore` owns per-event progress plus shared anti-clumping cooldown state.
- `PigeonDropService` mirrors Bread Rush transaction safety and immediate result persistence.
- `PigeonDropScene` inherits the current Growth raster scene and selected Mutation instead of reverting to an early-game visual state.
- Pigeon Drop player-facing illustration is generated at build time by `tools/art/generate-pigeon-drop-assets.mjs`; the production runtime remains raster-only.
- Browser Visual QA has deterministic seeds for Bread Rush and Pigeon Drop separately so event alternation cannot make a regression test flaky.

## 9. Acceptance Criteria

- [x] Both initial events can be understood and played with one primary pointer/touch interaction.
- [x] Typical event duration remains under 45 seconds.
- [x] Background/ad pause cannot consume event timer because both scenes advance only from ActiveGameplayClock.
- [x] Base result reward is preserved when rewarded ad fails/is declined.
- [x] Rewarded ×2 uses a unique reward transaction and applies exactly once.
- [x] Event rewards scale with economy snapshot and remain mutation-aware across Growth Stages.
- [x] Main clicker production does not double-run during an active event.
- [x] Event invitations cannot overlap another event or an unresolved Mutation decision.
- [x] Shared cooldown/alternation prevents Bread Rush and Pigeon Drop from clumping back-to-back.
- [x] Pigeon Drop scoring is deterministic across renderer frame granularity.
- [x] Schema-v1 Bread Rush-only saves load with safe Pigeon Drop defaults.
- [x] Event result is a natural-break state; no ad is requested during the active timer.
- [x] Both MVP events are covered by representative desktop browser QA; Pigeon Drop additionally has compact portrait browser QA.

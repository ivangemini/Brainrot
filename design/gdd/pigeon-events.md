# Pigeon Events

> **Status**: Implemented v0.2
> **Last Updated**: 2026-08-28
> **Priority**: MVP Feature
> **Initial content**: Bread Rush + Pigeon Drop

## 1. Overview

Pigeon Events are short arcade bursts that interrupt the pure clicker rhythm with one immediately understandable action. They reuse the current Growth/Mutation identity, pay bounded economy-scaled rewards, and end on a natural result screen where an optional rewarded double can be offered without blocking the base reward.

Events are not a parallel campaign or progression tree. They are compact consequences of owning an increasingly absurd pigeon and must return the player to the main maxxing loop quickly.

The first commercial-MVP event set contains two mechanically distinct one-input events:
- **Bread Rush** — reaction/collection;
- **Pigeon Drop** — timing/precision.

## 2. Eligibility and Arbitration

### Unlocks
- Bread Rush: Total Upgrade Level **90**.
- Pigeon Drop: Total Upgrade Level **180**.
- Pigeon Drop deliberately lands after the first Mutation choice at 150 and before Building Pigeon at 240.

### Event slot rules
Only one Pigeon Event can own the runtime event slot.

An invitation is suppressed while:
- another event is active or showing its result;
- a Growth ceremony owns the presentation beat;
- the first Mutation decision is unresolved;
- gameplay is paused by an ad/background lifecycle reason.

### Cooldowns
- shared anti-clumping cooldown after any completed event: **5 minutes active play**;
- Bread Rush event cooldown: **6 minutes active play**;
- Pigeon Drop event cooldown: **7 minutes active play**.

When both events are ready, the coordinator alternates away from the last completed event. With no prior event history after Pigeon Drop unlock, Pigeon Drop is surfaced first so the player actually sees the new post-Mutation content beat.

## 3. Common Lifecycle

`available -> countdown -> active -> result -> reward claimed -> return`

During `active`:
- normal main-scene Feather tap production is paused;
- the event advances only from the authoritative ActiveGameplayClock;
- browser backgrounding and rewarded-ad pauses do not consume event time;
- the event exposes one dominant pointer/touch action;
- transient event state is not persisted as a resumable mid-run save.

Refreshing during an active event abandons the transient run and safely returns to the persisted main game state. No result transaction exists until a run completes.

## 4. Event 1 — Bread Rush

### Goal
Collect bread targets before the timer expires.

### Input
Tap/click bread targets.

### Timing
- countdown: 3 seconds;
- active duration: 30 seconds.

### Scoring
- normal bread: 1 point;
- golden bread: 4 points;
- missed taps do not remove currency or score.

### v0.2 tuning
- spawn interval: 0.9 s;
- target lifetime: 2.7 s;
- golden chance: 8%;
- expected reward-normalization score: 22;
- reward reference duration: 60 economy-seconds.

Bread Rush keeps its generated raster bread target art and inherits the current Growth/Mutation scene presentation.

## 5. Event 2 — Pigeon Drop

### Goal
Time a drop when the moving precision marker crosses the fixed aim lane.

### Input
- one large `DROP NOW` button;
- or pointer/touch on the Phaser play field.

### Timing
- countdown: 3 seconds;
- active duration: 30 seconds;
- visible drop travel: 0.48 s;
- post-impact reset: 0.62 s.

### Target motion
The precision marker moves continuously on normalized X and bounces between:
- minimum X: 0.18;
- maximum X: 0.82;
- speed: 0.29 normalized units/second.

### Authoritative click rule
The player is judged on the timing of the click, not on hidden prediction during the projectile animation.

When a drop is accepted:
1. the target marker locks at its current authoritative position;
2. the visible projectile travels for 0.48 s;
3. impact resolves against that locked position;
4. feedback is shown;
5. after impact, target motion resumes during the short reset window.

This is intentional. Earlier tuning allowed the target to keep moving during the visible drop travel, which made a visually centered click resolve as a miss. That feedback was false and is not part of the shipped rule.

### Accuracy bands
Distance is measured from normalized center X = 0.5:
- distance <= 0.045 -> **center / 5 points**;
- distance <= 0.10 -> **near / 2 points**;
- distance <= 0.16 -> **graze / 1 point**;
- otherwise -> **miss / 0 points**.

Expected reward-normalization score: 30.
Reward reference duration: 75 economy-seconds.

### Presentation and art policy
Pigeon Drop does **not** introduce a shape-generated production texture pack.

Production art:
- current generated Growth raster scene;
- current selected Mutation treatment.

Transient interaction VFX:
- moving bullseye marker;
- fixed aim guide;
- falling drop marker;
- impact rings/burst;
- score text and camera impulse.

Those transient elements are Phaser interaction/VFX primitives, not character/environment art and not files presented as production textures. The deleted `generate-pigeon-drop-assets.mjs` shape pipeline must not return.

There is no graphic bodily-fluid rendering. The event reads as stylized precision slapstick.

## 6. Reward Model

Every event uses the common event-economy pipeline.

### Reference income
Conceptually:

`expectedCritFactor = 1 + critChance * (critMultiplier - 1)`

`referenceTapIncome = tapPayout(referenceCombo, nonCrit) * referenceTapsPerSecond * expectedCritFactor`

`referenceIncome = max(1, referenceTapIncome + passiveRate)`

The reference snapshot is Mutation-aware and includes representative active tap output, expected crit contribution and passive income.

### Performance reward
`normalizedScore = min(normalizedScoreCap, score / expectedScore)`

`performanceMult = min(performanceMax, performanceBase + normalizedScore * performancePerNormalizedScore)`

`baseEventReward = referenceIncome * baseRewardSeconds * performanceMult`

`finalEventReward = baseEventReward * explicitEventModifiers`

Shared v0.2 tuning:
- performance base: 0.75;
- performance per normalized score: 1.25;
- performance max: 2.0;
- normalized score cap: 1.2;
- representative active taps/sec: 3;
- representative combo multiplier: 1.15.

### Reward transaction safety
At result:
1. base reward is applied through a unique transaction ID;
2. run count, best score and cooldowns are recorded;
3. state is persisted immediately;
4. only then may the optional rewarded `2x` be offered.

The rewarded action uses a separate transaction ID and can only add one additional copy of the already-calculated base reward.

A failed, unavailable or closed ad never removes the base reward.

## 7. Persistent Event State

Schema-v1 event progress contains:
- Bread Rush best score;
- Bread Rush run count;
- Bread Rush cooldown;
- Pigeon Drop best score;
- Pigeon Drop run count;
- Pigeon Drop cooldown;
- shared event cooldown;
- last completed event ID.

Old schema-v1 saves that only contain Bread Rush data sanitize missing Pigeon Drop/shared fields to safe zero/null defaults rather than being invalidated.

Cooldowns decrement only through active gameplay simulation, not wall-clock background time.

## 8. Edge Cases

- **Background/ad during event**: ActiveGameplayClock pauses, so event motion and timer pause.
- **Duplicate finish callback**: base reward ledger applies once; run/best/cooldown records once.
- **Duplicate rewarded callback**: reward ledger prevents a second bonus grant.
- **Rewarded ad unavailable/closed**: Continue remains available; base reward stays committed.
- **Mutation unresolved**: no event invitation may pre-empt the decision.
- **Both events ready**: deterministic alternation selects one invitation.
- **Malformed save event values**: negative/NaN values sanitize to safe non-negative defaults.
- **Invalid saved event ID**: sanitizes to null.
- **Orientation change**: Pigeon Drop gameplay remains normalized; presentation reflows from authoritative session state.
- **Rapid repeated Pigeon Drop input**: requests while a drop/reset is active are rejected.
- **Exact click feedback**: target is frozen during drop travel so the visible impact agrees with input timing.

## 9. Dependencies

Upstream:
- Game State / ActiveGameplayClock;
- Progression Economy;
- Growth visual content;
- Mutation modifiers;
- Save/reward ledger;
- Platform Monetization.

Presentation:
- Phaser event scenes;
- current generated Growth raster scenes;
- selected Mutation visual treatment;
- DOM HUD/result overlays;
- Bread Rush raster bread assets;
- transient Phaser VFX for Pigeon Drop precision feedback.

Downstream:
- Collection discoveries/achievements can consume best scores later;
- analytics can consume availability, participation, score and reward transactions without changing event rules.

## 10. Implementation Map

- `src/content/event-content.ts` — event definitions/tuning.
- `src/domain/event-economy.ts` — shared reward/reference pipeline.
- `src/domain/bread-rush.ts` — Bread Rush deterministic session.
- `src/domain/pigeon-drop.ts` — Pigeon Drop deterministic session and click-authoritative target lock.
- `src/events/event-availability.ts` — deterministic offer arbitration.
- `src/events/bread-rush-service.ts` — Bread Rush reward transaction orchestration.
- `src/events/pigeon-drop-service.ts` — Pigeon Drop reward transaction orchestration.
- `src/domain/game-store.ts` — event cooldown/best/run/shared state.
- `src/presentation/bread-rush-scene.ts` — Bread Rush runtime scene.
- `src/presentation/pigeon-drop-scene.ts` — Growth-aware Pigeon Drop scene and transient VFX.
- `src/ui/bread-rush-ui.ts` — Bread Rush offer/HUD/result.
- `src/ui/pigeon-drop-ui.ts` — Pigeon Drop offer/HUD/result.
- `src/main.ts` — shared event slot and ActiveGameplayClock routing.
- `tests/pigeon-drop.test.ts` — deterministic timing, scoring and transaction coverage.
- `tests/event-availability.test.ts` — event arbitration coverage.
- `tests/save-service.test.ts` — schema-v1 compatibility/sanitization.
- `tools/visual-qa/capture.mjs` — desktop/mobile live-event and result persistence QA.

## 11. Acceptance Criteria

- [x] Both initial events use one dominant pointer/touch interaction.
- [x] Typical event duration remains under 45 seconds.
- [x] Background/ad pause cannot consume event timer.
- [x] Main clicker production cannot double-run during an active event.
- [x] Event invitations cannot overlap another event or unresolved Mutation.
- [x] Shared cooldown/alternation prevents event clumping.
- [x] Rewards scale from the current economy and remain Mutation-aware.
- [x] Base reward is persisted before optional rewarded doubling.
- [x] Base and rewarded transactions are duplicate-safe.
- [x] Bread Rush remains regression-covered after adding the second event.
- [x] Pigeon Drop scoring is deterministic across renderer frame granularity.
- [x] Pigeon Drop click feedback is truthful: target freezes during visible travel.
- [x] Schema-v1 Bread Rush-only saves load with safe Pigeon Drop defaults.
- [x] Pigeon Drop has representative desktop and compact portrait browser QA.
- [x] Pigeon Drop no longer depends on shape-generated production texture files.

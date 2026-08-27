# Platform Adapter & Monetization

> **Status**: Designed v0.1
> **Last Updated**: 2026-08-27
> **Priority**: MVP Foundation/Feature
> **Implements Pillar**: Monetization Respects the Loop
> **Research**: `docs/architecture/platform-research.md`

## 1. Overview

This design separates portal-specific SDK behavior from game logic and defines how advertising monetizes the game without interrupting active tapping. A capability-based Platform Adapter normalizes Yandex Games, CrazyGames and generic-web environments. The Monetization service consumes that adapter and exposes game-domain transactions such as `double offline earnings` rather than raw SDK calls.

## 2. Player Fantasy

Ads should feel like optional acceleration or a natural commercial break, not an adversary. When the player chooses a rewarded offer, the exact reward is clear before playback and is granted reliably after successful completion. When the platform serves a fullscreen/midgame ad, it happens after the player has completed a meaningful beat and is not trying to tap or aim.

## 3. Detailed Rules

### 3.1 Platform capabilities

Adapter reports capabilities independently:
- rewarded ads;
- interstitial/midgame ads;
- sticky/banner control if applicable;
- cloud save;
- safe storage;
- player/auth/profile where useful;
- gameplay active/stopped lifecycle notification;
- platform language/environment metadata where useful.

Core game never assumes all capabilities exist.

### 3.2 Adapter implementations

**YandexPlatformAdapter**
- initializes Yandex SDK;
- wraps fullscreen/rewarded advertising;
- wraps Player cloud data and/or safe storage;
- maps game-start/gameplay lifecycle methods as required by current SDK.

**CrazyGamesPlatformAdapter**
- initializes CrazyGames SDK;
- wraps midgame/rewarded ads;
- maps lifecycle and optional data capabilities supported by integration scope.

**GenericWebPlatformAdapter**
- no third-party ads by default;
- local persistence only;
- ad requests return `unavailable` safely;
- enables normal local/browser development without fake portal globals.

### 3.3 Game lifecycle states

Minimum states relevant to ads:
- `booting`;
- `activeGameplay`;
- `resultBreak`;
- `growthCeremony`;
- `mutationDecision`;
- `externalAd`;
- `backgrounded`;
- `paused`.

When entering `externalAd`:
- pause progression clock for active mechanics;
- pause minigame countdowns;
- mute/suspend game audio as required;
- prevent tap transactions;
- preserve DOM/Phaser visual state.

On exit/error:
- restore prior valid game state once;
- do not duplicate resume callbacks.

### 3.4 Rewarded offers — MVP

#### Offline ×2
Trigger: return with meaningful baseline offline earnings.

Offer:
`Watch ad — double offline Feathers`

Rules:
- baseline claim is never withheld;
- successful rewarded completion grants exactly one additional baseline amount;
- decline/unavailable/error -> baseline only.

#### Event reward ×2
Trigger: event result screen after base reward is known.

Rules:
- base event reward is already secured;
- rewarded completion adds another base reward amount;
- no ad -> base remains.

#### Production boost
Optional after MVP core is stable:
- explicit `Watch ad — 2× production for 5 minutes` style offer;
- boost timing pauses during external ads/background states according to clock policy;
- do not stack infinitely; refresh/extend rule must be explicit.

Do **not** add a rewarded button solely to repair an intentionally frustrating economy wall.

### 3.5 Interstitial/midgame candidate breaks

Valid candidate moments:
- after selected Growth ceremonies, once the new stage has been shown and the player is at rest;
- after an event result is acknowledged and before returning to the main scene;
- after zone transition summary;
- after prestige summary.

Invalid moments:
- while tapping;
- on press-down before a purchase resolves;
- during a minigame timer/aiming action;
- immediately before showing a milestone the player earned;
- between rewarded completion and its promised reward;
- on every small upgrade.

### 3.6 First-session protection

Do not request a non-rewarded fullscreen/midgame ad before the player has experienced a reasonable amount of actual play and at least one meaningful progression payoff. Initial v0.1 target: no interstitial candidate before ~3 minutes **and** Growth Stage 2 completion, whichever is later.

After this onboarding guard, request at eligible natural breaks and allow the portal SDK's own frequency/availability policy to decide whether an impression is served.

### 3.7 Reward transaction protocol

Every rewarded request gets a unique `rewardTransactionId`.

States:
`created -> adRequested -> completed|failed|cancelled -> rewardApplied|closed`

Only `completed` may transition to `rewardApplied`.

Applying a reward checks whether the transaction ID has already been applied. Duplicate SDK callbacks are therefore harmless.

### 3.8 Sticky/banner behavior

Where supported:
- never cover central tap target, upgrade purchase controls, event target area or modal decision buttons;
- prefer menu/non-time-critical layouts;
- responsive safe-area tokens reserve space when a banner is visible;
- hide or reposition during layouts where portal policy/UX requires it.

### 3.9 Analytics

Track domain outcomes, not sensitive ad-network internals:
- offer shown;
- offer accepted;
- request unavailable/error;
- reward completed/applied;
- interstitial candidate requested;
- return-to-game after ad;
- progression stage around ad event.

## 4. Formulas

### Offline rewarded
`finalOfflineReward = baseOfflineReward * (rewardedCompleted ? 2 : 1)`

Implementation should grant base and bonus as separate idempotent transactions for auditability.

### Event rewarded
`finalEventReward = baseEventReward + (rewardedCompleted ? baseEventReward : 0)`

### Production boost candidate
`boostedProduction = baseProduction * 2` for configured active boost duration.

No ad formula changes branch upgrade costs.

## 5. Edge Cases

- SDK missing/not initialized: adapter returns unavailable; game continues.
- Ad unfilled: restore gameplay cleanly; no rewarded bonus.
- User closes/interrupts ad: use portal completion semantics; never infer success from elapsed time.
- Callback fires twice: reward transaction ID prevents duplicate grant.
- Browser backgrounded during ad: remain in external-ad safe state until adapter resolves lifecycle.
- Save occurs between ad completion and reward application: persist pending transaction state so resume can finish exactly once.
- Reward applied then save fails: retry save; transaction state in memory prevents immediate duplication and next durable checkpoint reconciles.
- Platform reports no banner capability: layout reclaims reserved banner area.
- CrazyGames Basic Launch / ads disabled: rewarded buttons must degrade correctly (hide/disable or give no false promise according to integration test environment).
- Yandex unauthenticated player: ad gameplay still functions; cloud capability may fall back locally.

## 6. Dependencies

Upstream:
- Game State / Clock;
- Save & Offline Time;
- Platform research/current SDK docs.

Reward integrations with:
- Progression Economy;
- Pigeon Events;
- future Prestige/boost systems.

Downstream:
- UI ad offer components;
- Analytics;
- Audio pause/resume.

## 7. Tuning Knobs

- first interstitial eligibility time;
- first interstitial minimum Growth Stage;
- which Growth stages are ad candidate breaks;
- rewarded offer availability rules;
- production boost multiplier/duration if enabled;
- minimum offline reward required to show ×2 offer;
- banner layout policy per viewport/platform;
- ad-related UX copy.

Portal SDK frequency caps are **not** duplicated as hardcoded game assumptions unless a portal specifically requires client-side enforcement. Current portal policy is rechecked before release.

## 8. Acceptance Criteria

- [ ] Gameplay/domain modules contain no direct Yandex/CrazyGames SDK calls.
- [ ] Generic web build boots and plays fully without any ad SDK.
- [ ] Rewarded ad success grants the advertised bonus exactly once.
- [ ] Rewarded error/unavailable grants no bonus and never removes baseline rewards.
- [ ] External ad pauses active combo/event timers and restores them safely.
- [ ] No interstitial candidate can occur during active tapping/minigame input.
- [ ] First-session guard prevents non-rewarded ad candidates before ~3 min and Growth Stage 2 in v0.1.
- [ ] Duplicate completion callbacks are covered by automated tests.
- [ ] Sticky/banner-safe layout never overlaps critical controls in supported viewport smoke tests.
- [ ] Platform adapter contract tests cover unavailable/error/success lifecycle paths.
- [ ] Official portal documentation is rechecked before submission and `platform-research.md` freshness date is updated.

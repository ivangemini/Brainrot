# Game State & Clock

> **Status**: Designed v0.1
> **Last Updated**: 2026-08-27
> **Priority**: MVP Foundation

## 1. Overview

This system owns lifecycle state and time semantics used by combo decay, minigame timers, temporary boosts, autosave, offline calculations and ad pause/resume. It prevents each feature from independently interpreting browser suspension, tab visibility or external-ad time.

## 2. Player Fantasy

Time-based systems should feel fair and predictable. A combo should not disappear because an ad opened, an event timer should not expire while the game is externally paused, and offline rewards should not double-count time already simulated in an active session.

## 3. Detailed Rules

### Lifecycle states
- `booting`
- `ready`
- `activeGameplay`
- `modalPause`
- `resultBreak`
- `growthCeremony`
- `mutationDecision`
- `externalAd`
- `backgrounded`
- `manualPaused`

State transitions are centralized and evented.

### Clock domains

**ActiveGameplayClock**
- advances only while active gameplay is allowed;
- drives combo decay and active timed mechanics.

**SessionClock**
- monotonic elapsed runtime excluding full application suspension where reliable;
- used for session analytics and pacing gates.

**WallClockProvider**
- abstracted current timestamp used for persistence/offline calculations;
- never directly scattered as `Date.now()` calls through gameplay.

**UIClock**
- can continue for harmless presentation animation while gameplay is paused, where appropriate.

### Pause tokens
Subsystems do not directly toggle a single global boolean. Game flow creates pause reasons/tokens so nested pauses cannot accidentally resume gameplay too early.

Examples:
- `external-ad`
- `mutation-modal`
- `page-hidden`
- `manual-pause`

Gameplay resumes only when no blocking token remains.

### Visibility/background
When document/app visibility changes:
- flush/schedule save;
- freeze active gameplay simulation;
- record wall timestamp;
- on foreground, reconcile elapsed time with offline/background policy before resuming.

Short background periods may be treated as offline only if the save/offline policy says so; do not run both background simulation and offline grant for the same interval.

### Fixed vs variable updates
Economy production may be calculated from elapsed deltas but should not depend on Phaser render FPS. Minigames choose deterministic/fixed logic where gameplay accuracy requires it.

## 4. Formulas

`activeDelta = blockingPauseTokens.empty ? realMonotonicDelta : 0`

`activeElapsed += activeDelta`

`sessionElapsed += eligibleSessionDelta`

Offline wall elapsed is calculated by Save & Offline Time from persisted timestamps; this system only provides the time abstraction and lifecycle boundaries.

Temporary boost remaining time:
- active-time boost: subtract `activeDelta`;
- real-time boost, if ever intentionally designed: subtract trusted wall elapsed by explicit definition.

MVP production boosts use active-time semantics unless specified otherwise.

## 5. Edge Cases

- Ad opens while mutation modal already pauses gameplay: ad token is added; closing ad removes only its own token.
- Browser hides without reliable callback: persisted `savedAt` still bounds offline calculation on next boot.
- Huge frame delta after tab resumes: active delta is clamped/ignored through state transition; do not simulate hours as one active frame.
- System clock changes: wall-clock anomaly is handled by Save/Offline policy.
- Rendering continues while modal open: UIClock may animate but economy/active mechanics do not advance.
- Error during ad callback: external-ad token must be released exactly once through a finally-style lifecycle path.

## 6. Dependencies

Upstream:
- browser monotonic timer and visibility APIs through infrastructure wrappers;
- Platform Adapter for external lifecycle events.

Downstream:
- Progression Economy combo and boosts;
- Pigeon Events timers;
- Save & Offline Time;
- Monetization;
- Analytics/session timing;
- Audio pause/resume.

## 7. Tuning Knobs

- maximum accepted active frame delta;
- threshold at which foreground reconciliation is treated as offline/background return;
- whether selected boosts use active vs wall time;
- modal animation timeouts;
- lifecycle debug logging level.

## 8. Acceptance Criteria

- [ ] Combo does not decay while an external ad blocks gameplay.
- [ ] Event countdown does not advance while blocked by external ad/background state.
- [ ] Nested pause reasons cannot resume gameplay until all blocking tokens are released.
- [ ] Returning after a long background does not simulate the entire absence as one render-frame delta.
- [ ] Gameplay logic does not call `Date.now()` directly outside the clock/persistence boundary.
- [ ] Active production is frame-rate independent in deterministic tests.
- [ ] Ad error paths release their pause token safely.
- [ ] Background/foreground path never grants both active simulation and offline earnings for the same interval.

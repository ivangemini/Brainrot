# VFX & Animation Feedback

> **Status**: Designed v0.1
> **Last Updated**: 2026-08-27
> **Priority**: MVP Presentation
> **Implements Pillars**: Tapping Must Feel Good; Every Upgrade Shows

## 1. Overview

This system translates authoritative gameplay events into responsive pigeon motion, particles, camera response, floating values and milestone ceremonies. It owns presentation intensity but never decides economy outcomes.

## 2. Player Fantasy

A one-Feather tap at the beginning should already feel crisp; hundreds of upgrades later, the same core action should feel substantially more powerful without becoming unreadable or physically uncomfortable. The pigeon should appear increasingly committed to the act of pecking reality apart.

## 3. Detailed Rules

### Tap feedback stack
For an ordinary credited tap:
1. immediate head/beak jab begins on input;
2. contact impact pulse/crumb/feather;
3. body squash/recoil;
4. floating payout appears/coalesces;
5. return/settle overlaps next tap when input is fast.

Target low-combo peck cycle: ~120–190 ms.

### Input responsiveness
Visual response begins immediately on accepted pointer-down/tap; economy result can resolve in the same action transaction. Do not wait for a long animation to finish before accepting the next valid tap.

### Combo feedback tiers
Presentation maps normalized combo state to discrete intensity bands:
- Calm: basic peck + tiny particles.
- Warm: faster motion, slightly stronger value treatment.
- Hot: wing involvement, stronger particles, subtle trail/aura.
- Frenzy: limited camera impulse, stronger sound layer, controlled foreground effects.
- Max: short high-energy treatment that remains sustainable, not constant full-screen noise.

Tier thresholds are presentation data and can differ from exact economic multiplier increments.

### Critical tap
Crit requires a distinctive one-frame/short burst language:
- larger payout typography;
- sharper impact particle;
- brief accent flash on pigeon/contact area;
- dedicated sound variant;
- optional micro camera impulse.

Do not full-screen white-flash every crit at high crit chance.

### Upgrade purchase
- card responds instantly;
- branch-related pigeon layer can pulse/highlight;
- minor level purchase uses small world cue;
- art milestone changes get a readable swap/reveal, not hidden inside the card.

### Growth ceremony
Sequence target:
1. input settles/brief anticipation (roughly 200–500 ms);
2. camera/world pause framing;
3. body tier/scale transition;
4. environment reaction/debris/NPC scale cue;
5. Growth title + unlock cue;
6. camera settles into new framing;
7. control returns.

Early ceremony target <3 seconds. Later exceptional stages may be longer but should not become repetitive cutscenes.

### Environment reactions
Use staged props/animation rather than expensive general physics:
- bend/swap bench state;
- debris sprite burst;
- NPC flee/phone reaction loops;
- car/traffic layer changes;
- helicopter/skyline elements at later scale.

### Floating values
Pool/reuse instances. At high tap rate, coalesce values spatially/temporally rather than rendering dozens of DOM/canvas labels simultaneously.

### Reduced motion
When enabled:
- remove/reduce camera shake;
- reduce squash/stretch amplitude;
- shorten Growth scale animation;
- reduce particles;
- keep state changes, text/icons and sounds where permitted so feedback remains understandable.

## 4. Formulas

### Presentation intensity
Use normalized combo value:
`comboNorm = (comboMultiplier - 1) / max(comboCap - 1, epsilon)`

Map into authored bands, e.g. thresholds 0.2/0.45/0.7/0.9.

### Camera impulse
Conceptually:
`impulse = min(maxImpulse, baseImpulse + comboNorm * comboContribution + critContribution)`

Reduced motion multiplies impulse by 0 or a small accessibility factor.

### Particle budget
`spawnCount = min(qualityCapRemaining, authoredCountForFeedbackTier)`

Economy payout is never derived from particle count/animation completion.

## 5. Edge Cases

- 10+ taps/sec: animations retarget/blend; do not queue seconds of stale peck animations.
- Low FPS: gameplay earnings remain correct; presentation can skip/coalesce frames/effects.
- Growth triggered while active tap animation running: settle/cancel transient tap motion before body swap.
- Crit during max combo: use combined authored cap, not additive unlimited shake/flash.
- Browser resize/orientation during ceremony: recompute camera target but do not replay reward/state transition.
- Asset missing: safe lower-tier visual + logged error; economy continues.
- External ad opens: stop/suspend active animation safely; resume to valid current state, not stale animation timeline.

## 6. Dependencies

Consumes:
- tap result events;
- combo state;
- crit result;
- upgrade milestone events;
- Growth Stage changes;
- mutation/collection reveal events;
- Art Bible/Visual Composition.

Coordinates with Audio and UI. No gameplay system depends on VFX completion except explicit flow choreography such as “ceremony finished” to return control; the underlying reward is already authoritative.

## 7. Tuning Knobs

- peck durations/easing;
- squash amplitudes;
- particle counts/lifetimes;
- combo visual band thresholds;
- crit impulse/flash strength;
- floating-value coalescing window;
- Growth ceremony duration/easing;
- camera impulse cap;
- quality-tier caps;
- reduced-motion factors.

## 8. Acceptance Criteria

- [ ] Visible tap response begins within the same interaction frame in normal conditions.
- [ ] Rapid tapping does not create an unbounded animation queue.
- [ ] Combo increase is visually perceptible at multiple intensity bands.
- [ ] Crit is distinguishable without relying only on color.
- [ ] Growth Stage transition visibly changes pigeon and environment/framing.
- [ ] Reduced-motion mode removes strong camera motion while preserving progression feedback.
- [ ] Low-quality mode caps particles/filters without hiding branch/Growth visual state.
- [ ] Presentation cannot change earned Feather amounts.
- [ ] Representative phone performance test sustains target framerate under intended max-combo effect density after optimization pass.

# Pigeon Events

> **Status**: Designed v0.1
> **Last Updated**: 2026-08-27
> **Priority**: MVP Feature
> **Initial content**: Bread Rush + Pigeon Drop

## 1. Overview

Pigeon Events are short 20–45 second arcade bursts that periodically interrupt the pure clicker rhythm with a simple skill challenge. They reuse the game's pigeon/world identity, produce meaningful but bounded rewards, and create clean result screens for optional rewarded doubling and occasional interstitial/midgame candidates.

Events are not a second full game mode. They must be understandable within seconds and return the player to the main progression loop quickly.

## 2. Player Fantasy

The player briefly uses their absurdly upgraded pigeon instead of only upgrading it. Events should feel like small consequences of being a city pigeon — grabbing food, dropping something on targets, escaping chaos — while providing a competence moment inside an otherwise progression-driven game.

## 3. Detailed Rules

### Event eligibility
- First event system introduction around Growth Stage / Total Level defined by progression tuning (~90 target in v0.1).
- After introduction, events become periodically available based on active play and cooldown/trigger data.
- Event invitation never interrupts a Growth ceremony, mutation choice, ad or another modal.
- Player may defer an event; it remains available for a bounded window or until next trigger policy.

### Common event lifecycle
`available -> intro -> countdown -> active -> result -> rewardClaimed -> return`

During `active`:
- normal main-scene Feather tap transactions are paused;
- event timer uses ActiveGameplayClock;
- external ad/background pauses timer;
- event has one primary input rule.

### Reward model
Every event has:
- guaranteed participation/completion reward unless abandoned under a clearly defined rule;
- score-performance multiplier with bounded min/max;
- optional rewarded ×2 on result after base reward is secured.

Event rewards must accelerate progression without making normal upgrades economically irrelevant.

### Event 1 — Bread Rush

#### Goal
Collect bread pieces appearing/moving across a compact play field before time expires.

#### Input
Tap/click bread targets. Pigeon snaps/leans toward the target with exaggerated peck/reach feedback.

#### Duration
Initial target: 30 seconds.

#### Scoring
- normal bread = 1 point;
- rare golden bread can appear at low frequency = bonus points, introduced only after basic interaction is clear;
- miss taps have no punitive currency loss.

Difficulty scaling may adjust spawn interval, movement and target lifetime by Growth Stage, but target size must remain touch-friendly.

### Event 2 — Pigeon Drop

#### Goal
Time a single-action drop while targets move below. Accuracy/target type creates score.

#### Input
One large tap button / tap field to drop; short reset/reposition between attempts.

#### Duration
Initial target: ~25–35 seconds, several attempts.

#### Scoring
- centered hit = highest score;
- near hit = smaller score;
- miss = no score for that attempt, quickly reset;
- no graphic gross-out detail required; use stylized comedic impact/VFX.

The joke is timing and world reaction, not explicit bodily-fluid rendering.

### Event frequency
Target after unlock: roughly one meaningful event opportunity every 5–10 minutes of active play initially, with anti-clumping rules. Exact cadence is tunable and should be tested against whether events refresh or annoy the clicker loop.

### Result screen
Shows:
- score;
- base Feathers reward;
- personal best if tracked;
- optional `Watch ad — 2× reward`;
- Continue.

Base reward is committed/claimable regardless of ad availability.

### Event progression
MVP events may have lightweight difficulty bands keyed to Growth Stage. Do not add separate permanent event upgrade trees before the main clicker economy is proven.

## 4. Formulas

### Event reward target
Reward is tied to current economic pace rather than a fixed Feather number that becomes meaningless.

Define:
`referenceIncome = smoothed/current production reference from economy snapshot at event start`

`baseEventReward = referenceIncome * rewardSeconds`

where `rewardSeconds` is a tuning parameter representing how many seconds of normal progression the event should be worth.

Initial target:
- completion floor approximately 30–60 seconds of ordinary production;
- strong performance approximately 90–150 seconds;
- ×2 rewarded doubles the already-calculated base result.

Example conceptual:
`performanceMult = clamp(0.75 + normalizedScore * 1.25, 0.75, 2.0)`

`eventReward = referenceIncome * baseRewardSeconds * performanceMult`

Exact normalized-score curves are defined per event.

### Bread Rush normalized score
Use score relative to designed expected band for current difficulty, clamped 0–1.2 before reward mapping so exceptional play has bounded upside.

### Pigeon Drop
Per attempt points map accuracy bands to deterministic score values; total normalized against expected attempts.

## 5. Edge Cases

- Browser backgrounds: timer pauses; event does not auto-fail in an ad/background state.
- Player reloads during active event: MVP may abandon event without reward and return safely to main state; never duplicate a pending result reward.
- Rewarded ad unavailable: Continue remains available and base reward is preserved.
- Event trigger occurs during Growth/mutation: queue availability, do not interrupt.
- Very large economy values: event reward calculation uses same large-number type/formatter rules as main economy.
- Low-end device: target spawn/VFX count reduces; gameplay target timing remains equivalent.
- Orientation change: field reflows; active targets preserve normalized positions or are regenerated fairly.
- Touch target overlaps sticky ad-safe area: layout bounds exclude reserved portal region.

## 6. Dependencies

Upstream:
- Game State / Clock;
- Progression Economy;
- Tuning Data;
- Save for best scores/pending reward safety;
- Platform Monetization for result rewarded ad.

Presentation:
- Phaser rendering;
- Main UI/result DOM overlay;
- VFX/Audio.

Downstream:
- Collection may use event achievements/discoveries;
- Analytics measures participation/score/reward/ad engagement.

## 7. Tuning Knobs

Common:
- unlock threshold;
- event cooldown/opportunity frequency;
- event duration;
- rewardSeconds;
- performance curve;
- maximum reward multiplier;
- intro countdown duration;
- difficulty band by Growth Stage.

Bread Rush:
- spawn interval;
- target lifetime/speed;
- target size;
- golden bread frequency/value.

Pigeon Drop:
- target speed;
- attempt reset time;
- accuracy band widths;
- score per band;
- target mix.

## 8. Acceptance Criteria

- [ ] Each initial event can be understood and played with one primary pointer/touch interaction.
- [ ] Typical event duration remains under 45 seconds.
- [ ] Background/ad pause cannot consume event timer.
- [ ] Base result reward is preserved when rewarded ad fails/is declined.
- [ ] Rewarded ×2 applies exactly once.
- [ ] Event rewards scale with economy snapshot and remain useful across multiple Growth Stages.
- [ ] Main clicker production does not continue double-running during an active event unless explicitly defined in future tuning.
- [ ] Portrait and landscape layouts keep all targets outside ad-safe regions.
- [ ] Event result is a valid natural-break state for platform ad policy; no ad is requested during the active timer.
- [ ] Both MVP events run with acceptable target visibility/touch sizes on representative phone viewport.

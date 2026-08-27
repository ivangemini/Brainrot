# Progression Economy

> **Status**: Designed v0.1 — values are simulation-backed targets, not final production balance
> **Last Updated**: 2026-08-27
> **Systems covered**: Feather Generation, Upgrade System, Growth/Giantification, Active Combo & Criticals, Passive/Automation
> **Implements Pillars**: Every Upgrade Shows; One More Growth Stage; Tapping Must Feel Good

## 1. Overview

This system owns the primary incremental loop: taps and automation create Feathers; Feathers buy levels across six upgrade branches; branch levels change production and unlock milestone visuals; the sum of all branch levels drives physical Growth Stages. The economic curve must provide frequent early purchases, increasingly meaningful milestones, and enough long-term headroom for multiple sessions without turning the first hour into a wall.

The values below are **Tuning Set v0.1**. They were chosen to target a first meaningful purchase within seconds and major Growth Stages at approximately sub-1 minute, ~2 minutes, ~5 minutes, ~12 minutes, ~25 minutes and ~55–60 minutes for an engaged player around four credited taps per second who purchases efficiently. Real runtime telemetry and deterministic simulations will retune them.

## 2. Player Fantasy

Every tap makes the pigeon stronger. Every purchase contributes not only to a number but to the physical absurdity of the pigeon. The player should feel that no upgrade is wasted because even a small branch level advances the master giantification meter toward a visible scene-changing payoff.

The intended emotional rhythm is:

`fast purchase -> several choices -> visible milestone -> brief slowdown -> large multiplier/growth payoff -> acceleration -> new branch -> repeat`

## 3. Detailed Rules

### 3.1 Primary currency — Feathers

- Start: `0 Feathers`.
- Base tap value: `1.0 Feather`.
- Currency is stored in a number representation capable of large incremental-game values; formatting is presentation-only.
- A credited tap creates Feathers after tap, combo, crit and global multipliers are calculated.
- UI animations may coalesce very fast taps, but authoritative earnings are computed by domain logic.

### 3.2 Upgrade branches

| Branch | Unlock at Total Level | Base Cost | Cost Growth | Primary effect | Visual ownership |
|---|---:|---:|---:|---|---|
| Beak | 0 | 15 | 1.18 | raw tap power | beak tier + peck impact |
| Body | 10 | 70 | 1.20 | global production | body silhouette/mass |
| Nest | 20 | 160 | 1.18 | passive production | nest/props/helpers |
| Wings | 30 | 400 | 1.19 | combo ceiling/retention | wing motion/tier |
| Swag | 45 | 950 | 1.20 | crit chance/multiplier | accessories/aura |
| Brain | 65 | 2500 | 1.20 | auto-taps/offline efficiency | tech/business/helpers |

Branches unlock one at a time in the opening so the player learns each system before seeing the full economy.

### 3.3 Upgrade purchase

A purchase succeeds only if:
- branch is unlocked;
- player has at least `nextCost` Feathers;
- branch is not at the current era's cap;
- game is not in a state that freezes progression transactions (save migration, mutation decision, ad overlay, etc.).

On success, atomically:
1. subtract cost;
2. increase branch level by 1;
3. recompute derived production state;
4. recompute Total Upgrade Level;
5. emit branch milestone events if crossed;
6. emit Growth Stage event if crossed;
7. persist dirty state on the normal save cadence.

### 3.4 Branch milestone levels

Initial long-curve milestone grammar:
- Lv 5 — minor visual cue / preview tier;
- Lv 10 — first major mechanical + visual milestone;
- Lv 25 — second major tier;
- Lv 50 — third major tier;
- Lv 75 — late-run tier;
- Lv 100 — era mastery tier.

Not every branch needs identical multiplier values, but milestone *rhythm* stays consistent so players learn to anticipate 10/25/50/75/100.

### 3.5 Beak

Raw tap component:

`rawTap = 1 + 0.20 * BeakLevel`

Beak milestone multiplier:

| Level reached | Permanent multiplicative factor |
|---:|---:|
| 10 | ×1.50 |
| 25 | ×1.60 |
| 50 | ×1.75 |
| 75 | ×1.80 |
| 100 | ×2.00 |

Factors stack multiplicatively.

The first Beak level therefore changes a 1.0 base tap to 1.2 before other multipliers, matching the intended opening feel.

### 3.6 Body

Base global multiplier:

`bodyBaseMult = 1 + 0.04 * BodyLevel`

Milestone factors:

| Level | Factor |
|---:|---:|
| 10 | ×1.30 |
| 25 | ×1.45 |
| 50 | ×1.60 |
| 75 | ×1.75 |
| 100 | ×1.90 |

Body applies to active and passive production unless a future specific source is explicitly exempted.

### 3.7 Wings / combo

The combo system rewards sustained active tapping without requiring rhythm-game precision.

State:
- `comboCharge` begins at 0.
- A credited tap while the game is active adds charge.
- After a short inactivity grace window, charge decays continuously.
- Wings increases achievable multiplier and makes the combo easier to maintain.

Initial tuning intent:

`comboCap = 1 + min(1.50, 0.03 * WingsLevel)`

So Wings can eventually add up to roughly ×2.5 active combo contribution before later progression tiers modify the rule.

Runtime formula should use normalized charge rather than directly counting every tap so frame/input burst behavior cannot explode the multiplier.

Suggested v0.1 feel targets:
- inactivity grace: ~0.75 s;
- full decay from ordinary mid-combo: ~2–3 s;
- high Wings levels extend retention modestly;
- combo stops progressing while gameplay is externally paused/ad-blocked.

### 3.8 Swag / critical taps

`critChance = min(0.25, 0.02 + 0.003 * SwagLevel)`

`critMultiplier = 3.0 + 0.04 * SwagLevel`

A critical tap multiplies the final active tap payout for that tap. Crit feedback must be visually stronger but cannot hide affordability/growth UI.

Crit RNG uses a testable RNG interface. Production balance tests may seed it; saved progress does not need to preserve RNG history for ordinary taps.

### 3.9 Nest / passive production

Baseline passive source:

`nestBasePerSecond = 0.30 * NestLevel`

Nest milestone factors:

| Level | Factor |
|---:|---:|
| 10 | ×1.50 |
| 25 | ×1.60 |
| 50 | ×1.80 |
| 75 | ×2.00 |
| 100 | ×2.20 |

Nest visually adds/expands nest assets, food piles and helper activity.

### 3.10 Brain / automation

Brain creates auto-taps whose value derives from current tap power rather than a separate duplicate economy.

`autoTapsPerSecond = 0.12 * BrainLevel * brainMilestoneMult`

Initial Brain milestone factors:
- Lv10 ×1.50;
- Lv25 ×1.70;
- Lv50 ×2.00;
- Lv75 ×2.10;
- Lv100 ×2.25.

Automation is simulated economically; it does not need to spawn one visual peck event for every virtual auto-tap. Presentation uses capped helper animations.

### 3.11 Total Upgrade Level

`TotalUpgradeLevel = Beak + Body + Nest + Wings + Swag + Brain`

It never decreases during a normal run. Prestige is the only planned system allowed to reset normal branch levels.

### 3.12 Growth Stages — Era 1

Provisional thresholds:

| Stage | Total Level | Target active timing | Presentation meaning |
|---:|---:|---|---|
| 0 | 0 | start | normal pigeon on bench |
| 1 | 10 | ~0.7–1 min | chubby; bench begins reacting; Body unlocks |
| 2 | 25 | ~2 min | clearly larger; human props begin feeling small |
| 3 | 50 | ~5 min | big pigeon; stronger scene reframe; Swag vicinity |
| 4 | 90 | ~10–13 min | huge/human-scale absurdity |
| 5 | 150 | ~22–28 min | car-scale transition |
| 6 | 240 | ~50–65 min | building-scale setup / major environment swap |
| 7 | 360 | multi-session (~3 h active target) | mega-city scale |
| 8 | 420 | multi-session (~6 h active target) | first-run late-game / prestige approach |

These times are **targets from an idealized active simulation**, not guarantees. Idle-heavy players take longer in real time but gain offline progress.

Growth thresholds intentionally widen while the visual reward increases.

### 3.13 Growth unlocks

Provisional mechanic unlock mapping:
- Total 10: Body branch + first Growth ceremony.
- Total 20: Nest branch/passive income.
- Total 30: Wings/combo branch.
- Total 45: Swag/crit branch.
- Total 65: Brain/automation branch.
- Total ~90: first Pigeon Event introduced if onboarding conditions are met.
- Total ~150: first Mutation choice becomes eligible.
- Total 240+: next world-scale presentation context.
- Total 360+: prestige tutorial may begin foreshadowing.

Unlocks may use a short delay/queue so multiple milestones from one bulk purchase do not stack modal screens on top of each other.

### 3.14 Offline earnings

Only passive/automation production counts toward baseline offline earnings. Active combo/crit behavior does not simulate while away.

Initial rule:

`offlineDuration = clamp(realElapsed, 0, offlineCap)`

`offlineEfficiency = min(0.85, 0.50 + BrainLevel * 0.005)`

`offlineEarnings = passiveRateAtSave * offlineDuration * offlineEfficiency`

Initial `offlineCap`: 8 hours.

Rewarded option may multiply the calculated offline reward by ×2 after successful ad completion. Declining/failing the ad grants the baseline reward immediately/cleanly.

### 3.15 Bulk purchase

MVP supports:
- `Buy 1` always;
- `Buy Max` may be added once individual purchase feedback is stable.

Bulk purchase must process milestone/growth crossings deterministically and must not skip unlock rewards or duplicate modal ceremonies.

## 4. Formulas

### Upgrade cost

For branch `b` with current level `L`:

`nextCost(b,L) = ceil(baseCost[b] * growthRate[b]^L)`

The current level is zero before the first purchase.

Examples for Beak:
- L0 -> 15;
- L1 -> ~18;
- L2 -> ~21;
- L3 -> ~25;
- L9 -> ~67 before milestone payoff effects influence affordability.

### Active tap payout

Conceptual v0.1:

`tapPayout = rawTap * beakMilestoneMult * bodyMultiplier * comboMultiplier * critFactor * temporaryBoosts`

where `critFactor` is either 1 or `critMultiplier` for a specific tap.

### Passive rate

`passivePerSecond = bodyMultiplier * (nestProduction + autoTapsPerSecond * baseTapWithoutComboCrit) * passiveBoosts`

Automation does **not** inherit active combo or per-tap crit rolls unless a future explicit upgrade says so. This prevents passive scaling from accidentally double-dipping every active mechanic.

### Affordability

`canBuy = feathers >= nextCost && unlocked && level < eraCap`

### Growth

`growthStage = highest stage where TotalUpgradeLevel >= stage.threshold`

Growth size used by rendering is data attached to the stage definition; domain logic stores the stage ID, not a raw visual scale formula.

## 5. Edge Cases

- Multiple purchases in one frame: serialize transactions or process through one authoritative store action queue.
- Crossing several branch milestones at once: emit every mechanical unlock once, but presentation may consolidate reveals.
- Crossing Growth + branch + mutation threshold simultaneously: priority queue = growth ceremony -> new branch/system tutorial -> mutation offer.
- Insufficient Feathers after a stale UI price: transaction rejects; UI refreshes from authoritative state.
- Floating-point visual artifacts: format values separately; affordability calculations use authoritative numeric state.
- Tab backgrounding: active combo stops/decays according to Game Clock policy; do not grant active tap income while browser is suspended.
- Device clock moved backward/forward: offline system clamps and validates elapsed time; suspicious jumps never create negative earnings.
- Rewarded ad interrupted: no multiplier reward until confirmed completion.
- Save loaded from older tuning version: saved levels remain; costs/effects derive from current compatible content version unless a migration explicitly snapshots old values.
- Pigeon at branch cap: branch card shows mastery; purchasing disabled until prestige/era extension.
- Very fast/autoclick input: credited input rate may be capped/coalesced by a tunable abuse/performance ceiling (initial engineering ceiling target 12 credited taps/sec), without blocking normal human play.

## 6. Dependencies

Upstream:
- Tuning & Content Data — owns all branch/stage definitions.
- Game State / Clock — supplies pause-safe delta and offline timestamps.
- Save — persists currency, branch levels and growth/meta state.

Downstream:
- Pigeon Visual Composition consumes branch milestones and Growth Stage.
- Main HUD consumes costs, affordability, rates and next thresholds.
- Monetization consumes well-defined reward transaction endpoints; it does not edit formulas.
- Analytics records purchase timing and milestone timing.
- Events and Mutations grant/apply rewards through economy APIs.

## 7. Tuning Knobs

Central config only:
- branch unlock thresholds;
- branch base costs;
- cost growth rates;
- per-level effects;
- milestone levels/factors;
- growth thresholds;
- growth stage unlock payloads;
- combo grace/decay/cap;
- crit base/chance-per-level/cap/multiplier;
- nest passive rate;
- brain auto-tap rate;
- offline cap/efficiency;
- temporary boost durations/multipliers;
- credited tap performance ceiling;
- first-run/tutorial pacing overrides if telemetry proves necessary.

### Pacing guardrails

For the first active hour, target roughly:
- first purchase: 3–8 seconds;
- first major milestone: <60 seconds;
- branch unlocks: frequent in first ~7 minutes;
- visual/progression event: at least every ~1–3 minutes early;
- large Growth payoff: roughly 5–15 minutes apart after onboarding;
- no mandatory wait wall >90 seconds during the first 10 minutes for a normally active player unless an event/choice is available meanwhile.

## 8. Acceptance Criteria

- [ ] Starting from zero, first Beak purchase costs 15 Feathers and changes raw tap from 1.0 to 1.2.
- [ ] Cost calculation is deterministic and covered by unit tests for at least levels 0, 1, 10, 25, 50 and 100 per branch.
- [ ] All six branch definitions live in content/config data rather than scene/UI code.
- [ ] Total Upgrade Level always equals the exact sum of current branch levels.
- [ ] Each Growth threshold fires once per run and persists correctly through save/load.
- [ ] Growth Stage 1 is reached at Total Level 10 and triggers its visual/unlock event.
- [ ] Combo pauses safely during external ad/browser pause state.
- [ ] Offline earnings never include active combo/crit simulation.
- [ ] Rewarded offline ×2 cannot be granted twice from duplicate callbacks.
- [ ] A deterministic balance simulation can run at least 90 minutes of modeled progression and report milestone times.
- [ ] Baseline v0.1 simulation at ~4 active taps/sec lands Growth 1/2/3/4/5/6 approximately near 1/2/5/12/25/60 minutes, within intentionally broad tuning tolerance.
- [ ] Runtime telemetry can report time-to-first-purchase, time-to-branch-unlock and time-to-growth-stage without changing the economy.

## Open Tuning Questions

Not blockers for architecture:
- exact prestige threshold and first prestige permanent bonus;
- whether branch era cap begins at 100 or selected branches extend earlier;
- final Buy Max unlock timing;
- final offline cap after telemetry;
- whether later mutations alter cost curves or only production multipliers.

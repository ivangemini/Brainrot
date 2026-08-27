# Analytics

> **Status**: Designed v0.1
> **Last Updated**: 2026-08-27
> **Priority**: MVP Polish/Instrumentation

## 1. Overview

Analytics measures whether the clicker economy, visual milestones, events and advertising are helping or harming retention. Instrumentation is event-based, portal-agnostic and non-blocking: gameplay never depends on analytics delivery succeeding.

## 2. Player Fantasy

Analytics has no direct fantasy, but its design protects the experience by enabling evidence-based tuning instead of making the economy slower or more ad-heavy by guesswork.

## 3. Detailed Rules

### Event principles
- stable event names;
- compact numeric/string properties;
- no raw save payloads;
- no unnecessary personal data;
- analytics transport failure never blocks gameplay;
- development console/debug sink available without production provider.

### Core progression events

#### `session:start`
Properties:
- platform adapter ID;
- save schema/balance version;
- returning/new player flag;
- current Growth Stage;
- Total Upgrade Level;
- prestige tier later.

#### `upgrade:purchased`
Properties:
- branch ID;
- new level;
- total level;
- cost;
- seconds since session start;
- current Growth Stage;
- balance version.

High-volume consideration: individual purchases may be sampled/aggregated after telemetry volume is understood; milestone purchases are never omitted from design metrics.

#### `branch:unlocked`
- branch ID;
- total level;
- lifetime/session elapsed.

#### `milestone:reached`
- branch ID;
- milestone level;
- total level;
- elapsed.

#### `growth:reached`
- stage ID;
- total level;
- session/lifetime active elapsed;
- mutation ID if any.

#### `mutation:selected`
- mutation ID;
- total level;
- elapsed.

### Economy snapshots
Periodic/transition snapshots, not every frame:
- Feathers balance;
- tap value;
- passive/sec;
- branch levels;
- current cost-to-income ratio for next recommended/cheapest upgrades where analysis needs it.

### Event analytics
- `pigeon-event:offered`
- `pigeon-event:started`
- `pigeon-event:completed`
- `pigeon-event:abandoned`

Properties:
- event ID;
- score/normalized score;
- base reward;
- duration;
- Growth Stage;
- reward doubled yes/no.

### Ad analytics
Domain events:
- `ad-offer:shown` (rewarded offers);
- `ad-offer:accepted`;
- `ad-request:result` (`completed`, `unavailable`, `error`, `cancelled` as adapter supports);
- `ad-reward:applied`;
- `interstitial:candidate`;
- `interstitial:result`.

Do not attempt to replace portal/network revenue reporting with guessed revenue client-side.

### Save/offline analytics
- offline return duration bucket;
- baseline offline reward;
- rewarded doubling accepted/completed;
- cloud/local conflict occurrence;
- migration error/success.

### Funnel metrics to derive

#### First 10 minutes
- time to first tap;
- time to first purchase;
- time to Beak Lv10;
- time to Growth 1/2/3;
- branch unlock timing;
- percentage reaching first event eligibility;
- early exit stage.

#### First hour
- Growth Stage distribution;
- branch level mix;
- event participation/completion;
- mutation reach rate;
- rewarded acceptance rate by offer type;
- interstitial candidate return/drop behavior.

#### Retention-support metrics
Where portal analytics/user IDs allow compliant cohorting:
- D1/D7 return rate;
- average session length;
- sessions per returning player;
- growth/collection milestones preceding return.

### Development telemetry overlay
Optional dev-only display can show:
- current income/tap/passive;
- time to afford next upgrade;
- total level;
- active config/balance version;
- active pause tokens;
- platform capability status.

Never ship it exposed in production.

## 4. Formulas

### Time to afford
Diagnostic:
`ttaSeconds = max(0, nextCost - currentFeathers) / max(currentIncomePerSecond, epsilon)`

For active economy analysis, model income using measured active taps/sec; for runtime display, do not pretend passive/sec includes future human taps.

### Conversion rates
`conversion = completedTarget / eligiblePopulation`

Examples:
- event start rate = event starts / event offers;
- rewarded completion rate = rewarded completions / accepted offers;
- Growth 3 reach rate = players reaching Growth 3 / eligible new sessions.

### Drop-off around ads
Compare continuation/next-action rate after ad candidate/result against equivalent natural-break cohorts where analytically possible. Do not infer causality from one metric alone.

## 5. Edge Cases

- Analytics provider absent: no-op sink.
- Offline/no network: bounded queue or drop according to provider strategy; never grow storage without limit.
- Duplicate reward callback: domain reward remains idempotent; analytics may deduplicate using transaction ID/event ID where necessary.
- Player resets/prestiges: session events include run/meta context so progression timing remains interpretable.
- Balance version changes: every progression metric includes balance version so incompatible curves are not mixed blindly.
- High-frequency tap events: do **not** emit network analytics per tap. Aggregate taps/sec/count into periodic/session summaries.
- Sensitive portal profile fields: do not collect merely because SDK exposes them.

## 6. Dependencies

Consumes events from:
- Progression Economy;
- Growth;
- Mutation;
- Pigeon Events;
- Platform Monetization;
- Save/Offline;
- Game State/Clock.

Analytics has no gameplay dependents.

## 7. Tuning Knobs

- snapshot interval/transition rules;
- development logging verbosity;
- bounded offline queue size;
- optional sampling rate for high-volume upgrade purchases after early testing;
- cohort/bucket thresholds.

Core milestone, growth, mutation, ad transaction and error events should not be sampled away during pre-release testing.

## 8. Acceptance Criteria

- [ ] Analytics provider can be completely absent without affecting gameplay.
- [ ] No network event is sent per individual tap.
- [ ] First-purchase and Growth 1–6 timing can be reconstructed from telemetry.
- [ ] Every progression event includes balance version.
- [ ] Rewarded funnel can distinguish offer shown, accepted, ad result and reward applied.
- [ ] Duplicate reward callbacks cannot cause duplicate gameplay reward even if analytics receives duplicate raw SDK signals.
- [ ] Event participation funnel can distinguish offered/start/complete/abandon.
- [ ] Save migration/cloud conflict errors have diagnostics.
- [ ] Production analytics payloads do not include raw save files or unnecessary personal profile data.
- [ ] Dev telemetry can expose tuning/debug state without becoming a production player-facing UI.

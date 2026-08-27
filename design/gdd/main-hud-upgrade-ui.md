# Main HUD & Upgrade UI

> **Status**: Designed v0.1
> **Last Updated**: 2026-08-27
> **Priority**: MVP Presentation
> **Implements Pillars**: Every Upgrade Shows; One More Growth Stage; Tapping Must Feel Good; Monetization Respects the Loop

## 1. Overview

The main screen combines a Phaser-rendered pigeon/world with a responsive DOM UI for currency, growth progress, combo feedback and upgrade purchasing. The interface must make the pigeon the visual focal point while still allowing frequent upgrade decisions with minimal navigation friction on both portrait mobile and desktop browser layouts.

## 2. Player Fantasy

The player should feel that they are directly poking/prodding a living progression machine, not operating a spreadsheet. The next meaningful transformation is always visible, and buying an upgrade immediately shows both the numeric gain and what it contributes toward visually.

## 3. Detailed Rules

### Main hierarchy
1. Pigeon/world tap target.
2. Feather total + current production summary.
3. Growth meter: `Total Level / Next Growth`.
4. Combo/crit state while active.
5. Upgrade controls.
6. Secondary navigation: collection/events/settings/etc.
7. Optional rewarded offers only when contextually relevant.

### Tap target
- Main pigeon hit region is generous and follows the visual body bounds with padding.
- DOM UI never intercepts taps intended for visible exposed pigeon space.
- Tap feedback spawns near contact point but value text is constrained so it cannot cover core HUD continuously.

### Feather display
Show:
- current Feathers;
- optional `+X/s` passive indicator;
- active tap value available in detail/upgrade panel rather than permanently cluttering top HUD.

Large-number formatter is shared across UI; no scientific notation in early/mid game unless values exceed supported suffix table.

### Growth meter
Persistent compact element:
- current Growth Stage name/icon;
- `TotalUpgradeLevel / nextThreshold`;
- progress bar;
- preview phrase/icon for next physical change/unlock.

When within a configurable proximity (e.g. final 10–15%), meter gains stronger anticipation treatment without flashing.

### Upgrade panel
Six branch cards unlock progressively. Locked future branches may appear as teasing silhouettes only shortly before unlock; do not show all six locked cards from second zero.

Card fields:
- icon + branch name;
- level;
- main current effect;
- next-level delta;
- price;
- affordability state;
- next milestone (`Lv 10 — New Beak + ×1.5`) and distance to it;
- optional branch-specific small art preview.

Purchase interactions:
- tap/click card/button = Buy 1;
- press feedback occurs immediately but transaction result is authoritative;
- insufficient funds creates restrained rejection motion/sound, not an intrusive modal;
- successful purchase animates level/value delta and, if relevant, cues the world visual change.

### Milestone reveals
Minor branch visual milestone: inline banner/toast + world change, no full modal.

Major branch milestone: short 0.5–1.5 s reveal that does not require extra confirmation unless it unlocks a choice/system.

Growth Stage: full ceremony handled by world presentation, then returns to main UI.

### Navigation
Main MVP secondary entries:
- Events (when available);
- Collection (when unlocked);
- Settings;
- Prestige later;
- debug only in development builds.

Avoid five permanent bottom tabs if most screens are locked/empty. Navigation can expand with progression.

### Rewarded offer placement
- offline ×2 appears only on return result card;
- event ×2 appears only on event result;
- production boost, if enabled, sits in a secondary boost slot and clearly includes ad icon/text;
- no rewarded button adjacent enough to Buy button to cause accidental ad requests.

### Responsive layout

#### Portrait mobile
- world/pigeon: upper ~55–65% of viewport;
- top compact currency/growth HUD respects safe areas;
- upgrade content: bottom sheet occupying lower area, scrollable within its region;
- sheet can collapse to expose more pigeon without hiding Growth meter.

#### Landscape mobile / compact desktop
- world centered/left;
- upgrade rail on right when width allows;
- currency/growth remains top.

#### Desktop
- world takes majority visual area;
- right-side upgrade rail/panel;
- larger whitespace is used for the pigeon/environment, not oversized flat panels.

### Accessibility
- minimum comfortable touch target ~44 CSS px;
- no information solely on hover;
- affordability and rarity use icon/text in addition to color;
- reduced motion option;
- text scaling must not clip prices/milestones;
- buttons have semantic accessible labels in DOM.

## 4. Formulas

Growth bar:

`progress = (totalLevel - currentStageThreshold) / (nextStageThreshold - currentStageThreshold)`

Clamp 0–1 for display.

Milestone distance:
`levelsRemaining = nextMilestoneLevel - branchLevel`

Affordability:
`affordable = feathers >= nextCost` from authoritative store, never recomputed using stale UI approximations.

Compact number formatting is deterministic presentation mapping only and never feeds calculations.

## 5. Edge Cases

- Purchase causes Growth Stage and branch milestone: purchase feedback -> milestone visual can merge -> Growth ceremony takes priority; UI restores with new branch/system unlocked.
- Price changes after load/balance version: UI subscribes to current canonical state and refreshes.
- Device rotates during growth ceremony: responsive layout recomputes but domain ceremony state is not restarted.
- Sticky banner appears/disappears: safe-area layout token updates; controls never move under banner.
- Offline result shown at boot: baseline claim flow resolves before main tap input becomes authoritative if needed to prevent double claims.
- Very long localized branch name: use localization-approved short label; no font shrinking below readability floor.
- Player taps pigeon through an open bottom sheet: sheet region consumes input; exposed world region remains tappable.
- Rapid Buy taps: domain transaction queue prevents overdraft/duplicate level increments.

## 6. Dependencies

Upstream:
- Progression Economy;
- Pigeon Visual Composition;
- Growth;
- Game State;
- Monetization offer state;
- Art Bible.

Downstream:
- onboarding/tutorial overlays;
- analytics interaction events;
- accessibility/localization.

The UI never owns authoritative progression state.

## 7. Tuning Knobs

- portrait world/sheet height split;
- growth anticipation threshold;
- milestone reveal duration;
- floating number density/cooldown;
- insufficient-funds feedback intensity;
- bottom-sheet collapsed/expanded heights;
- upgrade sort/order (fixed by branch progression for MVP);
- whether passive rate is shown persistently;
- compact suffix rules.

## 8. Acceptance Criteria

- [ ] New player can identify how to earn Feathers and buy first upgrade without tutorial text longer than one short prompt.
- [ ] Next Growth threshold is visible from main screen after first purchase.
- [ ] Every unlocked branch card shows level, effect, next delta, price and next milestone.
- [ ] Buying an affordable upgrade requires one deliberate tap/click and produces immediate feedback.
- [ ] UI cannot overdraft currency under rapid repeated input.
- [ ] Portrait phone, compact landscape and 1440×900 desktop layouts keep pigeon, Growth meter and upgrade purchase controls simultaneously usable.
- [ ] Critical controls remain outside active sticky-banner safe regions.
- [ ] No rewarded ad can be triggered by tapping the normal upgrade purchase area.
- [ ] Reduced-motion mode still communicates purchase/milestone/Growth changes.
- [ ] UI uses authoritative store state and contains no duplicate economy formulas.

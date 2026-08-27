# Mutation Choices

> **Status**: Designed v0.1
> **Last Updated**: 2026-08-27
> **Priority**: MVP Feature
> **First eligibility target**: Total Upgrade Level ~150 / Growth Stage 5

## 1. Overview

Mutations are infrequent build-defining choices that add strategic identity to the incremental economy and produce a major visual transformation. They are not a dense RPG skill tree. The MVP contains one first-run mutation choice between three readable archetypes: Muscle, Business and Chaos.

## 2. Player Fantasy

The player has grown a ridiculous pigeon far enough that it now evolves according to *how they want to play*. The choice should feel like claiming an identity for the current run, immediately change the pigeon visually, and noticeably favor active tapping, idle/automation, or crit/event play without making the other play styles unusable.

## 3. Detailed Rules

### First mutation trigger
Default v0.1 eligibility:
- Total Upgrade Level >= 150;
- required Growth Stage reached;
- no unresolved higher-priority Growth ceremony;
- mutation not already selected for this run.

The offer appears after the Growth ceremony settles, not stacked on top of it.

### Choice presentation
Three cards display simultaneously when viewport allows, otherwise swipe/stack without hiding comparison information.

Each card must show:
- mutation name;
- dominant visual silhouette/art preview;
- exact mechanical modifiers;
- plain-language playstyle description;
- whether selection lasts until prestige.

No hidden random roll is involved.

### Mutation A — Muscle Pigeon
Identity: active/tap power.

Initial v0.1 modifiers:
- `activeTapMultiplier ×1.35`;
- `comboCap +0.15` additive to multiplier ceiling;
- passive systems continue normally but do not receive the ×1.35 active factor.

Visual direction:
- broader chest/body overlay;
- stronger stance/legs;
- more forceful peck recoil;
- restrained gym/strength cue, not a copied internet character.

### Mutation B — Business Pigeon
Identity: passive/automation/offline.

Initial v0.1 modifiers:
- `passiveProduction ×1.35`;
- offline efficiency `+0.10` absolute, still respecting global cap policy;
- helper/business visual tier unlocked.

Visual direction:
- formal/business accessory set;
- phone/laptop/briefcase-like helper props where readable;
- helpers appear organized/industrial rather than muscular.

### Mutation C — Chaos Pigeon
Identity: crits/events/variance.

Initial v0.1 modifiers:
- crit chance `+0.05` absolute after normal crit calculation, respecting hard max;
- crit multiplier `×1.15`;
- Pigeon Event base reward `×1.15`.

Visual direction:
- asymmetrical/stranger accessories or aura;
- stronger iridescent/unstable effects;
- still compatible with base art bible and mobile readability.

### Persistence
Mutation selection is stored as a stable mutation ID.

MVP mutation lasts for the current run until prestige/reset semantics are introduced. Normal save/load cannot reroll it.

### No trap choices
Each mutation should produce a similar order-of-magnitude advantage for its intended playstyle. Telemetry compares progression speed by mutation. A visually appealing choice must not secretly be dramatically worse.

### Future mutations
Later Growth/prestige tiers may add a second mutation layer or evolve the chosen branch, but MVP architecture should support an ordered list of mutation IDs/modifiers rather than a single hardcoded boolean.

## 4. Formulas

### Muscle
`finalActiveTap = normalActiveTap * 1.35`

`finalComboCap = normalComboCap + 0.15`

### Business
`finalPassiveRate = normalPassiveRate * 1.35`

`finalOfflineEfficiency = min(offlineHardCap, normalOfflineEfficiency + 0.10)`

### Chaos
`finalCritChance = min(critHardCap, normalCritChance + 0.05)`

`finalCritMultiplier = normalCritMultiplier * 1.15`

`finalEventReward = normalEventReward * 1.15`

Mutation factors are modifier entries applied by the economy modifier pipeline; they do not rewrite canonical branch definitions.

## 5. Edge Cases

- Threshold crossed via bulk purchase: Growth ceremony resolves first, mutation decision queues next.
- Browser closes on mutation screen before choice: state remains `eligible/unselected`; reopen returns to safe decision state after save load.
- Selection callback repeated: idempotent; same selection does not stack modifier twice.
- Player has no ads/network: mutation remains fully available; never monetized as a required choice.
- Reduced motion: mutation reveal shortens animation but shows full visual preview/result.
- Later balance update changes modifiers: stable mutation ID remains; current balance-version modifier definition applies unless migration policy explicitly snapshots it.
- Crit hard cap with Chaos: excess bonus is not silently converted to another stat in MVP; UI can show capped value clearly.

## 6. Dependencies

Upstream:
- Progression Economy / Growth eligibility;
- Tuning Data;
- Save;
- Pigeon Visual Composition;
- Game State modal pause.

Downstream:
- economy modifier pipeline;
- event rewards;
- collection discovery;
- analytics;
- future prestige.

## 7. Tuning Knobs

- first mutation threshold;
- active/passive/crit/event modifier values;
- combo cap bonus;
- offline efficiency bonus/cap;
- mutation art mapping;
- reveal duration;
- whether future tiers permit respec at prestige.

Balance target: no mutation should exceed another's modeled progression speed by >~15% under its intended comparable playstyle without a deliberate design reason.

## 8. Acceptance Criteria

- [ ] Mutation offer becomes eligible at configured threshold and cannot appear before Growth ceremony settles.
- [ ] All three cards show exact modifiers before selection.
- [ ] Selection is persisted by stable ID and cannot be rerolled by refresh.
- [ ] Selecting the same mutation twice cannot stack modifiers.
- [ ] Muscle affects active production without unintentionally multiplying passive automation.
- [ ] Business affects passive/offline without changing base upgrade prices.
- [ ] Chaos respects crit hard cap and modifies event reward deterministically.
- [ ] Each mutation has a visibly distinct runtime treatment compatible with simultaneous branch milestone layers.
- [ ] Mutation choice requires no ad/payment.
- [ ] Balance simulator can compare representative active/passive/event-heavy profiles across the three mutations.

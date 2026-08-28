# Mutation Choices

> **Status**: Implemented v0.1
> **Last Updated**: 2026-08-28
> **Priority**: MVP Feature
> **First eligibility target**: Total Upgrade Level 150 / Growth Stage 5

## 1. Overview

Mutations are infrequent build-defining choices that add strategic identity to the incremental economy and produce a major visual transformation. They are not a dense RPG skill tree. The MVP contains one first-run mutation choice between three readable archetypes: Muscle, Business and Chaos.

## 2. Player Fantasy

The player has grown a ridiculous pigeon far enough that it now evolves according to *how they want to play*. The choice should feel like claiming an identity for the current run, immediately change the pigeon visually, and noticeably favor active tapping, idle/automation, or crit/event play without making the other play styles unusable.

## 3. Detailed Rules

### First mutation trigger
Default v0.1 eligibility:
- Total Upgrade Level >= 150;
- Growth Stage 5 reached;
- no unresolved higher-priority Growth ceremony;
- mutation not already selected for this run.

The offer appears after the Growth ceremony settles, not stacked on top of it. Runtime progression purchases are frozen while the eligible choice remains unresolved.

### Choice presentation
Three cards display simultaneously when viewport allows, otherwise swipe/stack without hiding comparison information.

Each card shows:
- mutation name;
- dominant raster art preview;
- exact mechanical modifiers;
- plain-language playstyle description;
- persistence rule through prestige.

No hidden random roll is involved.

### Mutation A — Muscle Pigeon
Identity: active/tap power.

Initial v0.1 modifiers:
- `activeTapMultiplier ×1.35`;
- `comboCap +0.15` additive to multiplier ceiling;
- passive systems continue normally but do not receive the ×1.35 active factor.

Visual direction:
- broader power treatment around the generated hero;
- stronger force/impact read;
- more forceful peck recoil;
- restrained strength cue, not a copied internet character.

### Mutation B — Business Pigeon
Identity: passive/automation/offline.

Initial v0.1 modifiers:
- `passiveProduction ×1.35`;
- offline efficiency `+0.10` absolute, still respecting the global `0.85` cap;
- helper/business visual treatment unlocked.

Visual direction:
- formal/business accessory treatment;
- tie/briefcase-like generated raster cues where readable;
- organized/industrial rather than muscular presentation.

### Mutation C — Chaos Pigeon
Identity: crits/events/variance.

Initial v0.1 modifiers:
- crit chance `+0.05` absolute after normal crit calculation;
- first-tier mutation crit hard cap `0.30`;
- crit multiplier `×1.15`;
- Pigeon Event base reward `×1.15`.

The `0.30` hard cap is the minimal explicit v0.1 cap implied by adding five percentage points above the normal `0.25` Swag cap. It keeps the full advertised first-tier bonus meaningful without creating unspecified headroom for later mutation tiers.

Visual direction:
- asymmetrical chromatic/aura treatment;
- stronger iridescent/unstable effects;
- still compatible with base art bible and mobile readability.

### Persistence
Mutation selection is stored as an ordered list of stable mutation IDs. MVP only permits the first selection, but the state shape can accept later ordered mutation layers without replacing the persistence model.

The first mutation lasts for the current run until prestige/reset semantics are introduced. Normal save/load cannot reroll it. The additive field remains backward-compatible with existing schema-v1 saves; absent/malformed mutation arrays sanitize safely.

### No trap choices
Each mutation should produce a similar order-of-magnitude advantage for its intended playstyle. Telemetry compares progression speed by mutation. A visually appealing choice must not secretly be dramatically worse.

### Future mutations
Later Growth/prestige tiers may add a second mutation layer or evolve the chosen branch. The current architecture already stores ordered IDs/modifiers instead of a single hardcoded boolean.

## 4. Formulas

### Muscle
`finalActiveTap = normalActiveTap * 1.35`

`finalComboCap = normalComboCap + 0.15`

### Business
`finalPassiveRate = normalPassiveRate * 1.35`

`finalOfflineEfficiency = min(0.85, normalOfflineEfficiency + 0.10)`

### Chaos
`finalCritChance = min(0.30, normalCritChance + 0.05)`

`finalCritMultiplier = normalCritMultiplier * 1.15`

`finalEventReward = normalEventReward * 1.15`

Mutation factors are modifier entries applied by the economy formula pipeline; they do not rewrite canonical branch definitions.

Bread Rush reference income is mutation-aware so event rewards still scale with the player's current production profile; the Chaos event factor is then applied separately to the resulting base reward.

## 5. Edge Cases

- Threshold crossed via a future bulk purchase: Growth ceremony resolves first, mutation decision queues next.
- Browser closes on mutation screen before choice: state remains `eligible/unselected`; reopen returns to the decision after safe load.
- Selection callback repeated: idempotent; same selection does not stack modifier twice.
- Different selection attempted after one is already locked: rejected; no reroll in the current run.
- Player has no ads/network: mutation remains fully available; never monetized as a required choice.
- Reduced motion: CSS honors the system reduced-motion preference while preserving the full preview/result.
- Later balance update changes modifiers: stable mutation ID remains; current balance-version modifier definition applies unless migration policy explicitly snapshots it.
- Crit hard cap with Chaos: excess bonus is not converted to another stat in MVP; the UI states the `30%` hard cap explicitly.
- Event availability is suppressed while the mutation decision is unresolved so the player cannot bypass the progression gate through Bread Rush.

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

`tools/balance/mutation_profiles.py` reads the shipped TypeScript mutation constants and compares deterministic Total Lv 150 active, passive/offline and event-heavy profiles. CI asserts the intended identity winners: Muscle for active, Business for passive/offline, Chaos for event-heavy.

## 8. Implementation Notes — 2026-08-28

- Runtime content: `src/content/mutation-content.ts`.
- Authoritative selection/gating: `GameStore.selectMutation` / `GameStore.isMutationEligible`.
- Persistence/offline: schema-v1 compatible `mutationIds` plus sanitization.
- Presentation: generated raster treatment layers produced before build and consumed by Phaser; no SVG/runtime vector character fallback.
- UI: dedicated DOM comparison modal with desktop three-card layout and compact mobile horizontal comparison.
- Lifecycle: Growth ceremony receives the first beat; mutation modal then pauses gameplay using the existing pause-reason set and resumes only after a successful persisted selection.
- QA: deterministic Vitest coverage plus browser capture of desktop choice, mobile choice and selected Business runtime state.

## 9. Acceptance Criteria

- [x] Mutation offer becomes eligible at configured threshold and cannot appear before Growth ceremony settles.
- [x] All three cards show exact modifiers before selection.
- [x] Selection is persisted by stable ID and cannot be rerolled by refresh.
- [x] Selecting the same mutation twice cannot stack modifiers.
- [x] Muscle affects active production without unintentionally multiplying passive automation.
- [x] Business affects passive/offline without changing base upgrade prices.
- [x] Chaos respects crit hard cap and modifies event reward deterministically.
- [x] Each mutation has a visibly distinct raster runtime treatment compatible with the existing generated hero composition.
- [x] Mutation choice requires no ad/payment.
- [x] Balance tooling compares representative active/passive/event-heavy profiles across the three mutations and CI guards their intended identities.

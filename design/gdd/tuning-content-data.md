# Tuning & Content Data

> **Status**: Designed v0.1
> **Last Updated**: 2026-08-27
> **Implements Pillars**: Every Upgrade Shows; One More Growth Stage

## 1. Overview

All progression, milestone, reward and visual-mapping values are authored as validated content data rather than scattered constants in scene/UI code. The system gives economy design one canonical source of truth, enables deterministic balance simulation, and allows production tuning without rewriting gameplay modules.

## 2. Player Fantasy

This is infrastructure, but it protects the player-facing promise that progression is coherent. A player should never encounter a UI price, growth meter, visual tier or reward that disagrees with the actual economy because two systems used different hardcoded values.

## 3. Detailed Rules

### Content groups

Initial groups:
- `economy`: currency/base tap/global economy settings;
- `upgradeBranches`: six branch definitions;
- `branchMilestones`: mechanical + presentation milestones;
- `growthStages`: total-level thresholds and presentation/unlock payloads;
- `offline`: cap/efficiency rules;
- `events`: event reward/timing definitions;
- `mutations`: eligibility and modifiers;
- `monetization`: reward offer definitions, never portal-specific SDK calls;
- `visualMapping`: semantic art state IDs, not raw file-system assumptions.

### Definition identity
Every persistent/referenceable content item has a stable string ID. Display copy is separate and localizable.

Examples:
- `upgrade.beak`
- `milestone.beak.10`
- `growth.park.chubby`
- `reward.offline.double`

IDs are never changed casually after release; deprecation/migration is preferred.

### Validation
At boot/build-test time validate:
- duplicate IDs;
- missing referenced IDs;
- negative prices/rates where prohibited;
- non-monotonic growth thresholds;
- milestone level outside branch cap;
- invalid visual mapping target;
- mutation referencing unknown modifier;
- rewarded offer with no reward description/key;
- economy numbers that are NaN/infinite.

### Runtime mutation
Production gameplay treats loaded definitions as immutable. Temporary buffs create derived runtime modifiers rather than editing canonical definitions.

### Versioning
Content bundle has `schemaVersion` and `balanceVersion`.
- `schemaVersion`: structural compatibility; save migration may be required.
- `balanceVersion`: numeric tuning identity; ordinary balance updates need not rewrite saves.

## 4. Formulas

The data system itself owns no economy formulas; it stores parameters used by formulas defined in system GDDs.

Required validation relations include:

`growth[i+1].threshold > growth[i].threshold`

`branch.baseCost > 0`

`branch.costGrowth > 1`

`milestone.level > 0 && milestone.level <= branch.eraCap`

`reward.multiplier >= 0`

## 5. Edge Cases

- Unknown content ID in old save: migration/fallback map decides; never silently crash.
- Removed feature content: saved state keeps only stable IDs needed by migration.
- Partial asset preload: visual mapping resolves to a safe base tier until required asset is available.
- Invalid dev config: fail loudly in development/test; production build should not ship with validation errors.
- Portal-specific tuning: avoid unless data proves necessary; use platform policy configuration only for SDK behavior, not hidden economy discrimination.
- A/B test later: experiments must select complete versioned parameter sets, not mutate arbitrary individual constants mid-session.

## 6. Dependencies

Upstream: none beyond TypeScript/config loader.

Downstream:
- Progression Economy;
- Visual Composition;
- Events;
- Mutations;
- Monetization reward definitions;
- UI milestone preview;
- Balance simulator;
- Analytics metadata.

## 7. Tuning Knobs

Everything explicitly identified in dependent GDDs, including:
- cost bases/growth rates;
- per-level power;
- milestone levels/multipliers;
- growth thresholds;
- branch unlocks;
- combo/crit parameters;
- offline rules;
- event rewards;
- mutation modifiers;
- visual state mappings;
- ad reward multipliers/durations.

Tuning changes require a short reason/changelog once the project reaches external testing.

## 8. Acceptance Criteria

- [ ] A single content bundle can reproduce all v0.1 progression values from `progression-economy.md`.
- [ ] No authoritative economy price/effect is hardcoded in DOM/Phaser presentation modules.
- [ ] Config validation rejects duplicate IDs and broken references.
- [ ] Growth thresholds are validated monotonic.
- [ ] `schemaVersion` and `balanceVersion` are present.
- [ ] Balance simulator consumes the same canonical values or a generated representation, not a manually duplicated curve.
- [ ] Visual mappings use semantic IDs so file renames do not change save schema.
- [ ] Development build fails clearly when required tuning data is invalid.

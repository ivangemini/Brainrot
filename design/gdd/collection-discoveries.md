# Collection & Discoveries

> **Status**: Designed v0.1
> **Last Updated**: 2026-08-27
> **Priority**: MVP Meta Shell
> **Implements Pillars**: Every Upgrade Shows; Absurdity Escalates From Reality

## 1. Overview

The Collection records meaningful pigeon discoveries: Growth identities, mutation outcomes, rare visual states and later daily/secret variants. It converts visual progression into long-term completion goals without treating every numeric upgrade level as a separate collectible.

MVP ships the collection system and a small meaningful set; large content volume is post-MVP expansion.

## 2. Player Fantasy

The player is building a ridiculous catalogue of pigeons they have actually created/discovered through play. Unlocking a page should feel like proof of a memorable transformation, not a checklist generated from invisible stat increments.

## 3. Detailed Rules

### Discovery definition
A collection entry has:
- stable ID;
- display name;
- category/rarity for presentation;
- unlock condition ID/rule;
- hero art/thumbnail mapping;
- short original description;
- optional stat/progression context;
- secret/hidden flag.

### What counts as an entry
Good candidates:
- major Growth Stage identity;
- Muscle/Business/Chaos mutation forms;
- significant combined milestone form intentionally authored as a discovery;
- event/achievement secret;
- future Daily Pigeon.

Not entries:
- Beak Lv17 vs Lv18;
- every currency breakpoint;
- arbitrary accessory state with no meaningful progression story.

### Unlock
When a condition becomes true, unlock once, persist ID, emit `collection:discovered`, and show a short non-blocking reveal unless it is a major/secret discovery deserving a larger card.

### Collection screen
Grid/list with:
- unlocked thumbnail/name;
- locked silhouette for known non-secret slots;
- secret slots shown as `???` or omitted according to entry data;
- filters only if collection size justifies them;
- progress count (`N / known total`) where meaningful.

Selecting an unlocked entry shows:
- larger art;
- description;
- discovery condition/history summary;
- related Growth/mutation identity.

### Rarity
Rarity is a presentation taxonomy, not random gacha probability in MVP.
Suggested labels: Common, Rare, Epic, Legendary, Secret. The rarity reflects difficulty/specialness of discovery.

### Daily Pigeon later
Daily entries are planned as a live-content extension. Core collection data model supports expiry/rotation metadata, but MVP does not require server-backed daily scheduling.

## 4. Formulas

Collection completion:
`completion = unlockedCount / visibleCount`

Do not include hidden secret entries in the denominator shown to a new player unless design intentionally wants a mysterious over-100% style reveal.

Discovery conditions are rule predicates, not probability formulas unless a future specific entry requires RNG.

## 5. Edge Cases

- Entry condition met while collection screen closed: unlock persists and reveal queues safely.
- Multiple entries unlock from one Growth transaction: consolidate reveal sequence; do not stack modals.
- Entry removed/renamed in content update: stable ID migration preserves unlock.
- Missing thumbnail asset: show safe placeholder silhouette in development; production content validation must catch before release.
- Save from before collection system: derive eligible historical Growth/mutation entries during migration where possible, so existing players are not punished.
- Secret discovered before its UI category unlocks: persist it and reveal when collection feature becomes available.

## 6. Dependencies

Upstream:
- Growth/Progression;
- Mutation Choices;
- Tuning/Content Data;
- Save;
- Pigeon Visual Composition/art assets.

Downstream:
- Daily/live content later;
- achievements later;
- analytics collection completion metrics.

## 7. Tuning Knobs

- entry unlock conditions;
- rarity labels;
- reveal size/duration;
- whether locked entry hints are shown;
- feature unlock Growth Stage;
- per-entry copy/art mapping.

MVP target content: enough entries to make the screen credible (roughly 12–20 meaningful discoveries), without delaying core economy polish to produce dozens of variants.

## 8. Acceptance Criteria

- [ ] Collection unlocks stable IDs exactly once and persists them.
- [ ] Major Growth and first mutation outcomes can create entries.
- [ ] Numeric upgrade levels alone do not automatically create hundreds of meaningless entries.
- [ ] Existing-save migration can backfill derivable Growth/mutation discoveries.
- [ ] Locked/secret states are visually distinct without leaking secret names where hidden.
- [ ] Collection screen remains responsive at target phone and desktop viewports.
- [ ] Multiple simultaneous discoveries do not create overlapping modal deadlocks.
- [ ] MVP content includes at least 12 authored meaningful entries before release candidate.

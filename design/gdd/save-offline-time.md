# Save & Offline Time

> **Status**: Designed v0.1
> **Last Updated**: 2026-08-27
> **Priority**: MVP Foundation

## 1. Overview

This system persists player progression safely across refreshes, browser sessions and supported portal cloud saves. It also computes offline elapsed time without allowing arbitrary device-clock manipulation to create unlimited progression. The save format is compact, versioned and independent of Phaser/DOM runtime objects.

## 2. Player Fantasy

An incremental game depends on trust. The player expects that every upgrade and growth stage they earned will still exist after closing the tab, changing device where cloud save is supported, or returning hours later. Offline earnings should feel like a welcome continuation reward, not a loophole or a punishment.

## 3. Detailed Rules

### Save layers
1. **Local save** — primary fast persistence for every build/environment.
2. **Portal cloud save** — optional capability supplied by Platform Adapter.
3. **In-memory state** — authoritative during runtime, periodically serialized to a DTO.

The game never requires cloud availability to continue playing.

### Save DTO v1
Minimum persistent fields:
- `schemaVersion`;
- `balanceVersion` last seen;
- `saveRevision` monotonically increasing integer;
- `createdAt` logical timestamp;
- `savedAt` timestamp;
- `lastSeenAt` timestamp;
- Feathers;
- branch levels;
- growth stage / derived check data where useful;
- unlocked branch/system flags only when not fully derivable;
- mutation selections;
- collection/discovery state;
- prestige/meta state when introduced;
- settings relevant across sessions;
- analytics consent/state if required by platform policy;
- pending idempotent reward transaction identifiers when needed.

Do not save:
- Phaser objects;
- DOM state;
- loaded asset state;
- visual transform pixels;
- transient particles;
- current ad SDK objects;
- data fully derivable from canonical config unless needed for migration safety.

### Save cadence
Dirty state triggers scheduled persistence rather than writing on every tap.

Save immediately after high-value transitions:
- purchase batch completes;
- Growth Stage transition settles;
- mutation selection;
- rewarded transaction applied;
- prestige;
- visibility/page lifecycle indicates likely exit where platform permits.

Normal dirty cadence target: a few seconds, tunable.

### Cloud conflict rule
When both local and cloud saves exist, compare a compact metadata envelope:
- schema compatibility;
- save revision;
- saved timestamp;
- progression score sanity (e.g. prestige + total level) for diagnostics.

Default conflict strategy in MVP:
- prefer the newer compatible revision;
- if revisions/timestamps are ambiguous and states materially diverge, choose the state with higher non-destructive progression score only if doing so cannot delete legitimate later meta progress;
- log the conflict for telemetry/debug;
- avoid prompting normal players unless a genuinely ambiguous destructive conflict cannot be resolved safely.

### Offline calculation
Offline starts from the last trustworthy persisted timestamp and current adapter/system time.

Use the progression GDD rule:
`offlineDuration = clamp(elapsed, 0, offlineCap)`.

Suspicious or negative elapsed values produce zero/limited offline earnings rather than negative currency or enormous rewards.

### Reward claim
On return:
1. load/resolve save;
2. calculate baseline offline reward once;
3. create an offline claim object with unique ID;
4. offer baseline claim and optional rewarded ×2;
5. apply exactly one terminal result;
6. persist claim completion.

The player must never lose the baseline reward because an ad is unavailable.

### Migrations
Each schema version has a pure migration path:
`vN DTO -> vN+1 DTO`.

Migrations are deterministic, fixture-tested and never depend on loaded scene objects.

## 4. Formulas

### Save revision
`nextRevision = previousRevision + 1` for each committed serialized state.

### Offline elapsed
`elapsedSeconds = currentTrustedTime - lastSavedTrustedTime`

`eligibleSeconds = clamp(elapsedSeconds, 0, offlineCapSeconds)`

### Offline reward
Defined by Progression Economy:
`baselineOffline = passiveRateSnapshot * eligibleSeconds * offlineEfficiencySnapshot`.

For MVP, store sufficient snapshot values to avoid retroactively recomputing an old absence using a completely different current tuning set.

### Conflict score (diagnostic only)
A possible non-authoritative score:
`progressScore = prestigeTier * LARGE_WEIGHT + totalUpgradeLevel`.

This must not replace revision/time logic as the sole conflict resolver.

## 5. Edge Cases

- localStorage unavailable/restricted: use platform-provided safe storage where available; in development show clear error fallback.
- Cloud API unavailable: local game continues; retry cloud later.
- Cloud save exceeds portal limit: serialization budget test fails before release; never silently truncate.
- Page killed before scheduled save: high-value transitions already saved immediately; cadence minimizes remaining loss.
- Duplicate rewarded callback after reload: transaction ID prevents reapplication.
- Save from future unsupported schema: do not mutate it blindly; surface recoverable incompatibility state and preserve raw payload for debugging where feasible.
- Corrupt JSON: attempt backup/last-known-good; if impossible, start recoverable new state and record error rather than crashing boot loop.
- Clock moves backward: eligible offline seconds = 0 until a trustworthy progression of time resumes.
- Clock jumps huge forward: clamp to cap; optionally flag anomaly.
- Balance update while away: use stored passive snapshot/defined migration policy so reward remains fair and bounded.

## 6. Dependencies

Upstream:
- Platform Adapter — cloud/safe-storage capabilities and lifecycle.
- Game State / Clock — trusted pause/resume and current-time abstraction.
- Progression Economy — serializable authoritative state and offline snapshot values.

Downstream:
- every persistent progression system;
- offline-return UI;
- monetization offline ×2;
- analytics save/conflict/error diagnostics.

## 7. Tuning Knobs

- ordinary autosave interval;
- cloud sync debounce;
- offline cap;
- clock anomaly tolerance;
- local backup count;
- conflict-resolution thresholds;
- maximum serialized payload warning threshold (well below hard portal cap).

Initial budget target: keep normal save payload under 50 KB even though Yandex currently allows up to 200 KB for player data, leaving substantial migration/headroom.

## 8. Acceptance Criteria

- [ ] Save DTO contains no Phaser/DOM/runtime objects.
- [ ] Schema version begins at v1 and migration runner is testable independently.
- [ ] Purchase, Growth, mutation and rewarded completion trigger durable save scheduling/immediate commit as defined.
- [ ] Refresh after any high-value transition loses no completed progression in browser smoke tests.
- [ ] Cloud failure never prevents local play.
- [ ] Duplicate rewarded/offline claim callback cannot duplicate the reward.
- [ ] Negative elapsed time produces no negative currency.
- [ ] Very large elapsed time is clamped to configured offline cap.
- [ ] Save payload remains below 50 KB in a synthetic late-game fixture for MVP content.
- [ ] Local/cloud conflict resolution is deterministic for covered fixtures.
- [ ] Corrupt save boot path does not create an unrecoverable crash loop.

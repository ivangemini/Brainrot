# Design Directory Instructions

These instructions apply to files under `design/` and extend the root `AGENTS.md`.

## Operating model

Codex/ChatGPT is the sole executor. Work autonomously on reversible design-document changes that are within the user's requested scope. Role files under `agents/` are expertise profiles, not separate processes.

## GDD files (`design/gdd/`)

Every system GDD must include these eight required sections in this order:
1. Overview — one-paragraph summary.
2. Player Fantasy — intended feeling and experience.
3. Detailed Rules — unambiguous mechanics and states.
4. Formulas — math with variables and units defined.
5. Edge Cases — unusual situations handled explicitly.
6. Dependencies — other systems and contracts listed.
7. Tuning Knobs — configurable values identified.
8. Acceptance Criteria — testable success conditions.

File naming: `[system-slug].md`.

Maintain `design/gdd/systems-index.md` whenever systems are added, removed, split, or merged.

Design order: Foundation -> Core -> Feature -> Presentation -> Polish.

Run/apply the `design-review` workflow after substantial GDD authoring and `review-all-gdds` after completing a related set.

## Quick specs (`design/quick-specs/`)

Use for tuning changes, small mechanics, balance patches, and narrowly scoped experiments. Prefer a full GDD when a mechanic owns persistent state, has multiple dependencies, or affects monetization/progression.

## Art (`design/art/`)

`design/art/art-bible.md` is the visual source of truth. New production assets must conform to it. Keep visual changes tied to gameplay/progression semantics rather than arbitrary skin swaps.

## UX (`design/ux/`)

- Per-screen specs: `design/ux/[screen-name].md`
- HUD: `design/ux/hud.md`
- Interaction patterns: `design/ux/interaction-patterns.md`
- Accessibility: `design/ux/accessibility-requirements.md`

Player-facing controls must support the project's target input methods and portal constraints.

## Balance discipline

Economy values are data, not decoration. Any meaningful progression curve must document:
- source/sink formulas;
- target time-to-upgrade and time-to-milestone windows;
- expected active and idle income assumptions;
- milestone multipliers;
- caps/floors;
- simulation or deterministic sanity checks before implementation is considered balanced.

Do not present provisional tuning as final production balance.
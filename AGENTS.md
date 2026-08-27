# AGENTS.md — Brainrot Game Project

This file is the canonical operating contract for the only coding agent working in this repository: OpenAI Codex / ChatGPT.

## Operating model

This repository uses a **single-agent studio model**. Files under `agents/` are role profiles, not independent AI processes. Do not claim that another agent was spawned, consulted, or executed. When a task touches a domain, read the relevant role profile and apply that expertise yourself in the same working session.

Examples:
- gameplay implementation -> `agents/gameplay-programmer.md`
- systems/economy -> `agents/systems-designer.md`, `agents/economy-designer.md`
- visual direction -> `agents/art-director.md`, `agents/technical-artist.md`
- UX/UI -> `agents/ux-designer.md`, `agents/ui-programmer.md`
- QA/release -> `agents/qa-lead.md`, `agents/release-manager.md`
- architecture/performance -> `agents/technical-director.md`, `agents/lead-programmer.md`, `agents/performance-analyst.md`

Role hierarchy is for reasoning and review order, not process isolation.

## Skill routing

Reusable workflows live under `skills/<skill-name>/SKILL.md`. When a user task clearly maps to a skill, read that skill before editing. Slash-prefixed names in imported documentation are workflow names, not a requirement for a special command runtime.

For large implementation passes, prefer this sequence when applicable:
1. inspect current project state and source-of-truth docs;
2. identify the relevant skill(s) and role profile(s);
3. implement the complete coherent slice;
4. run the applicable verification;
5. review the result from gameplay, UX/art, performance and QA perspectives;
6. update roadmap/session-state/docs if behavior or architecture changed.

## Autonomy

The user has selected Codex as the sole implementation agent for this project. Once the user gives a clear task, work autonomously through the full coherent pass.

Do **not** request approval for routine file writes, multi-file edits, tests, refactors within scope, or other reversible implementation details. Do not stop after the first small fix when the requested pass clearly contains more work.

Ask the user only when a genuinely product-defining choice cannot be inferred safely, an irreversible/destructive action is required, credentials/payment/legal acceptance are involved, or two materially different directions would change the game itself. Otherwise choose the best-supported option, document the assumption, and continue.

Where imported skills contain a `user-decision checkpoint`, interpret it using this autonomy rule: block only for a material decision; otherwise proceed with the recommended/default option and record it.

## Source of truth

Until a game concept is selected, this repository is a pre-production studio framework. Do not invent a final game concept, engine, art direction, economy, or platform target unless the user asks to begin concept/design work.

Once created, project-specific source-of-truth documents override generic framework examples. In conflicts, use this precedence:
1. latest explicit user instruction;
2. this `AGENTS.md`;
3. project-specific design/architecture/roadmap documents;
4. relevant `skills/` workflow;
5. relevant `agents/` role profile;
6. generic framework/reference documentation.

## Mandatory meme-pigeon visual contract

The current game identity is locked to the user-approved meme pigeon reference. These rules are mandatory for all player-facing art and layout work unless the user explicitly changes them later:

- The hero is the **bright blue uncanny meme pigeon with human-like orange lips**, not a generic city pigeon.
- The same recognizable identity must survive Growth, cosmetics, mutations and late-game forms: blue body, meme face/lips, uncanny expression and the same core silhouette language.
- Production character/environment art remains **generated raster art only**. Do not reintroduce SVG/vector/shape-built character art as a production substitute.
- The hero is the primary focal point and must be **centered on the actual viewport**, not centered only inside a leftover content column.
- UI must route around the hero. The readable hero silhouette must not overlap the top HUD, upgrade panel/tray, event cards, result cards or other interactive UI.
- UI must not cover the hero's face, torso or readable silhouette, and hero scaling must not intrude into reserved UI zones.
- Desktop and mobile layouts require an explicit hero-safe rectangle. Runtime code must size the hero inside that rectangle while keeping its anchor at viewport center.
- Growth is allowed to increase visible hero size only up to the safe-zone boundary. If Growth would collide with UI, the scene/camera/framing must adapt rather than allowing overlap.
- Browser visual QA must verify both `heroCentered` and `heroSafe` runtime invariants on desktop and mobile.

Canonical detail lives in `design/art/meme-pigeon-identity.md` and `design/ui/hero-first-layout.md`.

## Directory semantics

- `agents/` — role profiles applied by the single Codex agent.
- `skills/` — reusable workflows and checklists.
- `rules/` — coding/design rules; read the rules relevant to files being changed.
- `scripts/hooks/` — reusable validation/session scripts. They are **not automatically executed** by Codex; invoke useful validators explicitly when applicable.
- `studio/docs/` — framework workflow catalog, templates and technical preferences.
- `production/` — sprint/session/release state.
- `design/` — game design artifacts.
- `docs/` — technical/project documentation and upstream attribution.
- `src/`, `assets/`, `tests/`, `tools/`, `prototypes/` — implementation areas once development begins.

## Session continuity

Use `production/session-state/active.md` as persistent working context for long or multi-turn tasks. Update it after substantial implementation passes with completed work, decisions, blockers and the next logical step. This replaces Claude-specific compaction/session hooks.

## Quality discipline

A task is not complete merely because files were edited. Apply the applicable quality gates from the project and imported framework:
- correctness and acceptance criteria;
- deterministic tests where practical;
- visual/interaction review for player-facing changes;
- performance implications;
- save/data compatibility where relevant;
- platform constraints where relevant;
- documentation/roadmap consistency;
- no placeholders in a path presented as production-ready.

Never claim a test, build, browser check, benchmark or validation passed unless it was actually run successfully.

## Git discipline

Keep changes coherent. Never force-push, expose secrets, or intentionally destroy unrelated work. Imported scripts under `scripts/hooks/` are advisory/explicit utilities unless a project-specific workflow wires them into CI later.

## Framework provenance

This project was bootstrapped from Donchitos/Claude-Code-Game-Studios v1.0.0 under the MIT License. The original license is preserved in `LICENSE`; upstream reference snapshots are retained under `docs/upstream/`. The active operating model in this repository is Codex-only and is defined by this file.

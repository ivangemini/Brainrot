---
name: skill-test
description: "Validate studio skills for Codex single-agent compatibility, structure, routing clarity, and workflow completeness."
argument-hint: "static [skill-name|all] | audit"
user-invocable: true
---

> **Codex skill execution semantics**
> Execute this workflow as the single Codex/ChatGPT agent under `AGENTS.md`. References to teams, delegation, escalation, or specialist agents mean sequentially applying the relevant files under `agents/`; they do not imply separate running processes. Routine reversible writes and verification proceed without per-file approval. A user-decision checkpoint blocks only for a material product/architecture decision; otherwise use the recommended/default path, record the assumption, and continue.


# Skill Test

Validate `skills/*/SKILL.md` against the active Codex operating contract in `AGENTS.md`.
This is a documentation/workflow linter, not a separate agent runtime.

## Mode: static

For one skill or all skills, check:

1. **Frontmatter** — `name`, `description`, `argument-hint`, and `user-invocable` exist.
2. **Workflow structure** — the skill has a clear ordered procedure, phases, or equivalent steps.
3. **Outcome/verdict** — the skill defines what completion, PASS/FAIL, READY/BLOCKED, or equivalent means where applicable.
4. **Codex compatibility** — the active skill contains no legacy Claude runtime paths, model-selection metadata, Claude-only tool declarations, or assumptions that independent role processes actually run.
5. **Role routing** — when specialist expertise is needed, the skill identifies an `agents/*.md` role profile or clearly names the role to apply.
6. **Autonomy compatibility** — routine reversible writes must not require per-file approval. Material product decisions may use a user-decision checkpoint, governed by `AGENTS.md`.
7. **Source-of-truth discipline** — project-specific docs/ADRs/requirements are read before implementation when relevant.
8. **Verification** — implementation-oriented skills require tests/build/review evidence appropriate to the change and never claim checks ran unless they actually ran.
9. **Handoff/session continuity** — long workflows update or reference `production/session-state/active.md` when useful and identify the next logical workflow.

Output a concise table with PASS/WARN/FAIL per check and an aggregate verdict.

## Mode: audit

Enumerate all `skills/*/SKILL.md` and all `agents/*.md` role profiles. Report:

- total skills and role profiles;
- missing or malformed frontmatter;
- broken referenced paths;
- active legacy runtime references outside preserved upstream/reference documentation;
- skills that still assume real multi-agent execution rather than single-agent role switching;
- skills whose approval protocol conflicts with `AGENTS.md` autonomy;
- missing next-step or verification guidance.

Prioritize remediation as BLOCKING, HIGH, MEDIUM, or LOW.

## Rules

- `AGENTS.md` is authoritative.
- `agents/` are role profiles, not processes.
- `scripts/hooks/` are explicit utilities unless CI wires them in.
- Do not modify `docs/upstream/` when improving active skills.
- When a skill conflicts with `AGENTS.md`, update the skill rather than weakening the root operating contract.

## Completion

A skill-test pass is complete when findings are reported with exact file paths and specific remediation. If the user asked to fix the findings, apply the fixes in the same pass and re-run the audit logic.

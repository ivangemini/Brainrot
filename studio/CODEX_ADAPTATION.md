# Codex Adaptation

This repository started from Claude Code Game Studios v1.0.0 and was converted to a single-agent Codex workflow.

## Structural changes

- `.claude/agents/` -> `agents/`
- `.claude/skills/` -> `skills/`
- `.claude/rules/` -> `rules/`
- `.claude/hooks/` -> `scripts/hooks/`
- `.claude/docs/` -> `studio/docs/`
- `.claude/agent-memory/` -> `production/agent-memory/`
- `CLAUDE.md` -> replaced by canonical root `AGENTS.md`
- Claude settings/statusline removed

## Semantic changes

There is one executor: Codex/ChatGPT. Agent definitions are role profiles that the executor reads and applies. Imported multi-agent routing language is interpreted as role switching, not as evidence that independent agents ran.

Claude-specific tool metadata (`model`, `allowed-tools`, agent `tools`, `maxTurns`) was removed from active role/skill frontmatter. Claude-specific decision-tool references were converted to ordinary user-decision checkpoints governed by the autonomy policy in `AGENTS.md`.

Hook scripts remain as reusable utilities but are not assumed to run automatically. Validation that matters must be invoked explicitly or later wired into CI.

## Upstream

Original upstream snapshots are retained in `docs/upstream/`. `LICENSE` remains the original MIT license and attribution.

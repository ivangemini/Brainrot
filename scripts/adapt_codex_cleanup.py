from pathlib import Path

root = Path('.')

settings_template = root / 'studio' / 'docs' / 'settings-local-template.md'
if settings_template.exists():
    settings_template.unlink()

replacements = [
    ('.claude/settings.local.json', 'AGENTS.local.md'),
    ('.claude/settings.json', 'AGENTS.md'),
    ('.claude/', 'studio/'),
    ('CLAUDE.md', 'AGENTS.md'),
    ('AskUserQuestion', 'user-decision checkpoint'),
    ('`.claude`', '`agents/`, `skills/`, `rules/`, and `studio/`'),
    (' .claude ', ' studio framework directories '),
    ('model: sonnet', 'execution-profile: default'),
    ('model: opus', 'execution-profile: deep-review'),
    ('model: haiku', 'execution-profile: lightweight-review'),
]

skip = {
    root / 'LICENSE',
    root / 'studio' / 'CODEX_ADAPTATION.md',
    root / 'docs' / 'upstream' / 'CCGS-README.md',
    root / 'docs' / 'upstream' / 'CCGS-UPGRADING.md',
}
for p in list(root.rglob('*')):
    if not p.is_file() or p in skip or '.git' in p.parts:
        continue
    try:
        text = p.read_text(encoding='utf-8')
    except (UnicodeDecodeError, OSError):
        continue
    original = text
    for a, b in replacements:
        text = text.replace(a, b)
    if text != original:
        p.write_text(text, encoding='utf-8')

skill_test = root / 'skills' / 'skill-test' / 'SKILL.md'
if skill_test.exists():
    skill_test.write_text('''---
name: skill-test
description: "Validate studio skills for Codex single-agent compatibility, structure, routing clarity, and workflow completeness."
argument-hint: "static [skill-name|all] | audit"
user-invocable: true
---

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
''', encoding='utf-8')

hooks_ref = root / 'studio' / 'docs' / 'hooks-reference.md'
if hooks_ref.exists():
    text = hooks_ref.read_text(encoding='utf-8')
    note = '''# Codex execution note\n\nIn this repository, files under `scripts/hooks/` are reusable validation/session scripts. They are **not automatically registered by Codex**. Run relevant validators explicitly or wire them into CI/project scripts later. Any upstream description of automatic tool/session hook registration is reference behavior only and does not override `AGENTS.md`.\n\n'''
    if not text.startswith('# Codex execution note'):
        hooks_ref.write_text(note + text, encoding='utf-8')

for p in [
    root / '.github' / 'workflows' / 'adapt-codex.yml',
    root / 'scripts' / 'adapt_codex.py',
    root / 'scripts' / 'adapt_codex_cleanup.py',
]:
    if p.exists():
        p.unlink()
try:
    (root / '.github' / 'workflows').rmdir()
except OSError:
    pass

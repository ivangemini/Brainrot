from pathlib import Path
import re

root = Path('.')

ROLE_NOTICE = '''
> **Codex role-profile semantics**
> This file is a role lens used by the single Codex/ChatGPT executor. Apply it under the root `AGENTS.md`. Do not simulate or claim an independent agent process. Routine reversible implementation, file writes, tests, and within-scope refactors proceed autonomously. Escalation/delegation means switching to and applying the named role profile yourself. Ask the user only for genuinely product-defining, irreversible, credential/payment/legal, or otherwise blocking decisions.
'''

SKILL_NOTICE = '''
> **Codex skill execution semantics**
> Execute this workflow as the single Codex/ChatGPT agent under `AGENTS.md`. References to teams, delegation, escalation, or specialist agents mean sequentially applying the relevant files under `agents/`; they do not imply separate running processes. Routine reversible writes and verification proceed without per-file approval. A user-decision checkpoint blocks only for a material product/architecture decision; otherwise use the recommended/default path, record the assumption, and continue.
'''


def insert_after_frontmatter(text: str, notice: str, marker: str) -> str:
    if marker in text:
        return text
    if text.startswith('---\n'):
        end = text.find('\n---\n', 4)
        if end != -1:
            pos = end + 5
            return text[:pos] + notice + '\n' + text[pos:]
    return notice + '\n' + text


def clean_routine_approval_language(text: str) -> str:
    exact = [
        ('**You are a collaborative implementer, not an autonomous code generator.** The user approves all architectural decisions and file changes.',
         '**You are a disciplined implementer operating under `AGENTS.md`.** Proceed autonomously on routine reversible work; surface only material product or architecture decisions.'),
        ('If you encounter spec ambiguities during implementation, STOP and ask',
         'If you encounter ordinary implementation ambiguity, choose the best-supported interpretation and document it; stop only for a materially blocking product decision'),
        ('**Get approval before writing files:**', '**Write and verify files within scope:**'),
        ('Explicitly ask: "May I write this to [filepath(s)]?"', 'Write the scoped changes to the listed file paths and include them in the completion summary'),
        ('Wait for "yes" before using Write/Edit tools', 'Proceed with scoped writes without a separate per-file approval step'),
        ('Clarify before assuming — specs are never 100% complete', 'Resolve routine ambiguity with evidence and best judgment; ask only when the decision materially changes the product'),
        ('ask-before-write', 'autonomy-policy'),
        ('Ask-before-write', 'Autonomy-policy'),
    ]
    for a, b in exact:
        text = text.replace(a, b)

    lines = text.splitlines()
    out = []
    for line in lines:
        stripped = line.strip()
        indent = line[:len(line)-len(line.lstrip())]
        if 'May I write' in line:
            out.append(indent + '- Proceed with this write when it is within the user-requested scope; do not request per-file approval.')
            continue
        if re.search(r'wait for ["“\']?(yes|approval)', stripped, flags=re.I):
            out.append(indent + '- Continue autonomously for routine reversible work; reserve user confirmation for material decisions defined by `AGENTS.md`.')
            continue
        if re.search(r'get approval before (writing|using Write|editing)', stripped, flags=re.I):
            out.append(indent + '- Write/edit within scope and verify the result; no separate per-file approval is required.')
            continue
        if 'nothing gets written without your sign-off' in stripped.lower():
            out.append(indent + 'Routine scoped changes are written autonomously; material product decisions remain with the user.')
            continue
        out.append(line)
    return '\n'.join(out) + ('\n' if text.endswith('\n') else '')


for p in sorted((root / 'agents').glob('*.md')):
    text = p.read_text(encoding='utf-8')
    text = insert_after_frontmatter(text, ROLE_NOTICE, 'Codex role-profile semantics')
    text = clean_routine_approval_language(text)
    p.write_text(text, encoding='utf-8')

for p in sorted((root / 'skills').glob('*/SKILL.md')):
    text = p.read_text(encoding='utf-8')
    text = insert_after_frontmatter(text, SKILL_NOTICE, 'Codex skill execution semantics')
    text = clean_routine_approval_language(text)
    p.write_text(text, encoding='utf-8')

# Active coordination docs also inherit single-agent semantics.
coordination_targets = [
    root / 'studio' / 'docs' / 'coordination-rules.md',
    root / 'studio' / 'docs' / 'agent-coordination-map.md',
    root / 'docs' / 'WORKFLOW-GUIDE.md',
]
for p in coordination_targets:
    if not p.exists():
        continue
    text = p.read_text(encoding='utf-8')
    marker = '> **Single-agent Codex interpretation**'
    if marker not in text:
        text = marker + '\n> Any director/lead/specialist delegation described here is role routing performed by one Codex/ChatGPT executor. `AGENTS.md` controls autonomy and decision gates.\n\n' + text
    text = clean_routine_approval_language(text)
    p.write_text(text, encoding='utf-8')

# Remove this one-shot migration and its workflow from the final tree.
for p in [
    root / '.github' / 'workflows' / 'semantic-cleanup.yml',
    root / 'scripts' / 'semantic_cleanup.py',
]:
    if p.exists():
        p.unlink()
try:
    (root / '.github' / 'workflows').rmdir()
except OSError:
    pass

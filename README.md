# Brainrot

Pre-production game repository using a **Codex-only game studio workflow**.

The project is intentionally not committed to a game concept or engine yet. The current repository provides the production framework we will use to design, build, review, test and ship the game after the concept is chosen.

## How the studio works

- `AGENTS.md` is the canonical instruction file for Codex/ChatGPT.
- `agents/` contains 49 specialist role profiles. They are reasoning lenses used by the single Codex agent, not separate running agents.
- `skills/` contains the production workflows for design, architecture, implementation, QA, art, UX, release and live operations.
- `rules/` contains domain/path quality rules.
- `scripts/hooks/` contains reusable validators and session utilities; they are explicit scripts, not automatic Claude hooks.
- `studio/docs/` contains workflow catalogs, templates and framework references.
- `production/`, `design/`, `docs/`, `src/`, `assets/`, `tests/`, `tools/`, and `prototypes/` are the working project areas.

See `studio/CODEX_ADAPTATION.md` for compatibility changes and `docs/upstream/` for preserved upstream reference material.

## Current stage

**Framework setup / concept not selected.**

The next project step is to discuss and choose the game concept. Do not treat any generic framework example as the design of this game.

## License and provenance

Bootstrapped from Donchitos/Claude-Code-Game-Studios v1.0.0 under the MIT License. See `LICENSE` and `docs/upstream/`.

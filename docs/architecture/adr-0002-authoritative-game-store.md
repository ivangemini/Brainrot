# ADR-0002 — Authoritative GameStore

- **Status**: Accepted
- **Date**: 2026-08-27

## Context
Rapid taps, passive income, UI purchases, growth transitions and later async ad rewards must not maintain competing versions of progression state.

## Decision
One Phaser-independent `GameStore` owns authoritative runtime `GameState`. Commands mutate state atomically; subscribers receive read-only snapshots after successful transactions.

## Consequences
- UI and Phaser consume state; they do not own it.
- Purchases cannot overdraft Feathers under repeated input.
- Growth is derived from branch levels rather than separately editable progression state.
- Tests can run without a browser or renderer.

## Implementation Guidelines
- All gameplay transactions enter through domain/store methods.
- Copy mutable collections at persistence/presentation boundaries.
- Keep RNG injectable for deterministic tests.
- Add future async rewards through an idempotent transaction boundary rather than direct currency mutation from SDK callbacks.

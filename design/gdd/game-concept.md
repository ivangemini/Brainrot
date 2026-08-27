# Pigeon Maxxing — Game Concept

> **Status**: Locked for pre-production v0.1
> **Working title**: Pigeon Maxxing
> **Target**: Web/browser portals first; mobile-browser and desktop-browser responsive
> **Business model**: Free-to-play, ad-supported
> **Review mode**: Lean

## Elevator Pitch

A fast, absurd idle-clicker where the player starts with a normal city pigeon, earns Feathers by tapping, buys dozens of upgrade levels across multiple branches, and watches every meaningful milestone physically transform the pigeon and the city around it. The sum of all upgrade levels drives giantification: the pigeon grows from bench-sized to city-sized while unlocking new systems, mutations, zones, helpers, events, collection entries, and prestige layers.

The viral pigeon trend is an acquisition inspiration, not the game's IP. Characters, art, names, sounds, animations, and progression identities must be original enough for the game to survive after the trend fades.

## Core Fantasy

**Turn the most ordinary city pigeon into an increasingly powerful, wealthy, ridiculous and physically impossible urban god — and see every bit of progression reflected on screen.**

## Core Verb

**Upgrade.** Tapping generates the resource, but choosing and stacking upgrades is the central progression verb. The player should constantly ask: “What changes if I buy one more?”

## Target Player

Primary:
- casual/mobile-web players;
- incremental/clicker fans;
- players attracted by short-form meme/brainrot aesthetics;
- collection/progression achievers.

Secondary:
- players who enjoy absurd visual escalation;
- completionists chasing mutations, achievements and daily variants.

Not primarily for:
- players seeking deep tactical combat;
- narrative-heavy players;
- competitive PvP audiences.

## Session Shape

### 30-second loop
Tap pigeon -> generate Feathers -> maintain combo -> buy an upgrade -> receive immediate audiovisual feedback -> move toward the next visual milestone.

### 5-minute loop
Buy several levels -> trigger one or more visual changes -> hit a Total Upgrade threshold -> pigeon grows / environment reacts -> unlock a branch, helper, event, or mutation opportunity.

### 15–30 minute session
Push toward the next Growth Stage, complete short Pigeon Events, optimize active vs passive progression, collect discoveries, optionally use rewarded ads for acceleration, and leave with a clear next threshold visible.

### Days/weeks loop
Fill the Pigeon Collection, unlock daily/limited variants, make prestige ascensions, discover mutation branches, complete achievements, and reach later city/cosmic growth stages.

## Progression Structure

### Primary currency: Feathers
- Base tap begins at 1 Feather.
- First meaningful upgrade target is intentionally reachable within seconds, with the reference opening value around 15 Feathers.
- Currency uses compact notation at scale (K/M/B/T/etc.).

### Upgrade branches
1. **Beak** — tap power and tap-hit visuals.
2. **Body** — global production multiplier and body silhouette.
3. **Wings** — combo ceiling/retention and active-play animation intensity.
4. **Swag** — critical taps, luck, accessories, aura.
5. **Nest** — passive income, environment props and helper density.
6. **Brain** — automation, auto-taps, business/technology props and advanced idle efficiency.

Branches unlock progressively so the opening screen is not overloaded.

### Total Upgrade Level
`TotalUpgradeLevel = Beak + Body + Wings + Swag + Nest + Brain levels`

This value is the master giantification meter. Crossing thresholds changes the pigeon scale/silhouette, environment composition and sometimes unlocks a new mechanic.

Growth is not a separately purchased stat.

### Visual milestone hierarchy
- Most levels: numerical improvement + micro-feedback.
- Minor milestones: visible layer/prop/VFX change.
- Major branch milestones: new sprite tier, animation, accessory or environment reaction.
- Growth thresholds: physical scale increase and scene recomposition.
- Mutation thresholds: meaningful build choice with mechanical and visual identity.

## Growth Fantasy

Early examples:
- normal pigeon on a bench;
- chubby pigeon, bench bends;
- large pigeon, bench breaks;
- human-sized pigeon, pedestrians react;
- car-sized pigeon, scene reframes around traffic;
- building-sized pigeon, city becomes the backdrop;
- mega/city pigeon, helicopters and skyline establish scale;
- late-game surreal/cosmic stages.

Exact thresholds are tuning data owned by the progression-economy GDD.

## Pigeon Events

Short 20–45 second interruptions that provide mechanical variety without turning the game into a collection of unrelated minigames. Initial candidates:
- **Steal the Bread** — short lane/timing chase.
- **Poop Strike** — timing/target minigame.
- **Bread Rush** — collect as much food as possible before the timer ends.

Events reward Feathers, temporary boosts and collection progress. They are natural ad-break boundaries after the result screen, never during active input.

## Mutation Choices

At selected major progression thresholds, offer a limited build choice, e.g.:
- Muscle path -> stronger active/tap production and body transformation.
- Business path -> stronger passive/automation production and outfit/environment transformation.
- Chaos path -> crit/luck/event-oriented production and stranger visuals.

The player is not locked into a full RPG. Mutations are infrequent, legible strategic forks.

## Collection

Discoveries record visually meaningful pigeon states/variants rather than every numeric level. Collection categories can include common, rare, epic, legendary and secret entries. Daily Pigeon challenges create return reasons without requiring a separate content-heavy mode.

## Prestige

Working name: **Ascend the Pigeon**.

Prestige resets the current run's normal economic progress after a meaningful late-stage threshold and grants permanent meta bonuses plus access to new visual/economic tiers. Prestige must not appear so early that the first run feels disposable.

## Monetization Principles

The game is ad-supported but the click loop must remain playable without ads.

Rewarded-video opportunities:
- 2x offline earnings;
- 2x Pigeon Event reward;
- temporary production boost;
- optional reroll/bonus on selected mutation/collection rewards;
- continue/retry where appropriate.

Interstitial/midgame opportunities:
- after a major Growth Stage transition;
- after selected event/result transitions;
- after prestige/zone transition;
- never while the player is actively tapping or targeting.

Sticky/banner placements, where a portal supports them, are menu/non-critical-layout elements and must not cover active controls.

## Visual Identity Anchor

### Dead-Serious Urban Absurdity

**One-line rule:** Render increasingly ridiculous pigeon progression with a consistent, polished, pseudo-tangible visual language as if the world takes every transformation completely seriously.

Supporting principles:
1. **Progress must be visible** — if an upgrade is important mechanically, the player should be able to see its consequence in the pigeon, effects, helpers or environment.
2. **Readable silhouette before detail** — every growth/body/mutation tier must read instantly at mobile size.
3. **Escalation, not randomness** — absurdity grows from ordinary city reality toward impossible scale; visual jokes should feel like consequences of progression, not unrelated stickers.

## Technical Direction

- TypeScript.
- Vite-based web build.
- Phaser 4.x / WebGL game canvas for pigeon/world/VFX/minigames.
- HTML/CSS overlay UI for high-resolution responsive menus and upgrade controls.
- Layered raster pigeon composition using transparent WebP/PNG source assets and texture atlases where appropriate.
- Platform adapter layer for Yandex Games, CrazyGames and generic web builds.
- Local save always available; portal cloud save used when supported.

## MVP Definition

A commercial-quality MVP must prove the complete progression fantasy, not merely tapping.

Required:
- satisfying tap/combo feedback;
- 6 upgrade branches with staged unlocks;
- Total Upgrade Level + physical growth thresholds;
- at least 5 visually distinct growth stages;
- meaningful visual milestone changes in every branch;
- passive income and offline progress;
- at least 2 Pigeon Events;
- collection shell with meaningful discoveries;
- first mutation decision;
- save/load;
- Yandex platform adapter + ads;
- generic adapter suitable for other portals;
- responsive desktop/mobile web UI;
- analytics hooks for progression/ad funnel tuning.

Not required for first playable:
- full prestige depth;
- 100+ collection entries;
- many zones;
- social/PvP systems;
- native mobile applications;
- heavy 3D rendering.

## Key Risks

1. **Economy pacing** — too fast removes anticipation; too slow makes upgrades feel like walls.
2. **Visual production volume** — must use composable layers and milestones rather than unique art for every level.
3. **Trend dependence** — game needs original progression humor and identity independent of one TikTok meme.
4. **Ad pacing** — poor placement can destroy retention; ads belong at voluntary rewards or genuine breaks.
5. **Late-game readability/performance** — giantification, helpers and VFX must stay legible and performant on mobile browsers.

## Success Test

The concept is working if a new player can play for ten minutes and:
- buy many upgrades without feeling they are all the same;
- notice several visible changes without being told to look for them;
- understand the next Growth Stage target;
- experience at least one strong “one more upgrade” moment;
- leave knowing what they want to unlock next.
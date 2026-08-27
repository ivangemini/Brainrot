# Web Portal Platform Research

> **Checked**: 2026-08-27
> **Purpose**: Current constraints that shape the platform adapter, persistence and ad design.

## Yandex Games

Official documentation:
- Advertising: https://yandex.com/dev/games/doc/en/sdk/sdk-adv
- Player data: https://yandex.com/dev/games/doc/en/sdk/sdk-player

### Advertising constraints used by this project
- Fullscreen/interstitial advertising is intended for logical breaks rather than active gameplay.
- Rewarded video is explicitly user-initiated and must grant the advertised reward only after successful completion.
- Sticky banners are platform-controlled/optionally controllable and must not obscure critical gameplay controls.
- The game must pause/mute or otherwise enter an ad-safe lifecycle state while fullscreen/rewarded content is active.

### Persistence constraints used by this project
- Yandex `Player` data supports cloud game-state storage.
- `player.setData()` has a 200 KB player-data limit at the time of this research.
- Save payloads must therefore be compact, versioned and free of unnecessary historical/visual data.
- Local persistence remains required as a fallback and for unauthenticated/unavailable-cloud situations.

## CrazyGames

Official documentation:
- HTML5 video ads: https://docs.crazygames.com/sdk/html5-v2/video-ads/
- Advertisement requirements: https://docs.crazygames.com/requirements/ads/
- Midgame pacing guidance: https://docs.crazygames.com/resources/midgame-ads-pacing/

### Advertising constraints used by this project
- Supported video concepts include `midgame` and `rewarded`.
- Rewarded ads require explicit player consent and a clear reward.
- Midgame ads belong at natural breaks such as completed stages/results, not in active interaction.
- CrazyGames currently enforces its own midgame frequency safeguards (documented as at most one midgame ad every three minutes, plus additional protections). The game should request only at valid breaks and let the platform decide whether an ad is actually served.
- Ad error/unfilled cases must resume the game safely and must never grant a rewarded benefit unless completion semantics say the reward was earned.

## Phaser

Official releases:
- Phaser 4 downloads: https://phaser.io/download/phaser4
- Current researched stable release: Phaser 4.2.1, released 2026-07-09.

## Architectural consequences

1. Gameplay systems never call `YaGames`, `window.CrazyGames`, or another portal SDK directly.
2. A `PlatformAdapter` exposes capability-based APIs: ads, cloud save, profile/auth where useful, gameplay lifecycle and optional portal events.
3. A generic-web adapter implements safe no-op / local-only behavior for development and unsupported portals.
4. Rewarded transactions are two-phase: request -> confirmed completion -> apply idempotent reward.
5. Fullscreen/midgame requests occur only from explicit break states controlled by game flow.
6. Save payloads are versioned and compact enough to remain comfortably under the strictest supported platform limit.
7. Ad failures/unfilled responses are normal control flow, not fatal errors.
8. Platform SDK availability is asynchronous; the core game can boot and render a safe loading state until the adapter is ready.

## Research freshness rule

Before release submission or any SDK upgrade, re-check the official portal documentation and update this file. Portal policy/API behavior is treated as time-sensitive infrastructure.
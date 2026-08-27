# Hero-First Layout Contract

Status: **MANDATORY** for the main clicker, Bread Rush and future player-facing scenes.

## Core invariant

The meme pigeon is the primary focal point of the game and stays centered on the **actual viewport**.

`hero.x = viewportWidth / 2`
`hero.y = viewportHeight / 2`

Do not center the hero inside a reduced left content column just because a desktop upgrade panel exists.

## Non-overlap invariant

The readable hero silhouette must fit inside the runtime hero-safe rectangle. The UI may occupy reserved zones around the hero, but neither side may intrude into the other.

Reserved zones include:
- top HUD;
- desktop right upgrade panel;
- mobile bottom upgrade tray;
- event/result overlays when visible;
- any future persistent navigation or monetization controls.

The hero's face, lips, torso and readable silhouette must remain unobstructed.

## Desktop

- Hero anchor: viewport center.
- Top HUD is reserved above the hero-safe rectangle.
- Upgrade panel stays on the right.
- Hero is scaled down as needed so its bounds end before the right panel.
- Decorative background may continue under translucent UI; readable hero silhouette may not.

## Mobile portrait

- Hero anchor: viewport center.
- Top HUD stays compact.
- Upgrade UI is a shallow scrollable bottom tray, not a tall sheet that pushes the hero upward.
- Bottom tray target cap: roughly 24% of viewport height / 190 px on narrow phones.
- Hero must remain centered rather than being shifted into the remaining vertical gap.

## Growth

Total Upgrade Level may increase hero scale, but only until the safe rectangle is reached. Growth after that point must be communicated with camera/framing, effects, environment changes and later asset tiers instead of UI collision.

## Runtime enforcement

`src/presentation/hero-layout.ts` owns the safe-zone geometry.

`MainScene` and `BreadRushScene` write two QA flags to the canvas:
- `data-hero-centered="true"`
- `data-hero-safe="true"`

Browser visual QA must fail if either flag is false on desktop or mobile.

## Forbidden layout patterns

- centered modal/card permanently covering the hero;
- upgrade panel overlapping the face or torso;
- hero shifted left solely to make room for UI;
- mobile bottom sheet consuming so much height that the hero cannot remain centered;
- growth scaling beyond the safe rectangle;
- placing critical buttons directly over the hero silhouette.

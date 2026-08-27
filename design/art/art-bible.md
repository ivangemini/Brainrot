# Pigeon Maxxing — Art Bible

> **Status**: Approved for pre-production v0.1
> **Last Updated**: 2026-08-27
> **Visual Identity Anchor**: Dead-Serious Urban Absurdity
> **Target**: Mobile/desktop web, 2D/2.5D layered raster presentation

## 1. Visual Identity Statement

### One-line rule

**Render increasingly ridiculous pigeon progression with a consistent, polished, pseudo-tangible visual language as if the world takes every transformation completely seriously.**

### Supporting principles

#### Progress Must Be Visible
If a mechanic meaningfully increases player power or automation, give it a visible consequence in the pigeon, VFX, helpers, props, environment damage/reaction, or animation intensity.

#### Readable Silhouette Before Detail
At phone size, the player should be able to distinguish body/growth/mutation tiers without inspecting accessories. Large shape changes beat small texture detail.

#### Escalation, Not Randomness
Begin in an ordinary park/street reality. Every impossible visual should feel like the next consequence of the pigeon becoming too powerful, too wealthy or too large.

## 2. Mood & Atmosphere

### Normal clicker state
- Mood: satisfying, playful, slightly deadpan.
- Lighting: soft daylight, moderate contrast, warm-neutral city environment.
- Energy: calm base with sharp reactive spikes on taps.
- Carrier elements: rhythmic pigeon bob, subtle traffic/NPC movement, crumbs/feathers on impact.

### High combo
- Mood: controlled chaos.
- Lighting: same world lighting; intensity comes from VFX, animation frequency and micro-camera motion rather than changing the whole palette.
- Energy: frenetic.
- Carrier elements: faster pecking, wing flare, stronger particles, hit streak numbers, limited shake.

### Growth threshold
- Mood: spectacle and disbelief.
- Lighting: short celebratory exposure/contrast lift, then return to world baseline.
- Energy: one large punctuation event.
- Carrier elements: scene zoom/reframe, environment reaction, debris/props/NPC response, strong growth stinger.

### Mutation choice
- Mood: dramatic reveal played completely straight.
- Lighting: vignette/spotlight treatment, background softened.
- Energy: deliberate pause from tapping.
- Carrier elements: full pigeon silhouette, two/three clear mutation cards, mechanical outcome visible before selection.

### Event/minigame
- Mood: concise arcade burst.
- Lighting: preserve zone palette but increase clarity/contrast around interactable objects.
- Energy: high, readable, no decorative clutter over targets.

### Prestige / Ascension
- Mood: absurdly ceremonial.
- Lighting: strongest supernatural shift in the game; bright vertical light, sky treatment, particles.
- Energy: slow build -> impact -> reset reveal.

## 3. Shape Language

### Pigeon
- Base silhouette: compact pear/bean torso, small head, readable beak wedge, simple legs.
- Growth progression primarily increases torso mass, neck thickness, stance authority and screen occupancy.
- Do not rely on uniform `scale()` alone for every stage; major stages need silhouette variants or body-tier layers.
- Mutations exaggerate one dominant readable idea: muscle width, business/formal verticality, chaos/asymmetry.

### Accessories
- One dominant accessory per silhouette region: head, face, neck, body, feet.
- Avoid stacking so many items that the pigeon becomes visual noise.
- High-value accessories should be recognizable at thumbnail scale through shape before material detail.

### Environment
- Early geometry: horizontal, human-scale, familiar — bench, curb, trash can, lamp, car.
- As the pigeon grows, human-scale props become scale references and progressively break, move or disappear.
- Later environment composition becomes increasingly vertical: buildings, cranes, helicopters, skyline.

### UI
- Rounded-rect cards with strong hierarchy; simple geometric language distinct from the illustrated world.
- Upgrade branches each get a stable icon silhouette.
- Numeric information is dense but must never feel like a spreadsheet: icon + level + effect + cost + milestone preview.

## 4. Color System

### World palette
- **Asphalt Ink** `#23252B` — deep urban neutral / shadows.
- **Concrete Warm** `#C9C1B5` — ground/building neutral.
- **Pigeon Blue-Gray** `#596574` — baseline feather family.
- **Iridescent Teal** `#278B83` — neck/feather highlight.
- **Iridescent Violet** `#6650A5` — secondary feather highlight.
- **Bread Warmth** `#D99B53` — food/environment warmth.

### UI/reward palette
- **Feather Gold** `#F2C84B` — primary currency and major value.
- **Growth Lime** `#B8EE62` — growth meter / ready-to-grow state.
- **Critical Coral** `#F36A62` — crit/combo impact, not generic danger.
- **Info Cyan** `#66C7E8` — informational/system state.
- **UI Cream** `#F5F1E8` — primary light text/surfaces.
- **UI Ink** `#17191E` — dark panel foundation.

### Semantic rules
- Gold = currency/value/reward.
- Lime = progression threshold and positive unlock readiness.
- Coral = temporary impact/critical state; do not use it as the sole error signal.
- Cyan = neutral information/automation/brain systems.
- Violet/teal = pigeon identity, aura, mutation accents.

### Accessibility
Every semantic state must have icon/shape/text backup. Do not encode affordability, danger, rarity or readiness by color alone.

## 5. Character / Pigeon Art Direction

### Production model
The pigeon is a layered composite, not a single final skin.

Recommended runtime layer order:
1. shadow;
2. rear aura/background effects;
3. rear wing;
4. body;
5. belly/chest overlay;
6. legs/feet;
7. front wing;
8. head;
9. eyes/expression;
10. beak;
11. neck accessory;
12. body accessory;
13. face accessory;
14. head accessory;
15. foreground hit/VFX.

### Visual tiers
Each upgrade branch can have many numerical levels but only 6–10 major art states in a long progression tier. Use milestone swaps plus procedural effects between them.

Example Beak progression language:
- ordinary;
- slightly larger/stronger;
- hardened/shiny;
- reinforced/metallic;
- gold/status tier;
- absurd high-power tier;
- late mutation/cosmic tier.

### Expressions
- Default deadpan/serious expression is central to the humor.
- High combo: narrowed/committed eyes, faster head motion.
- Growth: momentary surprise/strain can be used, but return to deadpan authority.
- Avoid constant cartoon smiles; the world is funnier when the pigeon appears to take progression seriously.

### Originality rule
Do not recreate a specific viral meme image, creator character design, watermark, voice, or signature pose. Use the cultural idea of “viral pigeon absurdity” only as trend context.

## 6. Environment Design Language

### Zone 1 — Park
- Bench, path, grass, lamp, trash can, bread/NPC anchors.
- Designed to make the initial pigeon feel small and ordinary.
- Growth reactions: bench bend -> crack -> destroy; nearby NPC behavior changes; camera backs away.

### Zone 2 — Street / Downtown
- Cars, road markings, storefronts, traffic lights, pedestrians.
- Provides stronger scale references for human/car/building-sized growth.

### Later zones
- High-rise skyline / infrastructure for mega scale.
- Surreal/cosmic backgrounds only after the player has exhausted familiar city scale references.

### Environment storytelling
Every new growth stage should answer “how does the world cope with this pigeon now?” using props/NPCs/scale composition rather than explanatory text.

## 7. UI / HUD Visual Direction

### Rendering split
- Phaser/WebGL canvas: pigeon, world, particles, minigames, camera.
- HTML/CSS overlay: resource bars, upgrade drawer/cards, collection, settings, platform-safe dialogs.

### Main hierarchy
1. Currency / income state.
2. Pigeon as visual focal point.
3. Tap/combo feedback.
4. Next Growth meter.
5. Upgrade purchase controls.
6. Optional ad/secondary actions.

### Upgrade card anatomy
Each branch card shows:
- branch icon/name;
- current level;
- current mechanical effect;
- next level delta;
- price;
- milestone indicator (`2 levels to visual upgrade` etc.).

### Rewarded ads
Ad buttons must visually differ from normal purchase buttons and explicitly state the reward: e.g. `Watch ad — 2x offline Feathers`.

### Responsive rules
- Portrait mobile: pigeon/world upper ~55–65%, upgrades as bottom sheet/drawer.
- Landscape/desktop: pigeon/world center-left, upgrade rail/panel right or bottom depending viewport.
- Never place critical tap area beneath sticky ad-safe regions.

## 8. VFX & Animation Style

### Tap feedback
Target total peck cycle: ~120–190 ms depending combo state.
- head jab;
- body squash/recoil;
- feather/crumb particle;
- floating value;
- tiny impact pulse.

### Combo escalation
Use layers of intensity rather than spawning unlimited particles:
- tier 1: faster motion;
- tier 2: stronger floating-number treatment;
- tier 3: wing motion + limited particles;
- tier 4: restrained screen shake + aura/hit streak;
- max tier: short controlled visual burst, never unreadable strobing.

### Growth event
- brief anticipation pause;
- scale/silhouette transition;
- camera reframe;
- environment reaction;
- milestone title;
- audio stinger.

### Performance
Pool recurring particles and floating numbers. Cap simultaneous decorative particles. Prefer sprite/tween effects over expensive full-screen filters on low-end mobile.

## 9. Asset Standards

### Source/runtime formats
- Master raster source: PNG with alpha where editable transparency is required.
- Runtime raster: WebP with alpha when quality/size is acceptable.
- Use sprite atlases for small accessories, icons and repeated VFX.
- SVG allowed for simple UI icons/logos only when rasterization/performance remains predictable; do not build the runtime world as SVG-heavy placeholder art.

### Resolution targets
- Base pigeon body master: 1024×1024 minimum working canvas per major body tier.
- Large hero/mutation masters: 1536–2048 px where needed for zoom/reframe.
- Accessories: authored against the same normalized pigeon anchor canvas.
- UI icons: 128–256 px source depending prominence.
- Atlas target: prefer <=2048×2048 pages for broad mobile compatibility and memory predictability; split logically by loading group.

### Naming
`[category]_[subject]_[tier-or-variant]_[state].[ext]`

Examples:
- `char_pigeon_body_t02_idle.webp`
- `char_pigeon_beak_t03_default.webp`
- `acc_swag_glasses_v02.webp`
- `env_park_bench_broken_02.webp`
- `vfx_tap_crit_01.webp`
- `ui_upgrade_beak_icon.webp`

### Anchor discipline
All modular pigeon parts must use documented pivot/anchor positions so they can be swapped without per-asset manual offsets. Maintain a canonical attachment manifest for head, beak, wings, neck, body and feet.

### Loading groups
Initial load should include only onboarding/main-screen essentials. Later growth tiers, zones, mutation art and event assets are lazy-loaded before their first use.

## 10. Style Prohibitions

Do not:
- mix photorealistic pigeon photography with flat cartoon accessories without a unifying treatment;
- make every milestone a random costume swap;
- use tiny detail as the only signal of a meaningful upgrade;
- rely on glow everywhere to imply value;
- cover the pigeon with UI;
- use excessive screen shake or flashing during sustained tapping;
- create production screens from generic dark flat panels with placeholder SVG art;
- recreate recognizable protected meme artwork/branding one-to-one;
- make late-game surrealism appear before ordinary city scale has been established.

## 11. Asset Production Workflow

1. Lock canonical base pigeon pose and anchor canvas.
2. Produce body/growth silhouette tiers.
3. Produce branch milestone layer sets against the canonical anchors.
4. Produce environment reaction states tied to growth thresholds.
5. Produce VFX sprite/particle assets.
6. Export runtime WebP/atlases.
7. Validate at actual phone-size gameplay scale.
8. Validate composition combinations (not only assets in isolation).
9. Reject assets that only look good as large concept art but fail in runtime.

## 12. Art Acceptance Test

A milestone asset passes only if:
- the change is noticeable within ~1 second at target phone size;
- it remains visually coherent with at least two other simultaneous branch upgrades;
- it does not obscure tap feedback or growth meter hierarchy;
- it conforms to canonical pivots/anchors;
- its runtime cost fits loading/memory targets;
- it communicates progression without requiring explanatory text.
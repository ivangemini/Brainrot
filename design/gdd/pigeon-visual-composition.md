# Pigeon Visual Composition

> **Status**: Designed v0.1
> **Last Updated**: 2026-08-27
> **Implements Pillars**: Every Upgrade Shows; Absurdity Escalates From Reality
> **Art source of truth**: `design/art/art-bible.md`

## 1. Overview

The player's pigeon is assembled at runtime from composable art layers selected by growth stage, upgrade milestones, mutation state and a small number of transient effects. This system prevents the content explosion of drawing one full pigeon for every combination while ensuring that meaningful mechanical progress remains visible.

Major Growth Stages can replace the base body/silhouette and recompose the camera/environment. Branch milestones layer specific changes on top of the current body tier.

## 2. Player Fantasy

The pigeon on screen is a visual record of the player's build. A player should be able to look at it and recognize that they invested in Beak, Body, Swag, Wings, Nest or Brain without opening a stat screen.

The system should also create screenshot-worthy combinations naturally rather than through a separate character creator.

## 3. Detailed Rules

### 3.1 Canonical layer stack

Stable semantic slots:
1. `shadow`
2. `rearAura`
3. `rearWing`
4. `body`
5. `bellyOverlay`
6. `legs`
7. `frontWing`
8. `head`
9. `eyes`
10. `beak`
11. `neckAccessory`
12. `bodyAccessory`
13. `faceAccessory`
14. `headAccessory`
15. `frontAura`
16. `impactOverlay`

A slot may be empty. Asset IDs are resolved through tuning/visual mapping data.

### 3.2 Canonical anchors

Each body tier defines normalized attachment anchors:
- head center;
- beak root;
- rear/front wing root;
- neck accessory origin;
- chest/body accessory origin;
- face origin;
- head accessory origin;
- left/right foot positions;
- shadow footprint.

Branch assets are authored against these anchors. Runtime may apply small data-driven offsets per body tier, but no feature code may contain arbitrary pixel fixes for individual accessories.

### 3.3 Growth vs branch visuals

Growth owns:
- base body/silhouette tier;
- global scale target;
- camera framing profile;
- environment reaction profile;
- shadow/ground relationship.

Branches own:
- Beak: beak state + hit effect state;
- Body: body detail/muscle/mass overlay within the current growth silhouette;
- Wings: wing tier/motion treatment;
- Swag: accessory/aura state;
- Nest: environmental nest/food/helper prop state;
- Brain: technology/business/helper prop state.

A branch must not replace the whole pigeon merely to show a level milestone unless it is a mutation or Growth Stage.

### 3.4 Visual milestone resolution

For each branch, select the highest unlocked milestone state not superseded by a mutation-specific mapping.

Example:
- Beak Lv 1–4 -> `beak.tier0`
- Lv 5–9 -> `beak.tier1`
- Lv 10–24 -> `beak.tier2`
- Lv 25–49 -> `beak.tier3`
- etc.

Numeric levels between art states use animation/VFX intensity or subtle procedural treatment, not unique sprite files.

### 3.5 Mutation overrides

Mutation mappings can:
- replace a slot asset;
- add a modifier layer;
- change a palette/accent treatment;
- select a branch-specific alternate tier.

They cannot silently erase the visual evidence of unrelated branch investment. Example: a Business mutation may give formal clothing, but high Beak still remains visually advanced.

### 3.6 Environment reaction

Growth Stage emits a semantic environment profile such as:
- `park.normal`
- `park.bench-bending`
- `park.bench-broken`
- `street.human-scale`
- `street.car-scale`
- `downtown.building-scale`

The scene resolves this profile into background/prop layers. This keeps Growth domain state independent of specific filenames.

### 3.7 Animation

Frequent animation is procedural/tween-driven:
- idle bob;
- peck/jab;
- body squash/recoil;
- wing flare;
- accessory secondary motion where cheap;
- growth anticipation/settle.

Frame-by-frame sprite sequences are reserved for special reveals/effects where they materially improve quality.

### 3.8 Quality tiers

Runtime can reduce:
- decorative particles;
- aura filter complexity;
- secondary helper animation frequency;
- background parallax layers.

It cannot remove progression-critical visual layers or make milestone state ambiguous.

## 4. Formulas

### Stage scale
Growth data provides an authored scale/framing profile. Rendering interpolates smoothly:

`displayScale(t) = lerp(previousStageScale, targetStageScale, easing(t))`

Do not derive every Growth Stage from one exponential scale equation; later stages need composition-specific framing.

### Milestone selection

`visualTier(branch) = max(tier where branchLevel >= tier.minLevel)`

### Runtime transform

Each slot transform is conceptually:

`worldTransform = bodyTransform × anchorTransform × slotOffset × animationTransform`

where slot offsets come from validated attachment data, not gameplay code.

## 5. Edge Cases

- Asset for current tier not loaded: retain previous valid tier until load completes; never show missing texture.
- Asset load fails: safe fallback to base/previous tier and log telemetry/dev error.
- Two milestone changes same transaction: batch into one visual refresh after domain state settles.
- Growth body swap invalidates accessory alignment: body tier cannot ship until attachment manifest passes combination checks.
- Mutation + Growth simultaneously: Growth body change first, then re-resolve mutation/branch slots on new anchors.
- Very large pigeon clips UI: scene/camera owns safe composition bounds; DOM UI never assumes a fixed pigeon bounding box.
- Reduced motion mode: skip or shorten growth/tap motion while preserving state change.
- Low-end mode: disable optional filters, not core visual upgrades.

## 6. Dependencies

Upstream:
- Progression Economy — branch levels, growth stage, mutations.
- Tuning & Content Data — semantic visual mappings.
- Art Bible — style, asset standards, layer grammar.

Downstream:
- Main HUD / preview panels;
- VFX / Animation Feedback;
- Collection reveal/snapshot logic;
- Pigeon Events where the main pigeon participates;
- World/Zone presentation.

## 7. Tuning Knobs

- visual milestone level mapping per branch;
- body tier per Growth Stage;
- authored stage scale/framing profile;
- attachment offsets per body tier;
- idle/peck animation duration;
- squash amount;
- wing flare amount;
- aura intensity;
- particle quality caps;
- camera easing and growth reveal duration;
- environment reaction profile mapping.

## 8. Acceptance Criteria

- [ ] Pigeon can be assembled from semantic slot IDs with no portal/gameplay dependency.
- [ ] Every major branch milestone in the MVP has a defined visible consequence.
- [ ] Growth Stage changes body/framing/environment semantics rather than only multiplying a sprite scale forever.
- [ ] All modular assets use canonical anchors/attachment manifests.
- [ ] At least 20 representative multi-branch combinations can render without obvious clipping/misalignment before production art pass is accepted.
- [ ] Missing optional asset fails gracefully to a valid previous/base state.
- [ ] Reduced-motion and low-quality modes preserve progression readability.
- [ ] Presentation can refresh multiple milestone changes atomically without flickering through intermediate invalid compositions.

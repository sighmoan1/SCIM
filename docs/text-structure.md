# Text-first SCIM structure

SCIM diagrams must be interpretable without looking at an image.

The language therefore separates three things which are often accidentally mixed together:

1. **Semantic structure** — what exists, what it supports, and how it depends on other things.
2. **Scenario structure** — what changes from the baseline and why.
3. **View structure** — how a particular diagram places and draws the semantic model.

An AI must be able to ignore every coordinate and still explain the infrastructure system correctly.

## Semantic structure

The semantic structure is declared by:

- the model perspective and focus;
- entities, their kinds, locality/control layers, supported needs, failure modes, attributes and evidence;
- directed relationships from provider or enabler to receiver;
- relationship kinds, delivery modes, criticality, service effects, attributes and evidence;
- scenarios as explicit changes to the baseline.

For example:

```scim
entity grid "Regional electricity grid" {
  kind: power
  layer: region
  failure-modes: [operators, system-externalities, violence-or-disaster]
}

entity hospital "District hospital" {
  kind: healthcare
  layer: municipality
  supports: [injury, illness]
}

grid -> hospital {
  id: grid-hospital
  kind: supplies
  mode: grid
  critical: true
  service-effects: [provision, quality]
}
```

This text means that `grid` provides or enables a critical service to `hospital`. It remains meaningful without a radial map, coordinates, colours or SVG.

## View structure

A frozen view adds a reproducible presentation:

```scim
view main radial "Hospital resilience" {
  renderer: scim-radial-1
  layout: frozen
  canvas: 1000 1000
  centre: 500 500
  ring municipality radius 250
  ring region radius 310
  place hospital at 370 420 size 120 40
  place grid at 700 330 size 120 36
  route grid-hospital via 700 330, 520 360, 370 420
}
```

The view does not create semantic facts. In particular:

- placing an entity in a ring does not replace its declared `layer`;
- placing an entity near a sector does not assert that it supports that need;
- drawing two nodes near one another does not create a dependency;
- line shape, colour and proximity do not change relationship meaning;
- moving a node does not change the infrastructure model.

## Text-only structural reading

The application can generate a deterministic structural reading which lists:

- all entities and their semantic properties;
- all directed relationships as `provider -> receiver`;
- all scenario changes;
- all view rings, sectors, placements, routes and INAM cells as text;
- interpretation rules which prevent an AI from treating layout as hidden meaning.

This structural reading is included in **Copy for AI** and the exported AI handoff. It is a generated aid; the fenced `scim` block remains the authoritative source.

## Deliberate uncertainty

A diagram must not hide unresolved logic.

For example, two incoming power relationships might mean:

- both are required;
- either is sufficient;
- one is primary and one is backup;
- each supports a different service or capacity level.

SCIM does not infer that logic from how the lines are drawn. Until typed dependency-group semantics are declared, an AI must describe the logic as unspecified, ask a question, or submit an explicit proposal rather than silently choosing an interpretation.

## Portability test

A SCIM document passes the text-first portability test when an AI can, using only the text:

1. identify the focus and perspective;
2. list the entities and locality/control layers;
3. trace every directed service or dependency chain;
4. identify which human, group, organisational or state needs are supported;
5. identify failure modes, service effects and scenario changes;
6. distinguish semantic assertions from visual placement;
7. reproduce a frozen view when asked, without inventing structure from geometry.

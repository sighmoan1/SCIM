# Text-first SCIM structure

SCIM diagrams must be interpretable without looking at an image.

The language separates three things which are often accidentally mixed together:

1. **Semantic structure** — what exists, what it supports and how it depends on other things.
2. **Scenario structure** — what changes from the baseline and why.
3. **View structure** — how a particular diagram places and draws the semantic model.

An AI must be able to ignore every coordinate and still explain the infrastructure system correctly.

## Semantic structure

Semantic structure is declared by:

- model perspective and focus;
- entities, kinds, locality/control layers, supported needs, failure modes, attributes and evidence;
- directed relationships from provider or enabler to receiver;
- relationship kinds, delivery modes, criticality, service effects, attributes and evidence;
- explicit dependency requirements;
- scenarios as changes to the baseline.

Example:

```scim
entity grid "Regional electricity grid" {
  kind: power
  layer: region
  failure-modes: [operators, system-externalities, violence-or-disaster]
}

entity generator "Hospital backup generator" {
  kind: power
  layer: municipality
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
  requirement-group: hospital-power
  requirement-service: electricity
  requirement-policy: any
  minimum-available: 1
  when-unsatisfied: failed
}

generator -> hospital {
  id: generator-hospital
  kind: backup-for
  mode: on-site
  critical: true
  requirement-group: hospital-power
  requirement-service: electricity
  requirement-policy: any
  minimum-available: 1
  when-unsatisfied: failed
}
```

This text means:

- the grid and generator provide or enable electricity for the hospital;
- the hospital supports injury and illness needs;
- the hospital needs at least one of the two declared provider paths;
- a failed grid alone does not make the hospital power requirement unsatisfied;
- no coordinates, colours, rings or SVG are required to reach those conclusions.

## Scenario structure

A scenario is an explicit set of changes to the semantic baseline:

```scim
scenario grid-outage "Regional grid outage" {
  set grid status failed
  set relationship grid-hospital status failed
}
```

Scenario operations are not hidden in alternative node positions or colours. The application can apply them, evaluate requirements and explain propagated status changes.

## View structure

A frozen view adds reproducible presentation:

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
- moving a node does not change the infrastructure system;
- multiple incoming lines do not define a dependency policy.

## Text-only structural reading

The application generates a deterministic structural reading listing:

- model perspective and focus;
- all entities and semantic properties;
- all directed relationships as `provider -> receiver`;
- explicit requirement groups and current satisfaction state;
- all scenario changes;
- all view rings, sectors, placements, routes and INAM cells as text;
- interpretation rules preventing layout from becoming hidden meaning.

This reading is included in **Copy for AI** and the exported AI handoff. It is a generated aid; the fenced `scim` block remains authoritative.

## Deliberate uncertainty

A diagram must not hide unresolved logic.

Two incoming power relationships might mean:

- both are required;
- either is sufficient;
- one is primary and one is backup;
- each supports a different service;
- a minimum combined capacity is required.

SCIM 0.2 can express provider-count logic through requirement groups with `all`, `any` or `at-least` policies.

When no requirement group is declared, the combination logic remains unspecified. An AI must describe that uncertainty, ask a question or submit a proposal instead of guessing from line placement, labels or proximity.

Capacity, time, stocks and quality thresholds remain outside the current requirement engine and must not be inferred.

## Semantic versus visual changes

Examples of semantic changes:

- add a water supplier;
- change a relationship from non-critical to critical;
- declare that either of two generators is sufficient;
- add a scenario status operation;
- attach evidence or a failure mode.

Examples of view-only changes:

- move a hospital node;
- resize a visible node;
- change an explicit route;
- change ring radius or sector angle;
- switch to another renderer profile.

The review workflow reports semantic, scenario and view operations separately.

## Portability test

A SCIM document passes the text-first portability test when an AI can, using only text:

1. identify the focus and perspective;
2. list entities and locality/control layers;
3. trace every directed service or dependency chain;
4. identify supported individual, group, organisational or state needs;
5. identify failure modes, service effects and scenario changes;
6. evaluate declared all/any/minimum dependency requirements;
7. state where dependency logic remains unspecified;
8. distinguish semantic assertions from visual placement;
9. explain scenario and propagated changes without relying on colour;
10. reproduce a frozen view when asked without inventing structure from geometry.

## Contributor rule

Any new semantic concept must appear in:

- canonical schema or a documented typed extension;
- portable SCIM text;
- the structural reading;
- AI interpretation instructions;
- validation and tests.

A concept that exists only as a visual cue is not yet part of the SCIM model.
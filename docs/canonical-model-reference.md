# Canonical `ScimDocument` reference

Status: descriptive reference for SCIM schema 0.2. The executable source of truth is `lib/scim/schema.ts`; the portable grammar is documented in [`scim-language.md`](scim-language.md).

## Document

```ts
interface ScimDocument {
  schemaVersion: "0.2";
  id: string;
  title: string;
  description: string;
  perspective: ScimPerspective;
  focusEntityId?: string;
  entities: ScimEntity[];
  relationships: ScimRelationship[];
  scenarios: ScimScenario[];
  views: ScimView[];
}
```

| Field | Meaning |
| --- | --- |
| `schemaVersion` | portable schema version; exactly `0.2` in the current implementation |
| `id` | stable model ID |
| `title` | human-readable model title |
| `description` | model scope and context |
| `perspective` | individual, group, organisation, nation-state or integrated |
| `focusEntityId` | optional principal entity being protected or analysed |
| `entities` | semantic objects |
| `relationships` | directed provider/enabler-to-receiver connections |
| `scenarios` | changes to the baseline |
| `views` | radial or INAM presentations |

The focus ID must refer to an existing entity.

## Identifier conventions

Controlled and extensible vocabulary identifiers use:

```text
^[a-z0-9][a-z0-9-]*$
```

They contain lowercase letters, numbers and hyphens and cannot start with a hyphen.

Object IDs such as entity and relationship IDs are currently validated as non-empty strings, but portable SCIM should follow the same lowercase-hyphen convention for predictable exchange.

Stable IDs should not be renamed merely to improve display wording.

## Standard vocabularies

### Layers

- `individual`
- `household`
- `neighbourhood`
- `municipality`
- `region`
- `country`
- `world`

### Immediate threats / individual needs

- `injury`
- `illness`
- `thirst`
- `hunger`
- `too-cold`
- `too-hot`

### Additional standard needs

- `communications`
- `transport`
- `space`
- `resource-control`
- `shared-map`
- `shared-plan`
- `shared-succession`
- `jurisdiction`
- `citizens`
- `territory`
- `effective-organisations`
- `international-recognition`

### Failure modes

- `neglect`
- `time-and-wear`
- `operators`
- `system-externalities`
- `economics`
- `violence-or-disaster`

### Service effects

- `provision`
- `cost`
- `quality`

All these vocabularies permit extensions that follow identifier syntax.

## Perspectives

```ts
type ScimPerspective =
  | "individual"
  | "group"
  | "organisation"
  | "nation-state"
  | "integrated";
```

The perspective frames the model. It does not restrict which entities may appear.

## Status

```ts
type EntityStatus = "normal" | "degraded" | "failed" | "new";
```

The same status vocabulary is currently used for entities and relationships.

- `normal` — available under baseline assumptions;
- `degraded` — partly functioning or reduced;
- `failed` — unavailable for dependency evaluation;
- `new` — introduced by a scenario or proposal.

A future schema may separate lifecycle, proposal and operating status more precisely.

## Delivery mode

```ts
type DeliveryMode = "on-site" | "grid" | "delivery" | "fetch" | "other";
```

Delivery mode describes how a service or resource reaches the receiver.

## Evidence

```ts
interface Evidence {
  source: string;
  note?: string;
  confidence?: number;   // 0 to 1
  observedAt?: string;   // ISO date-time
}
```

Evidence attaches support to a semantic claim. It is not currently attached to individual attributes, so collaborators should explain clearly which claim an evidence record supports.

## Entity

```ts
interface ScimEntity {
  id: string;
  name: string;
  description: string;
  kind: string;
  layer: string;
  status: EntityStatus;
  supportsNeeds: string[];
  protectsAgainst: string[];
  failureModes: string[];
  attributes: Record<string, unknown>;
  evidence: Evidence[];
}
```

### `id`

Stable reference used by relationships, scenarios and views.

### `name`

Human-readable label. Change this rather than changing the stable ID for wording improvements.

### `description`

Scope, role or limitations of the entity.

### `kind`

Extensible category such as `person`, `healthcare`, `power`, `water` or `communications`.

### `layer`

Semantic locality/control level. This remains authoritative even when a radial view places the entity inside a ring.

### `status`

Baseline or simulated operating state.

### `supportsNeeds`

Needs directly supported by the entity.

### `protectsAgainst`

Deprecated compatibility alias from the first schema. New models should use `supportsNeeds`. Parsers and structural readers currently preserve both.

### `failureModes`

Ways the entity may degrade or fail.

### `attributes`

Typed extensions not yet promoted to first-class schema fields. Values may be strings, numbers, booleans, arrays, objects or null where parser support preserves them.

Use namespaced or unambiguous attribute names. Do not put essential meaning into an undocumented arbitrary attribute.

### `evidence`

Evidence supporting the entity’s declared properties.

## Relationship

```ts
interface ScimRelationship {
  id: string;
  from: string;
  to: string;
  kind: string;
  deliveryMode?: DeliveryMode;
  status: EntityStatus;
  critical: boolean;
  serviceEffects: string[];
  attributes: Record<string, unknown>;
  evidence: Evidence[];
}
```

### Direction

`from` is the provider or enabler. `to` is the receiver.

A relationship cannot refer to a missing entity.

### `kind`

Extensible semantic type. Common values include:

- `depends-on`
- `supplies`
- `backup-for`
- `protects`
- `communicates-with`
- `transports`

### `deliveryMode`

How the service reaches the receiver.

### `critical`

Marks the relationship as important to operation or protection. It does not by itself state whether all, any or a minimum number of incoming providers are required.

### `serviceEffects`

The provision, cost or quality dimensions affected by the relationship.

### `attributes`

Current dependency requirement semantics use typed relationship attributes:

| Attribute | Meaning |
| --- | --- |
| `requirement-group` | stable group ID shared by provider relationships for one target requirement |
| `requirement-service` | service being required, such as `electricity` |
| `requirement-policy` | `all`, `any` or `at-least` |
| `minimum-available` | provider threshold for `at-least`, or an explicit threshold for other policies |
| `when-unsatisfied` | target status when the requirement is not met, currently `degraded` or `failed` |

These attributes should be promoted to a first-class requirement object in a later schema without changing their semantics.

### `evidence`

Evidence that the relationship exists or has the declared properties.

## Scenario

```ts
interface ScimScenario {
  id: string;
  name: string;
  description: string;
  changes: ScenarioChange[];
  createdAt?: string;
  modifiedAt?: string;
}
```

A scenario is an ordered list of changes against the baseline.

### Scenario operations

#### Set entity status

```ts
{
  operation: "set-entity-status";
  entityId: string;
  status: EntityStatus;
}
```

#### Set relationship status

```ts
{
  operation: "set-relationship-status";
  relationshipId: string;
  status: EntityStatus;
}
```

#### Add entity

```ts
{
  operation: "add-entity";
  entity: ScimEntity;
}
```

#### Add relationship

```ts
{
  operation: "add-relationship";
  relationship: ScimRelationship;
}
```

Scenario validation follows changes in order. An added entity may be referenced by a later change. Duplicate additions and missing references are rejected.

The current schema has no remove operation, timestamp per event or resource transfer. These are roadmap items.

## Geometry primitives

### Point

```ts
interface ScimPoint {
  x: number;
  y: number;
}
```

Coordinates must be finite.

### Canvas

```ts
interface ScimCanvas {
  width: number;   // > 0 and <= 10000
  height: number;  // > 0 and <= 10000
}
```

## Radial view

```ts
interface ScimRadialView {
  id: string;
  name: string;
  type: "radial";
  renderer: "scim-radial-1";
  layout: "automatic" | "frozen";
  canvas: ScimCanvas;
  centre: ScimPoint;
  showSegments: boolean;
  rings: ScimRing[];
  sectors: ScimSector[];
  nodes: ScimNodePlacement[];
  routes: ScimRelationshipRoute[];
}
```

### Ring

```ts
interface ScimRing {
  layer: string;
  radius: number;
  labelAngle: number; // default -90
}
```

Each layer may appear only once in a view.

### Sector

```ts
interface ScimSector {
  need: string;
  angle: number; // >= 0 and < 360
}
```

Each need may appear only once in a view.

### Node placement

```ts
interface ScimNodePlacement {
  entityId: string;
  x: number;
  y: number;
  width: number;  // default 100
  height: number; // default 36
}
```

Each entity may have only one placement in a radial view. The entity must exist.

### Relationship route

```ts
interface ScimRelationshipRoute {
  relationshipId: string;
  points: ScimPoint[]; // at least two
}
```

Each relationship may have only one explicit route in a radial view. The relationship must exist.

## INAM view

```ts
interface ScimInamView {
  id: string;
  name: string;
  type: "inam";
  renderer: "scim-inam-1";
  rowNeeds: string[];
  columns: string[];
  cells: ScimInamCell[];
}
```

Rows and columns must be non-empty and contain no duplicate values.

### INAM cell

```ts
interface ScimInamCell {
  rowNeed: string;
  column: string;
  entityIds: string[];
  note?: string;
}
```

The row and column must be declared by the view. Every entity ID must exist.

## Document-level validation

The canonical schema rejects:

- duplicate object IDs within entities, relationships, scenarios or views;
- unknown focus entity;
- relationships with missing endpoints;
- scenario references to missing objects;
- duplicate or conflicting additions inside a scenario;
- radial nodes for missing entities;
- radial routes for missing relationships;
- duplicate radial node, route, ring or sector declarations;
- INAM cells using undeclared rows or columns;
- INAM cells referring to missing entities;
- invalid controlled values, numbers or date-times.

## Boundary rule

Parse and validate at every boundary:

- file import;
- pasted AI response;
- local-storage load;
- scenario result;
- selective proposal acceptance;
- legacy adapter output;
- export preparation.

Internal UI state may be temporarily incomplete while a form is being edited, but it must not become accepted workspace state until the complete document validates.

## Compatibility notes

- `protectsAgainst` remains for compatibility but should not be expanded as a second need model.
- Requirement metadata currently lives in relationship attributes.
- `automatic` radial layout is represented in schema, but exact portable diagrams require `frozen` geometry.
- Application release 0.5.0 still uses schema 0.2.
- Renderer behaviour is specified separately in [`scim-radial-1.md`](scim-radial-1.md).
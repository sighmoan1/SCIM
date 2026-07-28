# SCIM portable language

Status: draft language version 0.2

SCIM is not a generic flowchart notation. It is a compact language for describing how infrastructure and social organisation keep people safe, how those systems depend on one another, and what happens when services degrade or fail.

The language is designed for three equal uses:

1. people editing a model directly;
2. the SCIM application rendering and simulating it;
3. people pasting the same text into an AI conversation and receiving a reviewable model, scenario or diagram back.

## 1. SCIM concepts

### 1.1 Individual needs: the six ways to die

SCIM begins with six immediate threats to human life, grouped into three service families:

| Family | Needs / threats |
| --- | --- |
| Shelter | `too-hot`, `too-cold` |
| Supply | `hunger`, `thirst` |
| Safety | `illness`, `injury` |

An infrastructure entity may support one or more of these needs. A service chain should ultimately be traceable to the people or groups it protects.

### 1.2 Locality and control layers

The standard SCIM layers are:

1. `individual`
2. `household`
3. `neighbourhood`
4. `municipality`
5. `region`
6. `country`
7. `world`

The original terms “village”, “town / city” and “international” are accepted aliases. The layer records the practical level at which a resource is owned, controlled or supplied; it is not merely a drawing ring.

### 1.3 Cooperation perspectives

SCIM can map four tiers of cooperation:

- `individual`
- `group`
- `organisation`
- `nation-state`

Their standard needs are:

| Perspective | Standard needs |
| --- | --- |
| Individual | `too-hot`, `too-cold`, `hunger`, `thirst`, `illness`, `injury` |
| Group | `communications`, `transport`, `space`, `resource-control` |
| Organisation | `shared-map`, `shared-plan`, `shared-succession` |
| Nation state | `jurisdiction`, `citizens`, `territory`, `effective-organisations`, `international-recognition` |

An `integrated` model may combine all four perspectives.

### 1.4 Failure and service vocabularies

Standard infrastructure failure modes are:

- `neglect`
- `time-and-wear`
- `operators`
- `system-externalities`
- `economics`
- `violence-or-disaster`

Standard service effects are:

- `provision` — whether the service is available;
- `cost` — whether the service remains affordable;
- `quality` — whether the service remains safe and adequate.

Standard delivery paths are:

- `on-site`
- `grid`
- `delivery`
- `fetch`

These are semantic fields, not decorative labels. They are available to scenario reasoning and resilience analysis.

## 2. File and block format

The portable document format is Markdown with one fenced `scim` block:

~~~markdown
# Hospital resilience

Narrative, assumptions, evidence and open questions may live here.

```scim
model hospital-resilience "Hospital resilience" {
  perspective: individual
  focus: patient

  entity patient "Patient" {
    kind: person
    layer: individual
  }
}
```
~~~

The fenced block is the machine-readable source of truth. Narrative outside the block is useful context but MUST NOT silently alter the model.

Language version 0.2 supports exactly one fenced SCIM model per Markdown document.

Identifiers use lowercase letters, numbers and hyphens. They are stable references and SHOULD NOT be renamed merely to improve wording.

## 3. Core grammar

### 3.1 Model

```scim
model hospital-resilience "Hospital resilience" {
  perspective: individual
  focus: patient
  description: "Minimum services required to protect a hospital patient."
}
```

`perspective` is one of the four cooperation perspectives or `integrated`. `focus` identifies the principal person, group, organisation or state being protected.

### 3.2 Entities

```scim
entity hospital "District Hospital" {
  kind: healthcare
  layer: municipality
  supports: [injury, illness]
  failure-modes: [operators, system-externalities]
  beds: 180
  emergency-capable: true
}
```

Unknown properties are preserved as extension attributes when their values use the portable SCIM 0.2 value subset:

- string;
- number;
- boolean;
- list of strings.

The canonical JSON schema permits richer unknown values, but nested objects, null values and mixed nested arrays are not losslessly represented by the current DSL parser and serializer. See [`implementation-status.md`](implementation-status.md).

The canonical entity schema also contains an `evidence` array. SCIM DSL 0.2 does not yet define first-class evidence syntax, so evidence is currently canonical-JSON-only and is not preserved by a DSL round trip.

### 3.3 Relationships

```scim
grid -> hospital {
  id: grid-hospital
  kind: supplies
  mode: grid
  critical: true
  service-effects: [provision, quality]
}
```

The arrow points from the providing or enabling entity to the receiving entity. The renderer MUST preserve this direction.

Relationship extension attributes use the same portable scalar and string-list value subset as entity attributes.

The canonical relationship schema contains an `evidence` array, but SCIM DSL 0.2 does not yet have first-class relationship evidence syntax.

### 3.4 Explicit dependency requirements

Several incoming relationships do not by themselves define whether every provider is required, any provider is sufficient, or a minimum threshold is needed.

SCIM 0.2 declares this through consistent relationship attributes:

```scim
grid -> hospital {
  id: grid-hospital
  kind: supplies
  critical: true
  requirement-group: hospital-power
  requirement-service: electricity
  requirement-policy: any
  minimum-available: 1
  when-unsatisfied: failed
}

generator -> hospital {
  id: generator-hospital
  kind: backup-for
  critical: true
  requirement-group: hospital-power
  requirement-service: electricity
  requirement-policy: any
  minimum-available: 1
  when-unsatisfied: failed
}
```

Supported policies are:

- `all` — every relationship in the group must be available;
- `any` — at least one relationship must be available;
- `at-least` — at least `minimum-available` relationships must be available.

All relationships in one group should point to the same target and declare consistent policy, threshold, service and unsatisfied status.

Incoming relationships without `requirement-group` remain logically unspecified. A person or AI must not infer AND/OR semantics from layout.

### 3.5 Scenarios

```scim
scenario grid-failure "Regional grid failure" {
  description: "The regional electricity service is unavailable."
  set grid status failed
  set relationship grid-hospital status failed
  set hospital status degraded
}
```

A scenario is a set of changes to the baseline. It does not copy the entire map.

Supported operation forms include:

```scim
set entity-id status failed
set relationship relationship-id status failed
add entity new-id "New service" kind service layer municipality
add relationship provider -> receiver id new-link kind supplies critical true
```

Complex added entities and relationships may be serialised as JSON-bearing scenario statements by the current implementation.

The canonical scenario schema accepts optional created and modified timestamps, but SCIM DSL 0.2 does not currently parse or emit them.

### 3.6 Views

The semantic model and visual layout are separate. A document may contain multiple views.

```scim
view main radial "Individual SCIM" {
  renderer: scim-radial-1
  layout: frozen
  canvas: 1000 1000
  centre: 500 500
  segments: true

  ring individual radius 70
  ring household radius 130
  ring neighbourhood radius 190
  ring municipality radius 250
  ring region radius 310
  ring country radius 370
  ring world radius 430

  sector injury angle 210
  sector illness angle 270
  sector thirst angle 330
  sector hunger angle 30
  sector too-hot angle 90
  sector too-cold angle 150

  place patient at 500 500 size 100 36
  place hospital at 350 410 size 120 36
  place grid at 700 330 size 120 36

  route grid-hospital via 700 330, 520 360, 350 410
}
```

A radial view uses explicit SCIM units in an SVG-style canvas. The application scales the canvas responsively but does not alter its internal geometry.

`layout: automatic` is accepted by the current schema, but an automatic layout algorithm is not yet implemented. Portable diagrams should use `layout: frozen` and declare every visible placement.

An INAM view fixes row and column order and records the entities present in each cell:

```scim
view national-inam inam "Integrated Needs Analysis" {
  renderer: scim-inam-1
  rows: [injury, illness, thirst, hunger, too-cold, too-hot]
  columns: [individual, household, neighbourhood, municipality, region, country, world, specific-entities]
  cell injury municipality: [hospital, police]
  cell too-cold region: [power-station]
}
```

The canonical INAM cell schema accepts an optional note, but current SCIM 0.2 `cell` syntax does not parse or emit it.

## 4. Portable value grammar

The current portable attribute value grammar is deliberately small.

### Strings

A simple identifier-like string may be unquoted:

```scim
resource: electricity
```

Other strings use double quotes:

```scim
note: "Requires a verified local source"
```

Current parser limitations mean escaped quotation marks inside declaration titles and commas inside quoted list items are not robustly supported. Keep portable labels simple until the parser is upgraded.

### Numbers

```scim
beds: 180
confidence-percent: 75.5
```

### Booleans

```scim
critical: true
```

### Lists

```scim
supports: [injury, illness]
```

Lists are currently parsed as strings. Nested objects and arrays are outside the lossless DSL 0.2 subset.

## 5. Exact rendering contract

A logical model may be rendered in many useful ways. An identical portable diagram requires a `frozen` view.

A compliant `scim-radial-1` renderer MUST:

1. use the declared canvas as the SVG `viewBox`;
2. preserve the declared centre, ring radii, sector angles, node positions and node sizes;
3. sort sectors by angle and draw each sector from its angle to the next sector angle, wrapping at 360 degrees;
4. draw relationship routes in source-to-target order; a relationship without an explicit route is a straight line between node centres;
5. draw edges before nodes;
6. render nodes as rounded rectangles with a 6-unit corner radius;
7. use 10-unit Arial/Helvetica/sans-serif labels, centred in the node;
8. wrap labels at spaces using a maximum of `floor((node width - 12) / 7)` characters per line and a 12-unit line height;
9. use the status styles defined by the renderer profile rather than inventing new status colours;
10. preserve source order where the specification does not define another ordering rule.

This provides stable geometry and a visually equivalent SVG across the SCIM application and capable chat interfaces. Font rasterisation may vary slightly between operating systems, so the guarantee is layout-equivalent rather than byte-identical pixels.

A `frozen` radial view SHOULD place every visible entity. A compliant renderer SHOULD report missing placements rather than silently generating a different automatic arrangement.

The current renderer validates declared references but presently omits unplaced entities instead of reporting them. This is a documented conformance gap, not intended normative behaviour.

## 6. AI handoff protocol

The application exports a self-contained Markdown handoff. A person can paste it into a chat and ask an AI to review, extend or render the model.

The handoff tells the AI to:

- treat the `scim` block as authoritative;
- read the text-only structural projection before geometry;
- preserve identifiers and frozen geometry unless explicitly asked to change them;
- distinguish facts, assumptions and proposals;
- use explicit dependency requirement policies;
- return a complete updated `scim` block rather than an unstructured description;
- explain every proposed semantic change;
- render frozen radial views according to `scim-radial-1` when SVG or HTML output is supported;
- state clearly when the chat interface cannot render SVG and return the portable source unchanged.

The same handoff can be imported back into SCIM. Human and AI changes therefore pass through one validated language rather than being applied invisibly by a chatbot.

Because evidence is not yet lossless in SCIM DSL 0.2, a handoff containing canonical evidence must be reviewed carefully. The generated structural section may display evidence that the authoritative DSL cannot currently re-encode.

## 7. Canonicalisation

The serializer defines ordering and formatting:

1. model metadata;
2. entities in document order;
3. relationships in document order;
4. scenarios in document order;
5. views in document order.

A tool may reformat whitespace, but MUST preserve IDs, values, source order where defined and frozen geometry.

Portable scalar and string-list extension attributes MUST survive a parse/serialize round trip. Rich canonical JSON attributes, evidence, scenario timestamps and INAM cell notes do not currently have that guarantee in DSL 0.2.

## 8. Implementation conformance

The canonical schema is broader than the currently implemented text grammar in several places. The exact matrix and known gaps are maintained in [`implementation-status.md`](implementation-status.md).

Important current gaps are:

- no first-class evidence syntax;
- no scenario timestamp syntax;
- no INAM cell-note syntax;
- no lossless nested attribute values;
- no automatic layout engine;
- incomplete missing-placement enforcement;
- limited escaped-string and list parsing;
- post-parse schema errors mapped to line 1 rather than exact source lines.

These gaps must be stated honestly and addressed with compatibility decisions and tests.

## 9. Versioning

The language version is the document `schemaVersion`. Renderer profiles are versioned independently, for example `scim-radial-1`.

A breaking grammar or semantic change increments the schema major version. A renderer profile is never silently changed after publication; a revised algorithm receives a new profile identifier.

Application releases may improve editors, collaboration or mobile interaction without changing either schema or renderer version.
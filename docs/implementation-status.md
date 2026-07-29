# Implementation status and known contract gaps

Status: current as of application 0.7.1 and SCIM schema 0.2.

This document distinguishes:

- fields accepted by the canonical Zod schema;
- fields represented by the SCIM DSL parser and serializer;
- fields exposed by the current user interface;
- behaviour required by normative documentation but not yet fully enforced.

It exists so future collaborators do not assume that a schema field is already losslessly portable through every format.

## Capability matrix

| Capability | Canonical schema / JSON | SCIM DSL parse | SCIM DSL serialize | Primary Map UI | Source editor |
| --- | --- | --- | --- | --- | --- |
| model ID, title, description, perspective, focus | yes | yes | yes | reads; limited model editing | yes |
| entity ID, name, description, kind, layer, status | yes | yes | yes | partial editing | yes |
| supported needs and failure modes | yes | yes | yes | supported needs partial | yes |
| entity evidence | yes | **no first-class syntax** | **not emitted** | not exposed | JSON only without manual canonical construction |
| relationship direction, kind, mode, status, criticality | yes | yes | yes | partial creation/deletion | yes |
| relationship service effects | yes | yes | yes | not fully exposed | yes |
| relationship evidence | yes | **no first-class syntax** | **not emitted** | not exposed | JSON only without manual canonical construction |
| scalar extension attributes | yes | yes | yes | limited | yes |
| list-of-string extension attributes | yes | yes | yes | limited | yes |
| nested object or mixed-array attributes | yes | **not lossless** | **not lossless** | not exposed | JSON only |
| scenario set-status operations | yes | yes | yes | preview | yes |
| scenario add-entity/add-relationship | yes | yes | yes | preview | yes |
| scenario created/modified timestamps | yes | **not parsed** | **not emitted** | not exposed | JSON only |
| radial view metadata, rings, sectors, nodes, routes | yes | yes | yes | node positions only | yes |
| automatic radial layout | accepted by schema | yes | yes | no layout engine | renderer uses declared placements only |
| deterministic frozen radial SVG | yes | n/a | n/a | yes | yes |
| complete-placement enforcement | schema validates references | n/a | n/a | not enforced | renderer currently omits unplaced entities |
| explicit INAM rows, columns and cells | yes | yes | yes | source-only authored view; Matrix uses a deterministic projection | source only |
| derived INAM dependency projection | derived | n/a | n/a | direct and upstream providers by need and layer | n/a |
| INAM cell note | yes | **not parsed** | **not emitted** | not exposed | JSON only |
| evidence/confidence in AI structural reading | yes when present canonically | n/a | authoritative DSL currently loses it | no UI authoring | included only if document already contains it |
| explicit dependency requirements | relationship attributes | yes | yes | evaluation display; limited editing | yes |
| human/AI revisions | workspace model | n/a | n/a | shared transactional hook across Home, Emergency, Map, Matrix and More | Review integration; Model not transactionally synced |
| referentially safe deletion | canonical mutation helpers | n/a | n/a | entity and relationship deletion cleans scenarios and views | n/a |
| offline application shell | n/a | n/a | n/a | service worker caches shell and visited resources | n/a |
| automated semantic tests | n/a | n/a | n/a | need status, safe deletion, INAM projection and starter round-trip | n/a |

## Evidence portability gap

`EvidenceSchema` is part of the canonical model:

```ts
{
  source: string;
  note?: string;
  confidence?: number;
  observedAt?: string;
}
```

However, SCIM DSL 0.2 has no first-class evidence statement. The parser initialises empty evidence arrays and the serializer does not emit them.

Consequences:

- canonical JSON can contain evidence;
- `serializeScimStructure` can describe evidence already present in a canonical document;
- `serializeScimDsl` currently drops evidence;
- a parse/serialize round trip through DSL is therefore not lossless for evidence;
- an AI handoff whose authoritative section is DSL cannot currently preserve canonical evidence unless it is redundantly encoded as documented extension attributes.

This must be resolved before claiming end-to-end evidence round-trip support. The preferred fix is explicit portable evidence syntax plus parser, serializer, validation, examples and tests.

## Extension attribute limits

The canonical schema permits `unknown` values in `attributes`.

The current DSL scalar parser supports:

- strings;
- numbers;
- booleans;
- comma-separated lists parsed as strings.

The serializer can format scalar values and arrays, but it does not produce a lossless representation for arbitrary nested objects, null values or mixed nested arrays.

Use scalar or string-list attributes for portable SCIM 0.2. Use canonical JSON only when richer extension data is unavoidable, and treat that as a portability limitation.

A future language version should either:

- define explicit JSON-valued attribute syntax; or
- narrow canonical attributes to the portable value grammar.

## String grammar limits

The parser uses a deliberately small hand-written grammar.

Current limitations include:

- model and entity declarations do not robustly parse escaped quotation marks in names even though the serializer uses JSON quoting;
- list parsing splits on commas and does not support a quoted list item containing a comma;
- object IDs accepted by the schema are broader than the recommended portable lowercase-hyphen convention;
- canonical validation errors produced after parsing are currently reported at line 1 rather than mapped back to exact source lines.

Use simple quoted labels and identifier-safe IDs in portable examples until the parser is upgraded.

## Scenario metadata gap

`ScimScenarioSchema` accepts optional `createdAt` and `modifiedAt` ISO date-times.

The DSL parser and serializer do not currently represent those values. They survive canonical JSON but not SCIM DSL round trips.

The timestamps should either receive explicit syntax or be removed from the portable contract until needed.

## INAM note gap

`ScimInamCellSchema` accepts an optional `note`, but current `cell` syntax serialises only row, column and entity IDs.

Cell notes are therefore canonical-JSON-only in 0.7.1. The primary Matrix is a derived dependency projection and does not silently treat authored cell notes as semantic facts.

## Automatic radial layout gap

`ScimRadialViewSchema` accepts `layout: automatic | frozen`, but no canonical automatic-layout engine is currently implemented.

`serializeScimRadialSvg` renders declared node placements. A view marked `automatic` does not cause missing nodes to be positioned automatically.

Until an algorithm and renderer contract are defined:

- use `frozen` for portable diagrams;
- declare every visible node placement;
- do not rely on `automatic` to produce a complete map.

## Missing-placement enforcement gap

The normative language guidance says a frozen view should place every visible entity and that missing placements should be reported.

The canonical schema currently validates that declared placements refer to real entities, but it does not require every entity to be placed. The renderer skips entities without placements and relationships whose endpoints are not both placed.

This is a known conformance gap. A future fix should provide either:

- strict rendering that throws a descriptive missing-placement error; or
- an explicit per-view visibility declaration making omissions intentional.

Do not interpret omission from a view as deletion from the semantic model.

## Evidence claims in documentation and UI

When describing current capability, use precise language:

- **Canonical schema supports evidence and confidence.**
- **Text-only structure can display canonical evidence.**
- **SCIM DSL 0.2 does not yet preserve evidence losslessly.**
- **The primary visual inspector does not yet author evidence.**

Do not say simply that evidence round trips through SCIM text.

## Source editor and accepted workspace

Home, Emergency, Map, Matrix, More and Review operate over the same browser-local accepted document and revision contract. The Map uses the shared transactional workspace API, including transient pointer previews followed by one accepted revision for the completed gesture.

The Model editor remains an advanced portable source tool. It does not currently provide a fully explicit transaction that loads, compares and replaces the accepted workspace document.

A user can therefore edit valid SCIM text without automatically changing the Map baseline. Future integration should use an explicit reviewed replacement, not silent two-way synchronisation.

## Legacy compatibility limits

Legacy conversion preserves what can be mapped but cannot express every canonical feature.

Potentially lossy areas include:

- perspective and focus;
- supported needs;
- evidence;
- requirement semantics;
- scenarios as operation lists;
- multiple views;
- revision history;
- canonical-only attributes.

Relationship direction also requires human review because legacy lines may encode “depends on” visually in the opposite direction from canonical provider-to-receiver arrows.

## Testing status

GitHub verification currently proves:

- dependency installation;
- Node-native semantic regression tests;
- TypeScript checking;
- production Next.js build.

The current regression suite covers degraded-versus-failed need status, referentially safe deletion, INAM upstream projection and the shipped starter model’s SCIM text round trip. It is not yet a comprehensive browser, accessibility or parser-conformance suite.

## Closing a gap

A pull request closing one of these gaps must update:

1. schema, parser, serializer or renderer as relevant;
2. canonical and language documentation;
3. examples;
4. AI handoff and structural reading where interpretation changes;
5. automated regression tests;
6. roadmap and changelog;
7. schema or renderer version when compatibility requires it.

Remove the gap from this document only after the implementation and verification exist.

# SCIM architecture

## Product decision

SCIM should be easy for people and AI systems to author, while retaining a validated machine-readable model.

The project therefore uses four layers:

1. **SCIM Markdown** — the document people edit. It contains narrative, assumptions, evidence and fenced `scim` blocks.
2. **SCIM DSL** — a compact Mermaid-like notation for entities, dependencies, scenarios and interventions.
3. **Canonical JSON model** — the validated source of truth used by the application, APIs and simulations.
4. **Views** — dependency diagrams, radial SCIM maps, INAM matrices, geographic maps and scenario timelines.

```text
.scim.md document
      ↓ parse
canonical SCIM model
      ├── radial map
      ├── dependency graph
      ├── INAM matrix
      ├── scenario comparison
      └── JSON / Mermaid / DOT export
```

## Core design rules

- Keep domain data separate from visual layout.
- Give every entity and relationship a stable ID.
- Model dependencies as directed relationships.
- Keep scenarios as changes to a baseline model rather than duplicated maps.
- Record evidence, confidence and assumptions alongside claims.
- Treat the six SCIM threats and seven locality layers as controlled vocabularies that may be extended.
- Validate all imported and exported data.
- Preserve round-trip conversion between DSL and JSON.

## Proposed source structure

```text
lib/scim/
  schema.ts       Zod schemas and TypeScript types
  parser.ts       SCIM DSL → canonical model
  serializer.ts   canonical model → SCIM DSL
  simulation.ts   scenario application and failure propagation
  layout.ts       visual coordinates derived from the logical model

examples/
  *.scim.md       executable examples and fixtures
```

## Migration from the current mapper

The existing mapper already contains useful domain concepts, but they currently live inside the React component and mix model state with screen coordinates.

Migration should happen incrementally:

1. Extract the canonical schemas and types.
2. Add adapters from the current export format to the canonical model.
3. Move default SCIM data into fixtures.
4. Make the visual editor consume the canonical model plus a separate layout object.
5. Add the text parser and serializer.
6. Add scenario propagation after round-trip editing is reliable.

## First usable release

A first release should allow a user to:

- open an example `.scim.md` document;
- edit the text and see the map update;
- edit the map and see the text update;
- validate errors with clear line references;
- export canonical JSON, Mermaid and DOT;
- create a scenario that degrades or removes entities and dependencies.

Advanced simulation, real-time collaboration and AI assistance come after this round-trip authoring loop works.
# SCIM architecture

Status: current application architecture for SCIM Mapper v0.5.0 and SCIM schema 0.2.

## Product decision

SCIM is a shared language and workspace for understanding how infrastructure and social organisation protect people, how services depend on one another, what happens under stress, and what interventions could improve resilience.

It is not a generic diagram editor with SCIM labels added afterwards.

The product supports three equal authoring modes:

1. a person editing the accepted model visually;
2. a person editing the model as portable text;
3. a human or AI returning a complete candidate model for review.

All accepted work converges on one validated `ScimDocument`.

## Architectural principles

- **One canonical model.** The visual map, source editor, scenario engine and proposal reviewer use the same schema.
- **Semantics are separate from views.** Entities and relationships say what the system means. Views say how to draw it.
- **Text is complete.** An AI must be able to interpret the model without seeing an image.
- **Stable identifiers.** IDs connect semantics, scenarios, views, revisions and external conversations.
- **Directed dependencies.** Relationships point from provider or enabler to receiver.
- **Scenarios are changes.** A scenario modifies a baseline rather than duplicating a whole map.
- **AI output is a proposal.** No AI response changes accepted state until a person selects and accepts canonical operations.
- **Human and AI provenance share one history.** Revisions record `human` or `ai` origin.
- **Frozen rendering is deterministic.** Published renderer profiles are immutable.
- **Local-first by default.** The browser stores accepted state; external AI disclosure is deliberate.
- **Mobile is first-class.** The primary map uses native Pointer Events for mouse, touch and pen.

## Domain foundation

The canonical vocabulary is grounded in the original SCIM framework:

- six immediate individual needs: too hot, too cold, hunger, thirst, illness and injury;
- three service families: shelter, supply and safety;
- seven locality and control layers from individual to world;
- individual, group, organisation and nation-state perspectives;
- group needs such as communications, transport, space and resource control;
- organisational needs such as shared map, shared plan and shared succession;
- state needs such as jurisdiction, citizens, territory, effective organisations and international recognition;
- infrastructure failure modes;
- provision, cost and quality service effects;
- on-site, grid, delivery and fetch service paths;
- radial SCIM and Integrated Needs Analysis Matrix views.

Extensions are allowed, but they must preserve these distinctions and remain explicit in text.

## Four representation layers

### 1. SCIM Markdown

A portable `.scim.md` document combines human narrative with one authoritative fenced `scim` block.

Narrative may contain evidence, assumptions, rationale and open questions. It does not silently change the model.

### 2. SCIM DSL

The compact Mermaid-like language declares:

- model metadata and perspective;
- entities and their semantic properties;
- directed relationships and dependency requirements;
- scenarios;
- radial and INAM views.

### 3. Canonical `ScimDocument`

The Zod-validated model is the application source of truth. It is used for rendering, simulation, comparison, selective acceptance, persistence and export.

### 4. Versioned views

A model may have multiple views. Current view types are:

- frozen radial view using `scim-radial-1`;
- INAM view data using `scim-inam-1`;
- generated Mermaid and DOT dependency exports.

A view may repeat semantic facts visually, but it must not become the only place those facts exist.

## End-to-end data flow

```text
                    ┌────────────────────────────┐
                    │ Portable SCIM Markdown     │
                    │ narrative + fenced DSL     │
                    └──────────────┬─────────────┘
                                   │ parse
                                   v
┌──────────────────┐      ┌────────────────────────────┐
│ Manual map edits │─────>│ Canonical ScimDocument     │<─────┐
│ native pointers  │      │ Zod validated              │      │
└──────────────────┘      └──────────────┬─────────────┘      │
                                         │                    │
               ┌─────────────────────────┼────────────────┐   │
               │                         │                │   │
               v                         v                v   │
      deterministic radial       scenario engine      exports │
      and other views            and explanations     / handoff│
               │                         │                │   │
               └─────────────────────────┴────────────────┘   │
                                                             │
                    ┌────────────────────────────┐             │
                    │ Human or AI candidate      │             │
                    │ complete model + rationale │             │
                    └──────────────┬─────────────┘             │
                                   │ compare                    │
                                   v                            │
                    ┌────────────────────────────┐             │
                    │ Canonical review operations│             │
                    │ accept / reject / validate │─────────────┘
                    └────────────────────────────┘
```

## Application routes

| Route | Purpose | State behaviour |
| --- | --- | --- |
| `/` | Primary canonical visual map workspace | Loads and saves the accepted browser-local document and revisions |
| `/editor` | Advanced SCIM source authoring, validation, preview and export | Works with portable source; future work should make accepted-state transfer more explicit |
| `/review` | Compare a complete human or AI proposal with the accepted baseline | Loads the shared workspace baseline and commits selected valid operations back to it |
| `/legacy` | Preserved original mapper | Uses its historical local React state and export format while specialist controls are migrated |

The primary route is canonical. `/legacy` is a compatibility and migration surface, not a second product direction.

## Canonical model layer

`lib/scim/schema.ts` defines the controlled vocabularies and canonical document shape.

Important boundaries:

- every external or stored document is validated;
- duplicate IDs and broken relationship endpoints are rejected;
- scenario references are validated;
- entity, relationship and view fields remain distinct;
- extensible identifiers and typed attributes allow local concepts without discarding the standard vocabulary.

Schema changes require parser, serializer, documentation and compatibility review.

## Parsing and serialisation

`lib/scim/parser.ts` converts SCIM DSL or a Markdown document containing a fenced `scim` block into the canonical model.

`lib/scim/serializer.ts` produces the canonical text form. The serializer defines stable ordering and formatting for portable exchange.

Round-trip expectation:

```text
SCIM text -> parse -> canonical document -> serialize -> SCIM text
```

The round trip must preserve semantic values, stable IDs, source order where defined, unknown supported attributes and frozen geometry.

## Deterministic rendering

`lib/scim/radial-svg.ts` implements `scim-radial-1`.

A frozen radial view declares:

- canvas and centre;
- rings and radii;
- sector angles;
- node positions and dimensions;
- optional routed relationship points;
- renderer profile.

The renderer profile fixes paint order, colours, labels, node shapes, status styles, edge styles and text wrapping. Existing profile behaviour must not be changed silently. A new visual contract receives a new renderer ID.

The primary canonical map renders the deterministic SVG and overlays interactive pointer hit targets. Moving a node changes only the selected radial view placement.

## Native map interaction

`components/scim-canonical-map-workspace.tsx` owns the primary visual authoring experience.

It uses:

- native Pointer Events for mouse, touch and pen;
- explicit Navigate and Edit modes;
- pointer capture during node dragging;
- at least 48 by 48 view-unit node hit targets;
- one revision per completed drag rather than one per movement frame;
- browser panning and pinch zoom in Navigate mode;
- read-only scenario previews.

Manual entity and relationship changes are made against `ScimDocument`, validated and recorded as human-origin revisions.

## Scenario architecture

`lib/scim/simulation.ts` has two stages:

1. `applyScenario` applies explicit scenario changes to a validated clone of the baseline.
2. `propagateCriticalFailures` evaluates explicit dependency requirements and then applies a conservative fallback rule for targets without them.

The result includes:

- the simulated document;
- changed entity and relationship IDs;
- warnings;
- human-readable explanations.

Current simulation is deterministic and status-based. It is not yet a time, capacity or probability engine.

## Dependency requirements

`lib/scim/requirements.ts` reads typed relationship attributes describing requirement groups, such as:

- the target entity;
- service name;
- policy: all, any or minimum available;
- minimum provider count;
- status when unsatisfied.

This prevents an AI or simulator from guessing redundancy logic from multiple incoming lines.

## Comparison and selective acceptance

`lib/scim/diff.ts` compares two complete validated documents and produces deterministic `ScimDocumentChange` records for:

- model metadata;
- entities;
- relationships;
- scenarios;
- views.

It reports separate semantic, scenario and view change counts.

`lib/scim/diff-apply.ts` applies selected changes to a clone of the baseline and validates the complete result. Invalid combinations are rejected, such as accepting a new relationship while rejecting its endpoint entity.

## Human–AI proposal boundary

`lib/scim/handoff.ts` creates a self-contained Markdown package containing:

- interpretation rules;
- deterministic renderer instructions;
- a text-only structural reading;
- the complete authoritative SCIM source.

`lib/scim/proposal.ts` defines the candidate response shape:

- title;
- rationale;
- assumptions;
- open questions;
- complete candidate model.

`components/scim-collaboration-review.tsx` loads the accepted workspace baseline, compares a pasted proposal, lets the reviewer select operations and commits a valid accepted result as an AI-origin revision.

No model provider is required by the core protocol.

## Workspace persistence and history

`lib/scim/workspace.ts` stores:

- accepted document key: `scim.workspace.document.v1`;
- revision history key: `scim.workspace.revisions.v1`.

A revision contains:

- generated revision ID;
- origin: `human` or `ai`;
- label;
- timestamp;
- canonical change list;
- complete before document;
- complete after document.

The latest 100 revisions are stored. Invalid stored data is ignored in favour of the validated fallback model. Current persistence is browser- and device-local.

## Source structure

```text
app/
  layout.tsx                        global navigation and version information
  page.tsx                          canonical map route
  editor/page.tsx                   source editor route
  review/page.tsx                   collaboration review route
  legacy/page.tsx                   preserved original mapper

components/
  scim-canonical-map-workspace.tsx  primary map, inspectors, scenarios and history
  scim-collaboration-review.tsx     proposal comparison and acceptance
  scim-text-editor.tsx              advanced source authoring and exports
  scim-radial-preview.tsx           deterministic read-only preview

lib/scim/
  schema.ts                         canonical Zod schemas
  parser.ts                         SCIM DSL / Markdown parser
  serializer.ts                     canonical SCIM serializer
  radial-svg.ts                     scim-radial-1 renderer
  simulation.ts                     scenario application and propagation
  requirements.ts                   explicit dependency logic
  diff.ts                           deterministic document comparison
  diff-apply.ts                     selective reviewed application
  proposal.ts                       proposal request and response protocol
  handoff.ts                        complete AI package
  structure.ts                      text-only structural reading
  workspace.ts                      local accepted state and revisions
  legacy-adapter.ts                 legacy format conversion
  default-model.ts                  initial canonical demonstration model
  version.ts                        schema and build version helpers

advanced-infrastructure-mapper.tsx  preserved historical mapper implementation
```

## Current migration state

Completed:

- canonical schema and language;
- deterministic radial rendering;
- text-only structural interpretation;
- explicit dependency requirements;
- proposal comparison and selective acceptance;
- shared human/AI revision history;
- primary canonical map;
- native pointer dragging;
- browser-local persistence;
- preservation of the historical mapper at `/legacy`.

Still to migrate or add:

- legacy threat-sector editing on canonical state;
- impact-zone modelling and editing in the canonical schema;
- richer route editing and node resizing;
- explicit transfer and synchronisation between source editor and accepted workspace;
- cloud persistence and multi-user collaboration;
- time-, capacity- and resource-aware simulation;
- structured plans of action and intervention comparison;
- comprehensive automated test coverage.

See [`roadmap.md`](roadmap.md).

## Compatibility and versioning

The application version, language/schema version and renderer profile are separate:

- application: user-facing product release, currently `0.5.0`;
- SCIM schema: portable model contract, currently `0.2`;
- radial renderer: deterministic visual contract, currently `scim-radial-1`.

A UI release does not automatically require a schema change. A schema change does not silently change a renderer. Published renderer profiles are immutable.

## Trust boundaries

- The application validates all canonical documents.
- The primary map does not automatically send data to an AI.
- The user explicitly copies a handoff into an external system.
- AI responses are treated as untrusted candidate data until parsed, compared, selected and validated.
- Local storage is not encrypted and must not be treated as secure storage for highly sensitive operational data.
- The public repository and examples must use synthetic infrastructure information.

See [`../SECURITY.md`](../SECURITY.md) and [`ai-collaboration-protocol.md`](ai-collaboration-protocol.md).
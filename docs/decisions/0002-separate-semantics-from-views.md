# ADR 0002: Separate semantic structure from view geometry

- Status: accepted
- Date: 2026-07-28

## Context

A radial SCIM diagram uses rings, sectors, positions, colours and routes. These visual features are useful, but an AI or person must not need to infer infrastructure meaning from where a box happens to be placed.

The same infrastructure model may also need an INAM, dependency graph, scenario timeline or geographic view.

## Decision

Store infrastructure meaning in entities, directed relationships, typed requirements, scenarios, evidence and attributes.

Store presentation in explicit versioned view objects.

A frozen radial view records the exact geometry required to reproduce a diagram, but it does not create semantic facts.

## Consequences

### Positive

- A complete model is understandable without rendering.
- Multiple views can represent one accepted system.
- Moving a node does not alter its meaning.
- AI systems can reason from text without guessing from layout.
- Deterministic rendering and semantic comparison can be tested separately.
- View-only proposal changes are distinguishable from infrastructure changes.

### Negative

- Some information is intentionally repeated, such as an entity’s layer and its visual ring placement.
- Validation must detect missing or inconsistent references.
- Auto-layout cannot silently become authoritative.
- Editors must make clear whether an action changes semantics or presentation.

## Interpretation rules

- Proximity does not create a relationship.
- Ring placement does not replace the declared locality layer.
- Sector placement does not assert a supported need.
- Line colour or shape does not change relationship semantics.
- Multiple incoming lines do not define AND/OR dependency logic.
- Frozen geometry changes only when a user or accepted proposal intentionally changes a view.

## Renderer versioning

Published renderer profiles are immutable. A changed deterministic visual contract receives a new renderer identifier rather than changing historical diagrams.

## Guardrail

Every new visual feature must answer whether it is:

- a semantic field;
- a scenario field;
- view data;
- a derived display;
- or an explicit combination.

Do not hide a semantic assertion only in view data.
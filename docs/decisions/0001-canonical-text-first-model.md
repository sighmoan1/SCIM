# ADR 0001: Use a canonical text-first SCIM model

- Status: accepted
- Date: 2026-07-28

## Context

The original application stored infrastructure meaning, scenario state and screen coordinates inside one large React component. That supported rapid visual prototyping, but it made the model difficult to exchange, validate, simulate or collaborate on with AI systems.

The product needs people to work visually, as text and through AI conversations without creating incompatible models.

## Decision

Use a Zod-validated `ScimDocument` as the accepted source of truth.

Use SCIM Markdown containing a fenced Mermaid-like SCIM DSL as the primary portable authoring and collaboration format.

JSON remains an interchange and persistence representation, not the main format people are expected to write.

## Consequences

### Positive

- The entire model is portable as text.
- Visual, text and AI authors can converge on one schema.
- Validation is centralised.
- Scenario and renderer code can be pure functions over canonical data.
- Stable IDs support diffs, revisions and external conversations.
- A model can be inspected without running the application.

### Negative

- Visual controls must translate user actions into canonical edits.
- Parser and serializer compatibility become product contracts.
- Schema migration must be managed explicitly.
- Some rapid UI-only experiments require more discipline.

## Rejected alternatives

### Keep React state as the source of truth

Rejected because it is not portable, independently validatable or suitable for external AI collaboration.

### Make JSON the primary user format

Rejected because JSON is verbose for human discussion and cannot naturally contain narrative, evidence, rationale and open questions.

### Use a generic diagram language only

Rejected because generic graph notation does not encode SCIM needs, layers, failure modes, scenarios, evidence or deterministic radial views.

## Guardrail

A new feature must identify how its meaning is represented in `ScimDocument` and portable SCIM text. UI-only hidden meaning is not acceptable.
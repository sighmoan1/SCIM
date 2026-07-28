# Human and AI proposal review

SCIM contributors do not edit an accepted model invisibly. A human or AI returns a complete candidate model with rationale, assumptions and open questions. The application compares it with the accepted baseline and lets a reviewer accept or reject each structured change.

## Portable proposal format

```markdown
# Add backup power to the clinic

## Rationale

Explain what should change and why.

## Assumptions

- State every new assumption.

## Open questions

- State unresolved questions.

## Complete candidate model

```scim
model clinic-resilience "Clinic resilience" {
  # Complete model, not a fragment.
}
```
```

The candidate `scim` block is machine-readable. The surrounding Markdown gives the human reviewer the reasoning and uncertainty needed to assess it.

## Review process

1. Paste or edit the accepted baseline.
2. Use **Copy request for AI** and send the generated prompt to any capable chat interface.
3. Paste the returned proposal into `/review`.
4. Inspect the semantic diff.
5. Accept or reject each change.
6. Resolve any validation errors caused by accepting an incomplete combination of changes.
7. Copy or download the resulting accepted SCIM model.

The application never treats pasted AI prose as an applied change.

## Diff categories

The deterministic diff separates:

- model metadata;
- entities;
- directed relationships and dependency requirement attributes;
- scenarios;
- views and frozen geometry.

This prevents a layout-only change from being confused with a semantic infrastructure change.

## Partial acceptance

Each change has a stable review key such as:

```text
entity:generator:added
relationship:grid-clinic:changed
view:main:changed
```

Selected changes are applied to a clone of the accepted baseline and the complete result is validated. For example, accepting a new relationship while rejecting the entity it references produces a validation error instead of a broken model.

## AI rules

The generated request tells the AI to:

- preserve IDs for unchanged objects;
- return the complete candidate model;
- state rationale, assumptions and questions;
- avoid claiming a proposal has already been accepted;
- preserve frozen view geometry unless intentionally proposing a layout change;
- mark inferred infrastructure facts as assumptions or proposals.

The proposal protocol works with embedded AI systems, external chat interfaces and local models because it depends only on portable Markdown and SCIM text.

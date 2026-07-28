# Human and AI proposal review

Status: current `/review` workflow in SCIM Mapper v0.5.0.

## Purpose

SCIM contributors do not edit an accepted model invisibly. A person or AI returns a complete candidate model with rationale, assumptions and open questions. The Review workspace compares it with the exact accepted baseline and lets a reviewer accept or reject structured canonical operations.

After successful review, the accepted result and one AI-origin revision are written back to the same browser-local workspace used by the primary map.

## Portable proposal format

~~~markdown
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
~~~

The candidate `scim` block is machine-readable. The surrounding Markdown supplies the reasoning and uncertainty needed for human review.

## End-to-end process

1. Create or edit the accepted model in the Map workspace.
2. Open `/review`.
3. The Review workspace loads the shared accepted baseline.
4. Select **Copy request for AI**.
5. Paste the generated request into a capable external or embedded AI interface.
6. Ask the AI to analyse, challenge, extend or simulate the model.
7. Paste the complete returned proposal into the proposed-response field.
8. Inspect the proposal rationale, assumptions and open questions.
9. Inspect the canonical operation list.
10. Accept or reject individual operations.
11. Resolve any validation errors caused by an incomplete combination.
12. Select the action that accepts the reviewed result into the workspace.
13. Return to the map and inspect the updated accepted state and AI-origin revision.

The application never treats pasted prose alone as an applied change.

## Generated proposal request

The generated request includes:

- the requested task;
- rules not to claim a change has already been accepted;
- the required proposal response structure;
- the complete text-only structural reading;
- the complete authoritative SCIM source;
- deterministic renderer instructions;
- rules to preserve stable IDs and frozen geometry.

This request can be used with different AI providers or a local model.

## Parsing the response

`parseScimProposal` extracts:

- title from the top-level heading;
- rationale or reasoning section;
- assumption bullet points;
- open-question bullet points;
- the complete candidate document from the fenced SCIM block;
- original source text.

The candidate is parsed and validated like any other SCIM input.

A response that contains no complete valid SCIM block cannot be reviewed as a model proposal.

## Diff categories

`compareScimDocuments` separates:

- model metadata;
- entities;
- directed relationships and requirement attributes;
- scenarios;
- views and frozen geometry.

The interface reports separate counts for:

- semantic changes;
- scenario changes;
- view changes.

This prevents layout-only changes from being confused with infrastructure changes.

## Review operations

Each operation includes:

- stable key;
- area;
- kind: added, removed or changed;
- object ID;
- summary;
- changed fields;
- structured before value;
- structured after value.

Example keys:

```text
entity:generator:added
relationship:grid-clinic:changed
scenario:grid-failure:added
view:main:changed
```

Keys describe review operations, not permanent event IDs.

## Partial acceptance

Each candidate operation can be selected independently.

Selected changes are applied to a clone of the accepted baseline. The complete result is then validated.

Examples:

- Accepting a generator entity and its relationship may be valid.
- Accepting the relationship while rejecting the generator is invalid.
- Accepting a semantic change while rejecting an unrelated layout change may be valid.
- Removing an entity while retaining relationships that reference it is invalid.

The application reports validation errors instead of saving a broken document.

## Acceptance into the workspace

When the reviewed partial result is valid and differs from the baseline:

1. `createScimWorkspaceRevision` compares baseline and accepted result;
2. one revision is created with `origin: "ai"`;
3. the proposal title becomes the revision label;
4. the accepted document and updated history are saved to local storage;
5. the review form is reset for the next proposal.

The AI does not receive or control this final action.

## Review guidance

A reviewer should inspect:

### Rationale

Does each proposed change address the requested problem? Has the AI made unrelated changes?

### Assumptions

Are new capacities, endurance values, dependencies or actors explicitly marked as assumptions? Should any be replaced with evidence or questions?

### Open questions

Do unresolved operational facts need domain-expert input before acceptance?

### Stable IDs

Did unchanged objects keep their IDs? Unnecessary ID replacement can make a candidate look like mass deletion and recreation.

### Relationship direction

Does every arrow still point from provider or enabler to receiver?

### Dependency logic

Has the proposal declared whether providers are all required, interchangeable or subject to a minimum count? It must not infer this from multiple lines.

### Scenarios

Are scenario changes separated from baseline facts? Does the scenario claim times, capacities or restoration behaviour not supported by the model?

### View geometry

Did frozen coordinates, routes or dimensions change? Was the change requested and explained?

### Evidence

Are claims supported or clearly labelled as assumptions, inferences or recommendations?

## Reject or request revision when

- the response contains only prose;
- the SCIM block is incomplete;
- the candidate removes unrelated parts of the model;
- stable IDs are changed without reason;
- relationships are reversed;
- view geometry changes silently;
- assumptions are encoded as verified facts;
- the candidate does not parse or validate;
- the requested scenario is mixed into the accepted baseline;
- the proposal creates invalid partial-operation dependencies.

## Human proposals

The same format and review mechanism can be used for a proposal written by a person. The current accepted-workspace commit path labels reviewed external proposals as AI-origin because it is built around the AI handoff workflow. A future proposal schema should capture the actual author type and identity explicitly rather than inferring it from the route.

## Privacy

The Review workspace does not automatically contact an AI provider. The user controls copying and pasting.

Before sharing, inspect the outbound handoff for sensitive locations, vulnerabilities, capacities, source links and operational plans. See [`../SECURITY.md`](../SECURITY.md).

## Current limitations

- There are no comments on individual operations.
- Proposal author identity is not yet structured.
- There are no competing branches or side-by-side map overlays.
- Review state is not persisted if the page is closed before acceptance.
- There is no server-backed audit or multi-user approval.
- A full view object currently appears as one changed operation even when only one node moved.
- The reviewer must use structured before/after JSON for detailed field inspection.

## Future direction

Planned improvements include:

- map overlays for pending candidate objects;
- field-level acceptance where safe;
- reviewer comments and questions;
- evidence verification status;
- competing proposals;
- structured author identity;
- proposal persistence;
- server-backed approval workflows;
- embedded provider adapters that preserve this same review boundary.

See [`ai-collaboration-protocol.md`](ai-collaboration-protocol.md) and [`roadmap.md`](roadmap.md).
# ADR 0003: Treat AI output as a reviewable proposal

- Status: accepted
- Date: 2026-07-28

## Context

AI systems can help identify missing dependencies, challenge assumptions, create scenarios and propose mitigations. They can also invent facts, lose IDs, reverse relationships or make broad changes hidden inside plausible prose.

Allowing a chat model to write directly into accepted infrastructure state would make changes difficult to inspect, attribute or undo.

## Decision

An AI returns:

- a proposal title;
- rationale;
- explicit assumptions;
- open questions;
- one complete candidate SCIM model.

The application compares the candidate with the accepted baseline, presents canonical operations, allows individual acceptance or rejection, validates the partial result and records an `ai` revision only after human acceptance.

## Consequences

### Positive

- No hidden AI mutation.
- Stable object IDs can be preserved and reviewed.
- Semantic, scenario and view changes are distinguished.
- Invalid partial acceptance is blocked.
- AI contributions are attributable and reversible.
- The protocol works with many model providers and local models.

### Negative

- The workflow has more friction than direct chat-driven editing.
- Complete candidate models may be large.
- Review quality still depends on the human reviewer.
- The protocol does not prove domain correctness.

## Rejected alternatives

### Let the AI call model mutation tools directly

Rejected for accepted state. Tool calls may later create pending proposal operations, but they must not bypass review and validation.

### Accept prose instructions and infer changes in the application

Rejected because inference would add another hidden AI-like interpretation step and make exact comparison difficult.

### Require a provider-specific patch format

Rejected because it would reduce portability and couple the core workflow to one integration.

## Guardrail

An embedded AI provider adapter may automate transport, but it must return candidate data into the same parse, compare, review and validation pipeline. It cannot receive direct write access to accepted state.
# Architecture decision records

This directory records durable product and technical decisions whose rationale future collaborators will need.

## Current decisions

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-canonical-text-first-model.md) | canonical text-first `ScimDocument` | accepted |
| [0002](0002-separate-semantics-from-views.md) | separate semantic structure from view geometry | accepted |
| [0003](0003-ai-output-is-a-proposal.md) | AI output requires human review and acceptance | accepted |
| [0004](0004-browser-local-first-workspace.md) | stabilise browser-local workspace before cloud collaboration | accepted |
| [0005](0005-native-pointer-events-and-legacy-preservation.md) | native Pointer Events with temporary legacy-route preservation | accepted |

## When to add an ADR

Add an ADR when a change establishes or reverses a durable constraint, including:

- canonical model boundaries;
- language or renderer compatibility;
- persistence architecture;
- AI trust and review boundaries;
- collaboration or permission model;
- simulation semantics;
- legacy migration strategy;
- security or data-disclosure architecture;
- a major technology choice that constrains future work.

Do not create an ADR for a routine bug fix or a small implementation detail.

## Format

Use:

```markdown
# ADR NNNN: Decision title

- Status: proposed | accepted | superseded | rejected
- Date: YYYY-MM-DD
- Supersedes: ADR NNNN, when applicable

## Context

What problem and constraints required a decision?

## Decision

What is the chosen direction?

## Consequences

What becomes easier, harder or impossible?

## Rejected alternatives

What serious alternatives were considered and why were they not chosen?

## Guardrail

What must future contributors preserve?
```

## Numbering

Use the next four-digit number. Do not renumber historical records.

## Changing a decision

Do not rewrite an accepted ADR to make history look cleaner.

When a durable decision changes:

1. add a new ADR;
2. mark the old record superseded;
3. link both records;
4. update current architecture and roadmap documents;
5. explain compatibility and migration consequences in the pull request.
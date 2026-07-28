# SCIM documentation

This directory is the maintained guide to the Simple Critical Infrastructure Mapper: the domain model, portable language, application architecture, collaboration protocol, development workflow and current limitations.

## Start here

- [`../README.md`](../README.md) — project overview and quick start.
- [`product-and-domain.md`](product-and-domain.md) — what SCIM is, the problems it addresses and the product principles that must survive implementation changes.
- [`architecture.md`](architecture.md) — current system architecture and data flow.
- [`scim-language.md`](scim-language.md) — normative SCIM 0.2 language reference.
- [`scim-radial-1.md`](scim-radial-1.md) — normative deterministic radial renderer profile.
- [`canonical-workspace.md`](canonical-workspace.md) — how the primary map, local persistence and revision history work.
- [`proposal-review.md`](proposal-review.md) — reviewable human and AI proposal workflow.

## Build and maintain the application

- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — contribution workflow, quality gates and coding expectations.
- [`development-and-release.md`](development-and-release.md) — local setup, scripts, CI, Vercel deployment, versioning and release checklist.
- [`mobile-and-accessibility.md`](mobile-and-accessibility.md) — mobile interaction contract and accessibility acceptance criteria.
- [`testing-strategy.md`](testing-strategy.md) — current verification, missing automated coverage and the intended test pyramid.
- [`roadmap.md`](roadmap.md) — current capability, known limitations and sequenced next work.
- [`../SECURITY.md`](../SECURITY.md) — handling sensitive infrastructure data and reporting security problems.

## Human–AI collaboration

- [`ai-collaboration-protocol.md`](ai-collaboration-protocol.md) — model-agnostic handoff, proposal and acceptance protocol.
- [`text-structure.md`](text-structure.md) — how an AI interprets the complete system without seeing a diagram.
- [`workspace-and-revisions.md`](workspace-and-revisions.md) — shared accepted state, human/AI provenance, undo and browser-local persistence.

## Decision record

Architecture decisions are captured under [`decisions/`](decisions/):

- [`0001-canonical-text-first-model.md`](decisions/0001-canonical-text-first-model.md)
- [`0002-separate-semantics-from-views.md`](decisions/0002-separate-semantics-from-views.md)
- [`0003-ai-output-is-a-proposal.md`](decisions/0003-ai-output-is-a-proposal.md)
- [`0004-browser-local-first-workspace.md`](decisions/0004-browser-local-first-workspace.md)
- [`0005-native-pointer-events-and-legacy-preservation.md`](decisions/0005-native-pointer-events-and-legacy-preservation.md)

## Examples

- [`../examples/hospital-resilience.scim.md`](../examples/hospital-resilience.scim.md) — portable hospital resilience model with a frozen radial view and scenario.

## Documentation rules

Documentation is part of the product contract. A pull request must update the relevant documentation when it changes:

- SCIM grammar or semantics;
- canonical schema fields or validation;
- renderer behaviour;
- scenario propagation;
- local-storage keys or migration behaviour;
- proposal or review formats;
- routes, controls or mobile interaction;
- deployment, versioning or release processes;
- trust, privacy or security boundaries.

Normative documents use **MUST**, **SHOULD** and **MAY** in their usual standards sense. Descriptive documents explain the current implementation and must name known limitations rather than presenting planned behaviour as complete.
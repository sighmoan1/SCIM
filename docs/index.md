# SCIM documentation

This directory is the maintained guide to the Simple Critical Infrastructure Mapper: the domain model, portable language, application architecture, collaboration protocol, development workflow and current limitations.

## Start here

- [`../README.md`](../README.md) — project overview and quick start.
- [`user-guide.md`](user-guide.md) — current end-user journeys across Map, Model, Review and Legacy routes.
- [`product-and-domain.md`](product-and-domain.md) — what SCIM is, the problems it addresses and the product principles that must survive implementation changes.
- [`architecture.md`](architecture.md) — current system architecture and data flow.
- [`glossary.md`](glossary.md) — domain and implementation terminology.

## Model, language and simulation

- [`canonical-model-reference.md`](canonical-model-reference.md) — complete `ScimDocument` field and validation reference.
- [`scim-language.md`](scim-language.md) — normative SCIM 0.2 language reference.
- [`text-structure.md`](text-structure.md) — complete text interpretation independent of diagram layout.
- [`dependency-requirements.md`](dependency-requirements.md) — explicit all/any/threshold dependency semantics.
- [`scenario-and-requirement-engine.md`](scenario-and-requirement-engine.md) — scenario application, requirement evaluation and propagation behaviour.
- [`scim-radial-1.md`](scim-radial-1.md) — normative deterministic radial renderer profile.

## Workspaces and collaboration

- [`canonical-workspace.md`](canonical-workspace.md) — primary map behaviour, native pointer editing and scenarios.
- [`workspace-and-revisions.md`](workspace-and-revisions.md) — shared accepted state, human/AI provenance, local persistence and undo.
- [`proposal-review.md`](proposal-review.md) — reviewable human and AI proposal workflow.
- [`ai-collaboration-protocol.md`](ai-collaboration-protocol.md) — model-agnostic handoff, proposal and acceptance protocol.
- [`legacy-migration.md`](legacy-migration.md) — legacy format adapter, migration risks and retirement criteria.

## Build and maintain the application

- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — contribution workflow, quality gates and coding expectations.
- [`development-and-release.md`](development-and-release.md) — local setup, scripts, CI, Vercel deployment, versioning and release checklist.
- [`mobile-and-accessibility.md`](mobile-and-accessibility.md) — mobile interaction contract and accessibility acceptance criteria.
- [`testing-strategy.md`](testing-strategy.md) — current verification, missing automated coverage and intended test pyramid.
- [`roadmap.md`](roadmap.md) — current capability, known limitations and sequenced next work.
- [`../CHANGELOG.md`](../CHANGELOG.md) — application release history.
- [`../SECURITY.md`](../SECURITY.md) — handling sensitive infrastructure data and reporting security problems.

## Decision record

Architecture decisions are captured under [`decisions/`](decisions/):

- [`0001-canonical-text-first-model.md`](decisions/0001-canonical-text-first-model.md)
- [`0002-separate-semantics-from-views.md`](decisions/0002-separate-semantics-from-views.md)
- [`0003-ai-output-is-a-proposal.md`](decisions/0003-ai-output-is-a-proposal.md)
- [`0004-browser-local-first-workspace.md`](decisions/0004-browser-local-first-workspace.md)
- [`0005-native-pointer-events-and-legacy-preservation.md`](decisions/0005-native-pointer-events-and-legacy-preservation.md)

## Examples

- [`../examples/hospital-resilience.scim.md`](../examples/hospital-resilience.scim.md) — portable hospital resilience model with explicit requirements, a frozen radial view and scenarios.

## Documentation rules

Documentation is part of the product contract. A pull request must update the relevant documentation when it changes:

- SCIM grammar or semantics;
- canonical schema fields or validation;
- renderer behaviour;
- scenario or requirement propagation;
- local-storage keys or migration behaviour;
- proposal or review formats;
- routes, controls or mobile interaction;
- deployment, versioning or release processes;
- trust, privacy or security boundaries;
- legacy migration or deprecation state.

Normative documents use **MUST**, **SHOULD** and **MAY** in their usual standards sense. Descriptive documents explain current implementation and must name known limitations rather than presenting planned behaviour as complete.

## Suggested reading paths

### New product collaborator

1. `README.md`
2. `user-guide.md`
3. `product-and-domain.md`
4. `roadmap.md`

### New engineer

1. `CONTRIBUTING.md`
2. `architecture.md`
3. `canonical-model-reference.md`
4. `development-and-release.md`
5. the relevant subsystem guide

### Language or simulation contributor

1. `scim-language.md`
2. `canonical-model-reference.md`
3. `dependency-requirements.md`
4. `scenario-and-requirement-engine.md`
5. `testing-strategy.md`

### AI collaboration contributor

1. `text-structure.md`
2. `ai-collaboration-protocol.md`
3. `proposal-review.md`
4. `workspace-and-revisions.md`
5. `SECURITY.md`

### Mobile or interaction contributor

1. `canonical-workspace.md`
2. `mobile-and-accessibility.md`
3. ADR 0005
4. `testing-strategy.md`
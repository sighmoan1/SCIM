# Governance and decision rights

## Purpose

SCIM combines a domain framework, portable language, application, renderer and simulation rules. Contributors need clear ownership so operational expertise shapes the product without fragmenting the canonical model.

## Core principle

> Domain and operational experts define what must be understood and what decisions the model must support. Product and language maintainers protect how those needs are represented coherently in the canonical model.

A subject-matter expert should not be forced to design schema internals. A developer or AI should not invent operational semantics merely because they are convenient to implement.

## Decision areas

### Product purpose and user needs

Owned through product stewardship with direct input from users, responders, planners, infrastructure specialists and accessibility participants.

Questions include:

- Which decisions should SCIM support?
- Which modelling tasks are most valuable?
- What information is realistically available?
- What level of uncertainty is acceptable?
- Which manual and AI-assisted workflows need improvement?

### Domain vocabulary

Requires domain review and language-maintainer review.

Questions include:

- Is a concept genuinely part of SCIM?
- Is it a new standard term or a local extension?
- Does it overlap an existing need, relationship, failure mode or scenario concept?
- Can it be represented completely as text?
- What evidence or uncertainty should accompany it?

### Canonical schema and language

Owned by maintainers responsible for compatibility and coherence, informed by domain needs.

Questions include:

- What is the canonical field or object?
- What is its portable syntax?
- How is it validated?
- How does it round-trip?
- How is it interpreted by an AI?
- Is migration required?

### Renderer profiles

Owned by renderer maintainers under the published immutable-profile rule.

A change to a published visual contract requires a new profile, not silent modification.

### Simulation semantics

Requires domain, product and technical review.

A simulation rule must state:

- its assumptions;
- availability definition;
- propagation order;
- uncertainty and limitations;
- explanation behaviour;
- how users can challenge it.

### AI collaboration and trust

Requires product, security and language review.

No model-provider integration may bypass explicit disclosure, proposal review, validation or human acceptance.

### Security and sensitive data

Security concerns can block release. Operational users should help classify data sensitivity and realistic misuse.

## Roles

One person may hold several roles in a small project.

### Product steward

- maintains product purpose and roadmap;
- prioritises user outcomes;
- prevents implementation convenience from replacing user need;
- ensures manual and AI-assisted authoring remain balanced.

### SCIM domain steward

- protects fidelity to the SCIM framework;
- reviews standard vocabulary and modelling guidance;
- identifies where operational uncertainty should remain explicit.

### Language and schema maintainer

- owns canonical coherence and compatibility;
- reviews grammar, validation and migration;
- protects text-first interpretation and stable IDs.

### Renderer maintainer

- protects deterministic profile behaviour;
- separates view and semantic changes;
- maintains accessible and portable output.

### Simulation maintainer

- maintains requirement evaluation, scenario application and explanations;
- prevents unsupported precision;
- documents engine limitations.

### Collaboration and security maintainer

- reviews proposal, persistence, provider and disclosure boundaries;
- maintains threat and privacy documentation;
- ensures untrusted input remains validated.

### Contributor

- follows contribution and documentation rules;
- states assumptions and limitations;
- does not bypass canonical boundaries.

### Domain reviewer

- assesses whether a model or feature reflects real operational needs;
- verifies facts, dependencies and actions;
- is not expected to approve technical implementation details alone.

## Change levels

### Routine change

Examples:

- copy improvement;
- bug fix preserving contracts;
- internal refactor with no behavioural change;
- documentation correction.

Requires normal pull-request review and verification.

### Contract change

Examples:

- new canonical field;
- grammar or serializer change;
- changed validation;
- changed simulation rule;
- new renderer profile;
- storage format migration;
- new AI disclosure path.

Requires updated normative documentation, compatibility statement, tests and often an ADR.

### High-risk change

Examples:

- cloud persistence;
- authentication and sharing;
- external AI API integration;
- operational data connectors;
- probabilistic recommendations;
- public project publishing;
- removal of legacy recovery paths.

Requires explicit product, security and migration review before implementation is treated as complete.

## Proposal process for a new modelling concept

1. Describe the user decision or question the concept supports.
2. Provide at least one concrete synthetic example.
3. Explain why existing fields are insufficient.
4. Define semantic meaning independent of layout.
5. Define uncertainty, evidence and failure implications.
6. Draft canonical shape and portable syntax.
7. Explain AI interpretation and proposal behaviour.
8. Explain scenario and renderer consequences.
9. Assess compatibility and migration.
10. Record the decision and implement tests.

## AI contributions to the repository

AI coding collaborators may draft code and documentation, but maintainers must review:

- factual domain claims;
- compatibility decisions;
- security implications;
- generated migrations;
- test adequacy;
- whether implementation matches the stated product need.

The repository’s own AI contribution should follow the same principle as the product: proposed changes are reviewable before acceptance.

## Disagreement

When reliable contributors disagree:

- separate the domain question from the implementation question;
- state evidence and assumptions;
- build the smallest reversible experiment when possible;
- avoid silently resolving disagreement through UI defaults;
- preserve unresolved alternatives in documentation or proposals;
- record durable decisions in an ADR.

## Documentation ownership

Every subsystem maintainer owns the accuracy of its documentation. A documentation-only maintainer may improve clarity, but behaviour changes must be reviewed by someone who understands the implementation.

## Release authority

A maintainer merging to `main` is responsible for confirming:

- required reviews occurred;
- compatibility is stated;
- verification and preview checks passed;
- documentation and changelog are current;
- sensitive information is not included;
- production deployment is observed after merge.

## Future formalisation

As the contributor base grows, this document can be extended with named maintainers, review requirements, release roles and a formal language change process. The decision principles should remain stable even if organisational roles change.
# Testing strategy

## Current state

The repository currently verifies:

- dependency installation;
- TypeScript type-checking;
- a production Next.js build;
- Vercel preview and production deployment.

These checks are necessary but not sufficient. They do not prove that the SCIM language round-trips, that simulation semantics remain stable, that local revisions undo correctly, or that mobile pointer interactions work.

This document defines the intended coverage for future contributors.

## Testing principles

- Test domain logic as pure functions wherever possible.
- Test portable contracts more heavily than visual implementation details.
- Use deterministic fixtures and avoid random IDs or timestamps unless injected.
- Keep semantic, scenario and view assertions separate.
- Verify both success and invalid-input behaviour.
- Test mobile interaction with real Pointer Events rather than synthetic mouse compatibility.
- Test that AI proposals cannot bypass validation or explicit acceptance.

## Target test pyramid

### 1. Schema tests

Cover:

- valid standard documents;
- extensible identifiers and typed attributes;
- duplicate entity, relationship, scenario and view IDs;
- broken relationship endpoints;
- invalid focus IDs;
- invalid scenario references;
- unsupported status values;
- malformed frozen views;
- dependency-requirement validation.

### 2. Parser and serializer tests

For every grammar feature:

```text
fixture text -> parse -> canonical document -> serialize -> parse
```

Assert semantic equivalence after the second parse.

Include:

- model metadata;
- entities and unknown attributes;
- relationships and service fields;
- explicit dependency requirement attributes;
- all scenario operations;
- radial views, routes and geometry;
- INAM views;
- Markdown extraction;
- quoted strings and escaping;
- syntax-error line reporting;
- comments and whitespace;
- empty optional sections.

Regression fixtures should be added for every parser bug.

### 3. Renderer tests

`scim-radial-1` is a deterministic contract.

Test:

- declared SVG `viewBox`;
- sector ordering and wrap-around;
- ring ordering and radii;
- edge-before-node paint order;
- explicit routes and straight-line fallback;
- status styles;
- node dimensions and corner radius;
- exact text-wrapping algorithm;
- missing-placement errors;
- stable output for the same canonical input.

Prefer snapshot tests for canonical SVG strings plus focused structural assertions. Do not update snapshots without reviewing whether the renderer profile contract changed.

### 4. Dependency requirement tests

Cover:

- `all` policy;
- `any` policy;
- minimum-available policy;
- failed provider entities;
- failed relationships;
- degraded statuses where configured;
- duplicate or inconsistent requirement metadata;
- explanation text;
- fallback behaviour for entities without explicit requirements.

### 5. Scenario tests

Cover:

- applying each scenario operation;
- unknown object warnings;
- added entities and relationships;
- deterministic status propagation;
- maximum-pass protection;
- explanation chains;
- no mutation of the original baseline;
- read-only scenario display behaviour at component level.

### 6. Diff and selective-apply tests

Cover:

- no changes;
- model metadata changes;
- add, remove and change for each object area;
- stable review keys;
- semantic, scenario and view counts;
- object-order behaviour;
- accepting all;
- accepting none;
- valid partial acceptance;
- invalid partial acceptance with missing endpoints;
- view-only changes not counted as semantic changes.

### 7. Workspace tests

Cover:

- validated fallback when storage is empty;
- successful stored document load;
- malformed JSON fallback;
- invalid canonical document fallback;
- malformed individual revisions being discarded;
- 100-revision truncation;
- human and AI origins;
- no revision for equivalent documents;
- undo restoring `before` exactly;
- storage-key migration when introduced.

Use an in-memory `Storage` test double.

### 8. AI protocol tests

Cover:

- handoff includes structural reading and authoritative source;
- proposal request includes the complete baseline;
- proposal parser extracts title, rationale, assumptions, questions and candidate;
- prose-only responses fail;
- partial SCIM fragments fail canonical validation;
- frozen geometry is preserved by unchanged proposals;
- accepted AI proposals create `ai` revisions only after review.

### 9. Component tests

The highest-value component behaviours are:

- loading the shared workspace;
- adding and editing an entity;
- adding a relationship;
- deleting an entity safely;
- switching Navigate and Edit modes;
- selecting a scenario;
- displaying simulation explanations;
- reviewing proposal operations;
- committing accepted AI changes;
- undoing the latest revision.

Avoid tests that depend heavily on implementation-specific class names.

### 10. Browser end-to-end tests

Use a browser automation tool when introduced.

Desktop journey:

1. load the canonical map;
2. add an entity;
3. move it;
4. add a relationship;
5. export SCIM;
6. open review;
7. paste a proposal;
8. accept selected changes;
9. return to the map and confirm them;
10. undo the revision.

Mobile journey:

1. load at a narrow viewport;
2. pan and pinch or zoom in Navigate mode;
3. switch to Edit mode;
4. drag a node with a touch pointer;
5. inspect and edit it;
6. preview a scenario without changing the baseline;
7. review and accept a proposal.

### 11. Accessibility tests

Automate what is practical:

- axe or equivalent checks;
- labelled form controls;
- button names;
- landmark and heading structure;
- focus order;
- no keyboard traps;
- status not expressed by colour alone.

Manual checks remain necessary for canvas graph navigation and screen-reader experience.

## Recommended tooling

The exact test stack has not yet been selected. A compatible direction would be:

- Vitest for pure TypeScript modules;
- React Testing Library for components;
- Playwright for browser and mobile-pointer journeys;
- axe integration for automated accessibility checks.

Tool adoption should be a focused pull request that establishes scripts, fixtures, CI integration and contributor guidance.

## Fixture policy

Keep fixtures under a clear test or examples directory and distinguish:

- normative examples — demonstrate supported language;
- regression fixtures — preserve a fixed bug case;
- invalid fixtures — must fail with an expected error;
- renderer fixtures — must produce stable output.

Use synthetic infrastructure data.

## Golden portable-model tests

At least one complete model should be treated as a golden compatibility fixture containing:

- all standard entity fields;
- relationships with delivery modes and requirements;
- scenarios;
- a frozen radial view;
- an INAM view;
- evidence and unknown attributes.

Every schema, parser, serializer or renderer change should run against it.

## Performance tests

Current models are small, but future tests should establish practical limits for:

- hundreds or thousands of entities and relationships;
- large revision histories;
- structural handoff size;
- SVG rendering time;
- diff time;
- scenario propagation passes;
- local-storage size.

Do not optimise by discarding model meaning or auditability.

## Security tests

When import, cloud or embedded AI capabilities expand, add tests for:

- malformed and oversized input;
- HTML or script injection in names and descriptions;
- safe SVG generation;
- untrusted proposal content;
- authorisation boundaries;
- provider payload disclosure;
- storage migration and recovery.

## CI target

The intended CI order is:

```text
install
  -> typecheck
  -> unit tests
  -> component tests
  -> production build
  -> selected end-to-end tests
  -> accessibility checks
```

Vercel preview remains a deployment check, not a replacement for automated product tests.

## Adding a regression test

When fixing a bug:

1. create the smallest fixture that reproduces it;
2. write a failing test;
3. implement the fix;
4. verify adjacent round-trip or semantic behaviour;
5. update documentation when the contract changed;
6. name the regression clearly in the commit and pull request.

## Honest release language

Until this strategy is implemented, release notes should say that type-checking and production build passed. They should not claim comprehensive test coverage.
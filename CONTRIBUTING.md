# Contributing to SCIM

Thank you for improving the Simple Critical Infrastructure Mapper. This project combines a domain model, a portable language, deterministic renderers, scenario logic and a human–AI collaboration workflow. A change that appears small in the interface can alter the language contract or the meaning of a model, so contributors should follow the safeguards below.

## Before making a change

Read:

1. [`docs/product-and-domain.md`](docs/product-and-domain.md)
2. [`docs/architecture.md`](docs/architecture.md)
3. [`docs/scim-language.md`](docs/scim-language.md)
4. the documentation for the area being changed

The central rule is:

> One validated `ScimDocument` is the accepted source of truth. Semantics, scenarios and views are separate concerns, and AI output is a proposal until a human accepts it.

## Local setup

Requirements:

- Node.js 20 or a compatible current LTS release;
- pnpm 10;
- Git.

Install and run:

```bash
pnpm install --no-frozen-lockfile
pnpm dev
```

Open the local URL printed by Next.js.

Quality gates:

```bash
pnpm typecheck
pnpm build
# or both
pnpm verify
```

The repository currently relies on TypeScript checking and a production Next.js build in CI. Contributors adding parser, serializer, simulation or storage behaviour should also add automated tests as the test harness is introduced; see [`docs/testing-strategy.md`](docs/testing-strategy.md).

## Branch and pull-request workflow

1. Create a focused branch from `main`.
2. Make small, reviewable commits with imperative commit messages.
3. Update documentation in the same pull request.
4. Run `pnpm verify` locally.
5. Open a pull request explaining the semantic, scenario, view and trust implications.
6. Wait for GitHub verification and the Vercel preview to pass.
7. Inspect the preview on desktop and mobile before merging user-interface changes.
8. Use squash merge unless there is a clear reason to preserve individual commits.

Do not push experimental changes directly to `main`.

## Pull-request description

A useful pull request answers:

- What user problem does this solve?
- Which canonical fields or routes change?
- Is the change semantic, scenario-related, view-only, or a combination?
- Does it change SCIM grammar, schema validation or rendering?
- Does it change local persistence or require a migration?
- Does it change what is copied to an AI or accepted from one?
- What mobile and accessibility checks were performed?
- What known limitations remain?

For language or renderer changes, state the compatibility and versioning decision explicitly.

## Code organisation

```text
app/                         Next.js routes and application shell
components/                  interactive workspaces and UI components
lib/scim/schema.ts           canonical Zod schemas and vocabulary
lib/scim/parser.ts           SCIM text to canonical model
lib/scim/serializer.ts       canonical model to SCIM text
lib/scim/radial-svg.ts       deterministic radial SVG renderer
lib/scim/simulation.ts       scenario application and failure propagation
lib/scim/requirements.ts     dependency requirement extraction and evaluation
lib/scim/diff.ts             deterministic canonical comparison
lib/scim/diff-apply.ts       selective application of reviewed changes
lib/scim/proposal.ts         portable proposal request and response format
lib/scim/handoff.ts          complete AI handoff package
lib/scim/structure.ts        text-only structural projection
lib/scim/workspace.ts        local accepted state and revision history
lib/scim/legacy-adapter.ts   conversion to and from the original mapper format
docs/                        maintained product and technical documentation
examples/                    executable portable SCIM examples
```

Prefer pure functions in `lib/scim`. UI components should orchestrate these functions rather than reimplementing schema, diff or simulation logic.

## Canonical model rules

- Validate documents at boundaries with `ScimDocumentSchema`.
- Preserve stable IDs for unchanged entities, relationships, scenarios and views.
- Preserve unknown supported attributes during parse/serialize round trips.
- Represent provider or enabler relationships as `from -> to`.
- Do not encode semantic meaning only in x/y position, colour, route shape or proximity.
- Keep scenarios as explicit changes to the baseline.
- Never silently modify frozen view geometry.
- Record accepted manual and AI changes as revisions.
- Reject partial proposals that produce an invalid canonical document.

## Language changes

A language change affects at least:

- `lib/scim/schema.ts`;
- `lib/scim/parser.ts`;
- `lib/scim/serializer.ts`;
- examples and round-trip tests;
- `docs/scim-language.md`;
- AI handoff instructions when interpretation changes;
- version constants when compatibility changes.

Before adding syntax, ask whether the concept can be represented unambiguously in the canonical model. Do not add convenient notation that loses information or depends on visual interpretation.

Breaking grammar or semantic changes require a schema-version decision and, where existing stored models are affected, a migration plan.

## Renderer changes

Published renderer profiles are immutable contracts. Do not alter `scim-radial-1` in a way that changes existing frozen diagrams.

A materially different algorithm or visual contract receives a new renderer identifier such as `scim-radial-2`. Update the normative renderer document and provide compatibility behaviour for existing views.

## Human–AI collaboration rules

- AI systems return complete candidate models, not hidden mutations.
- Proposals include rationale, assumptions and open questions.
- Unchanged objects retain stable IDs.
- A reviewer accepts or rejects canonical operations.
- AI-origin revisions are labelled `ai`; manual accepted revisions are labelled `human`.
- Never invent evidence, endurance, capacity or dependency data without marking it as an assumption or proposal.
- Core collaboration must remain provider-neutral.

## Mobile and accessibility rules

Primary interactions must use Pointer Events, not mouse-event translation. New controls must be usable with touch and keyboard.

For map changes:

- preserve distinct Navigate and Edit modes;
- use pointer capture during dragging;
- provide at least 48 by 48 view-unit hit targets for movable nodes;
- do not require hover or double-click for essential actions;
- keep scenario previews read-only unless an explicit scenario-edit mode is introduced;
- test narrow mobile widths and virtual-keyboard behaviour;
- provide visible focus states, accessible labels and live feedback for important actions.

See [`docs/mobile-and-accessibility.md`](docs/mobile-and-accessibility.md).

## Persistence changes

The accepted document and revision history currently live in browser local storage. Changes to keys, stored shapes or history semantics require:

- a migration or a clearly documented reset policy;
- malformed-data fallback behaviour;
- documentation updates;
- consideration of storage limits and sensitive-data handling.

Do not add automatic cloud or AI-provider transmission without an explicit product and security decision.

## Documentation requirement

Documentation is not optional cleanup. Update it in the same pull request when behaviour changes.

At minimum:

- update `README.md` for routes or user-visible capability;
- update `docs/architecture.md` for data-flow or component-boundary changes;
- update normative language and renderer documents for contract changes;
- add or amend an ADR for a durable architectural decision;
- update `docs/roadmap.md` when a limitation is resolved or newly discovered;
- update `CHANGELOG.md` when preparing a release.

Write current behaviour in the present tense. Put planned behaviour in the roadmap and label it clearly.

## Security and sensitive infrastructure data

Do not commit real credentials, private infrastructure locations, access procedures, vulnerability details or operationally sensitive datasets. Use synthetic examples.

Read [`SECURITY.md`](SECURITY.md) before adding cloud storage, authentication, telemetry, external AI calls or data import from operational systems.

## Definition of done

A change is done when:

- the user problem is addressed;
- canonical validation succeeds;
- text round-tripping is preserved where relevant;
- `pnpm verify` passes;
- GitHub and Vercel checks pass;
- desktop and mobile behaviour have been inspected;
- accessibility implications have been considered;
- documentation and changelog entries are current;
- known limitations are stated honestly.
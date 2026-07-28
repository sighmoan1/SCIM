# Instructions for AI coding collaborators

This file is for coding agents and AI-assisted contributors working in the SCIM repository.

## Read before changing code

1. `README.md`
2. `CONTRIBUTING.md`
3. `docs/product-and-domain.md`
4. `docs/architecture.md`
5. `docs/canonical-model-reference.md`
6. the subsystem document for the requested change

Do not treat SCIM as a generic graph or diagram application.

## Non-negotiable architecture

- One validated `ScimDocument` is the accepted source of truth.
- Infrastructure semantics are separate from view geometry.
- The complete model must remain interpretable as text.
- Relationships point from provider or enabler to receiver.
- Scenarios are operations against a baseline, not copied maps.
- Frozen views preserve exact geometry.
- Published renderer profiles are immutable.
- AI model output is a proposal until a human accepts it.
- Human and AI accepted changes use the same canonical diff and revision history.
- Primary interaction must work with mouse, touch and pen.
- The legacy mapper is a migration surface, not the destination architecture.

## Before implementing

Identify which areas the request changes:

- semantic model;
- scenario model;
- view model;
- parser or serializer;
- renderer;
- simulation;
- proposal/review protocol;
- persistence/revisions;
- user interface only;
- legacy compatibility.

A request may affect several. Do not hide a semantic change inside UI state or geometry.

## Repository workflow

- Work on a focused branch from `main`.
- Do not write feature work directly to `main`.
- Make reviewable commits.
- Open a pull request with purpose, behaviour, trust implications and known limitations.
- Run `pnpm verify`.
- Confirm GitHub Actions and Vercel preview status.
- Update documentation in the same pull request.
- Merge only after checks pass and the change is understood.

## Canonical model changes

When changing schema or language, update together:

- `lib/scim/schema.ts`;
- `lib/scim/parser.ts`;
- `lib/scim/serializer.ts`;
- `lib/scim/structure.ts`;
- `lib/scim/handoff.ts` when AI interpretation changes;
- examples;
- tests;
- `docs/scim-language.md`;
- `docs/canonical-model-reference.md`;
- compatibility and version notes.

Preserve stable IDs and unknown supported attributes.

## Simulation changes

Do not infer dependency logic from multiple lines. Use explicit requirement groups.

Document availability, propagation order, convergence, warnings, explanations and limitations. Update `docs/scenario-and-requirement-engine.md`.

## Renderer changes

Do not change `scim-radial-1` output silently. A different paint order, palette, wrapping rule, geometry interpretation or fallback requires a new renderer profile.

Keep interaction overlays separate from deterministic exported SVG.

## AI collaboration changes

Provider adapters may transport handoffs and responses but must not write accepted state directly.

Required path:

```text
candidate -> parse -> validate -> compare -> human selection -> validate -> accepted revision
```

Preserve provider neutrality and explicit disclosure of data leaving the browser.

## Mobile and accessibility

- Use native Pointer Events.
- Use pointer capture during direct manipulation.
- Preserve Navigate and Edit modes.
- Provide touch-sized hit targets.
- Do not require hover or double-click for essential actions.
- Keep scenario preview read-only unless an explicit scenario-edit mode is designed.
- Use labelled native controls and visible focus.
- State known keyboard or screen-reader gaps honestly.

## Security

- Use synthetic infrastructure data in public code and tests.
- Never commit credentials or real operational vulnerabilities.
- Treat imports and AI responses as untrusted.
- Validate at every boundary.
- Escape model text rendered into SVG or HTML.
- Do not add automatic cloud or AI-provider transmission without an explicit security decision.

Read `SECURITY.md`.

## Documentation requirement

A task is incomplete when behaviour changes but documentation does not.

Update:

- README for user-visible routes or capability;
- architecture for data flow and boundaries;
- normative language/renderer docs for contracts;
- subsystem guide for implementation behaviour;
- roadmap for completed or newly discovered limitations;
- changelog for release work;
- an ADR for durable decisions.

Do not claim planned capability is implemented.

## Verification language

Be precise:

- `pnpm typecheck` passing means TypeScript passed.
- `pnpm build` passing means the production build completed.
- Vercel success means deployment succeeded.
- None of these alone means comprehensive tests passed.

## Final review checklist

1. The complete canonical document validates.
2. Parser/serializer round trips remain lossless where relevant.
3. Semantic and view changes are correctly separated.
4. Stable IDs are preserved.
5. Manual and AI provenance is correct.
6. Scenario explanations remain understandable.
7. Mobile pointer behaviour is safe.
8. Sensitive data is not exposed.
9. `pnpm verify` passes.
10. Documentation is current.
11. Known limitations are stated.
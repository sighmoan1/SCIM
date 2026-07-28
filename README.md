# Simple Critical Infrastructure Mapper (SCIM)

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://v0-simple-infrastructure-mapper.vercel.app/)

SCIM is a portable modelling workspace for understanding how infrastructure and social organisation protect people, how services depend on one another, what happens when systems degrade or fail, and what actions could improve resilience.

It combines:

- a canonical text-interpretable infrastructure model;
- a Mermaid-like SCIM language inside Markdown;
- a radial visual map for manual authoring;
- deterministic diagram rendering;
- scenario application and failure explanations;
- reviewable human and AI proposals;
- one shared revision history for accepted changes.

The project is not a generic flowchart editor and does not treat a chatbot response as an applied change.

## Current versions

- Application: **0.5.0**
- Portable SCIM schema/language: **0.2**
- Radial renderer profile: **`scim-radial-1`**

These versions are independent. A product release does not automatically change the portable language or deterministic renderer contract.

SCIM is pre-1.0. The canonical schema is currently broader than the lossless DSL subset; exact conformance and round-trip gaps are documented in [`docs/implementation-status.md`](docs/implementation-status.md).

## Use the application

Production:

<https://v0-simple-infrastructure-mapper.vercel.app/>

| Route | Purpose |
| --- | --- |
| `/` | Primary canonical visual map, mobile pointer editing, scenarios, revisions and exports |
| `/editor` | Advanced SCIM source editing, validation, deterministic preview and exports |
| `/review` | Compare and selectively accept a complete human or AI candidate model |
| `/legacy` | Preserved original mapper while specialist controls are migrated |

## Core product rule

> The accepted source of truth is one validated `ScimDocument`. Visual editing, text editing, scenarios and AI collaboration must preserve that canonical model.

Infrastructure meaning is separate from diagram layout. An AI can interpret the complete model as text without seeing the picture. A frozen view records the geometry required to reproduce a particular diagram.

## What the application supports

### Canonical modelling

- stable entities and directed relationships;
- locality/control layers;
- individual, group, organisational and state perspectives;
- needs, failure modes, delivery modes and service effects;
- canonical evidence, confidence and extensible attributes;
- explicit dependency requirement policies;
- scenarios as changes to a baseline;
- radial and INAM view data.

Evidence exists in the canonical JSON schema, but SCIM DSL 0.2 does not yet preserve it losslessly. Portable text currently supports scalar and string-list extension attributes. See the implementation-status guide before relying on richer round trips.

### Manual visual editing

- select, add, edit, move and delete entities;
- add and delete directed relationships;
- native Pointer Events for mouse, touch and pen;
- Navigate and Edit modes;
- browser panning and pinch zoom in Navigate mode;
- one human-origin revision per accepted action;
- undo of the latest accepted revision.

### Scenario reasoning

- apply explicit scenario operations;
- evaluate declared dependency requirements;
- conservatively propagate critical failures where no explicit policy exists;
- show changed objects, warnings and human-readable explanations;
- inspect scenarios without changing the accepted baseline.

### Human–AI collaboration

- copy a complete text-first handoff into any capable chat interface;
- include exact rendering instructions and authoritative SCIM source;
- require a complete candidate model with rationale, assumptions and open questions;
- compare semantic, scenario and view changes;
- accept or reject individual canonical operations;
- validate partial acceptance;
- record accepted AI work in the same revision history as manual edits.

The protocol is model-agnostic and can work with embedded assistants, ChatGPT, Claude, local models or organisational AI systems.

## Example SCIM

```scim
model clinic-resilience "Clinic resilience" {
  perspective: individual
  focus: patient

  entity patient "Patient" {
    kind: person
    layer: individual
  }

  entity clinic "Community clinic" {
    kind: healthcare
    layer: municipality
    supports: [injury, illness]
  }

  entity grid "Regional electricity grid" {
    kind: power
    layer: region
  }

  grid -> clinic {
    id: grid-clinic
    kind: supplies
    mode: grid
    critical: true
  }

  clinic -> patient {
    id: clinic-patient
    kind: protects
    critical: true
  }
}
```

This text defines the system structure. A separate frozen `view` block can reproduce the exact radial diagram without making coordinates part of the infrastructure meaning.

## Local development

Requirements:

- Node.js 20 or compatible current LTS;
- pnpm 10;
- Git.

```bash
git clone https://github.com/sighmoan1/SCIM.git
cd SCIM
pnpm install --no-frozen-lockfile
pnpm dev
```

Verify a change:

```bash
pnpm verify
```

This runs TypeScript checking and a production Next.js build. It is not yet comprehensive automated test coverage.

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before changing schema, language, rendering, persistence, mobile interaction or AI review behaviour. AI coding collaborators should also read [`AGENTS.md`](AGENTS.md).

## Documentation

Start with [`docs/index.md`](docs/index.md).

Key documents:

- [`docs/user-guide.md`](docs/user-guide.md) — current user journeys;
- [`docs/product-and-domain.md`](docs/product-and-domain.md) — purpose, SCIM concepts and product principles;
- [`docs/architecture.md`](docs/architecture.md) — current application architecture and data flow;
- [`docs/implementation-status.md`](docs/implementation-status.md) — exact capability and known contract gaps;
- [`docs/canonical-model-reference.md`](docs/canonical-model-reference.md) — canonical field and validation reference;
- [`docs/scim-language.md`](docs/scim-language.md) — normative SCIM 0.2 language reference;
- [`docs/library-api.md`](docs/library-api.md) — exported TypeScript API;
- [`docs/scim-radial-1.md`](docs/scim-radial-1.md) — deterministic radial renderer contract;
- [`docs/canonical-workspace.md`](docs/canonical-workspace.md) — primary map behaviour;
- [`docs/proposal-review.md`](docs/proposal-review.md) — human and AI review workflow;
- [`docs/ai-collaboration-protocol.md`](docs/ai-collaboration-protocol.md) — provider-neutral collaboration protocol;
- [`docs/workspace-and-revisions.md`](docs/workspace-and-revisions.md) — persistence, provenance and undo;
- [`docs/mobile-and-accessibility.md`](docs/mobile-and-accessibility.md) — interaction contract;
- [`docs/development-and-release.md`](docs/development-and-release.md) — CI, Vercel and release process;
- [`docs/testing-strategy.md`](docs/testing-strategy.md) — current and intended test coverage;
- [`docs/governance.md`](docs/governance.md) — roles and decision rights;
- [`docs/roadmap.md`](docs/roadmap.md) — known limitations and sequenced next work;
- [`SECURITY.md`](SECURITY.md) — sensitive infrastructure data and vulnerability handling.

## Current limitations

SCIM is pre-1.0. Important gaps are documented rather than hidden:

- canonical evidence, scenario timestamps and INAM notes are not yet lossless through SCIM DSL;
- nested extension values and some quoted-string cases are not yet robustly portable;
- automatic radial layout and strict missing-placement enforcement are not implemented;
- browser-local rather than shared cloud projects;
- no authentication or real-time collaboration;
- status-based rather than time-, capacity- or probability-based simulation;
- incomplete migration of impact zones, sector editing, resizing and route editing from `/legacy`;
- no embedded AI provider integration yet;
- incomplete automated test and accessibility coverage;
- local storage is not encrypted or a durable backup.

See [`docs/implementation-status.md`](docs/implementation-status.md) and [`docs/roadmap.md`](docs/roadmap.md).

## Data and AI safety

The primary map does not automatically upload models to an AI provider. A user deliberately copies or exports a handoff.

SCIM models may reveal sensitive infrastructure dependencies, capacities or vulnerabilities. Use synthetic examples in the public repository and read [`SECURITY.md`](SECURITY.md) before working with operational data.

## Repository structure

```text
app/                         Next.js routes and application shell
components/                  map, source and review workspaces
lib/scim/                    canonical schema, parser, renderer, simulation and collaboration logic
docs/                        product, architecture and contributor documentation
examples/                    executable portable SCIM models
advanced-infrastructure-mapper.tsx
                             preserved historical mapper
```

## Contributing

Contributors should preserve these boundaries:

- semantics are not inferred from layout;
- stable IDs are not renamed casually;
- scenarios remain changes to a baseline;
- published renderer profiles are immutable;
- AI output remains a proposal until human acceptance;
- human and AI accepted changes use the same canonical diff and history;
- primary interactions work with mouse, touch and pen;
- documentation changes with behaviour;
- schema, DSL and UI conformance gaps are stated honestly.

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

This work is licensed under the Creative Commons Attribution-Noncommercial-Share Alike 2.0 UK: England & Wales License.

To view a copy of this licence, visit <http://creativecommons.org/licenses/by-nc-sa/2.0/uk/> or write to Creative Commons, 171 Second Street, Suite 300, San Francisco, California, 94105, USA.

## Authors of SCIM

[resiliencemaps.org](https://resiliencemaps.org)

**Mike Bennett**  
As founder managing director of Plain Software, Mike played a vital role in the development of NHS Direct. He is now a strategic consultant on social, business and government resilience.

**Vinay Gupta**  
Co-editor of _Small is Profitable_ and _Winning the Oil Endgame_, Vinay focuses on whole-systems response to crisis and change mitigation.

**STAR-TIDES**  
SCIM is the underlying model for the US Department of Defense STAR-TIDES project on crisis response and humanitarian relief. See _Defense Horizons_ #70.
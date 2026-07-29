# Simple Critical Infrastructure Mapper (SCIM)

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://v0-simple-infrastructure-mapper.vercel.app/)

SCIM is a portable modelling and scenario-planning workspace for understanding how infrastructure and social organisation protect life, how services depend on one another, what can fail, what fails next, and what actions could improve resilience.

It is designed so the same system can be:

- edited manually as a visual map;
- written, reviewed and versioned as text;
- interpreted by an AI without relying on an image;
- rendered deterministically into a reproducible diagram;
- tested against explicit scenarios;
- changed through reviewable human and AI proposals;
- carried between tools without depending on one model provider or one proprietary interface.

SCIM is **not** a generic flowchart editor. The diagram is one view over a structured infrastructure model, and a chatbot response is never treated as an accepted change merely because it sounds plausible.

## Current versions

- Application: **0.7.0**
- Portable SCIM schema/language: **0.2**
- Radial renderer profile: **`scim-radial-1`**

These versions are independent:

- the application version describes the user-facing product;
- the schema version describes the portable model and language;
- the renderer profile describes the deterministic visual contract.

A product release does not automatically change either the portable language or an existing renderer profile.

SCIM is pre-1.0. The canonical schema is currently broader than the lossless DSL subset; exact conformance and round-trip gaps are documented in [`docs/implementation-status.md`](docs/implementation-status.md).

## Production application

<https://v0-simple-infrastructure-mapper.vercel.app/>

| Route | Purpose |
| --- | --- |
| `/` | Home dashboard: live protected/at-risk status for the six needs, plain-language explanations and a guided per-need builder |
| `/emergency` | Mobile-first emergency workspace: report infrastructure down, see propagated impact on needs and surviving backups |
| `/map` | Interactive canonical radial map with zoom/fit, native pointer editing, delivery paths, scenarios and revisions |
| `/matrix` | The canonical INAM needs matrix — the eighteen needs across the four tiers, read against the layers of provision |
| `/more` | Plain-language SCIM explanation, AI collaboration, export/backup, examples and advanced-tool links |
| `/editor` | Advanced SCIM text authoring, validation, deterministic preview and exports |
| `/review` | Compare and selectively accept a complete human or AI candidate model |
| `/legacy` | Preserved original mapper while specialist controls are migrated |

Navigation is a bottom tab bar on phones (Home, Map, Emergency, More) and a top bar on larger screens. The application ships light and dark themes (following the system by default), an installable web app manifest, and an animated six-segment resilience ring summarising need status on Home.

The production application should deploy from `main`. The interface displays application, schema and build information so a deployed build can be checked against the repository commit.

## Why this application exists

Critical-infrastructure maps are often useful to look at but difficult to reason about systematically. Meaning may be hidden in box position, colour or an undocumented line. The source may be trapped in one drawing tool. A scenario may be represented as another copied picture. An AI may produce convincing prose without returning a model that can be inspected, compared or reused.

SCIM addresses those problems by making the infrastructure system itself explicit:

- **entities** say what people, services, facilities, resources and organisations exist;
- **directed relationships** say what provides or enables what;
- **needs and locality layers** say who or what is protected and at what level systems are organised;
- **dependency requirements** state whether all, any or a minimum number of providers are required;
- **scenarios** state what changes from the accepted baseline;
- **views** state how a particular diagram should be drawn;
- **evidence, assumptions and open questions** make uncertainty visible;
- **revisions** record what changed, who or what proposed it, and how it can be undone.

The aim is to turn a diagram into a portable shared model that can support human discussion, AI collaboration, scenario analysis and eventually structured plans of action.

## Application goals

### 1. Make infrastructure dependencies understandable

A user should be able to trace how a person, group, organisation or state depends on services and resources, and how those dependencies ultimately protect concrete needs.

For an individual-focused map, the foundational needs are the six immediate threats to life:

| Service family | Needs / threats |
| --- | --- |
| Shelter | `too-hot`, `too-cold` |
| Supply | `hunger`, `thirst` |
| Safety | `illness`, `injury` |

The same model can also represent group, organisational and nation-state requirements such as communications, transport, shared plans, jurisdiction and effective organisations.

### 2. Preserve one accepted model across visual, textual and AI work

A user should not have one model in a diagram, another in JSON, another in a chat and another inside React state. Visual editing, text authoring, simulation and proposal review should converge on one validated `ScimDocument`.

### 3. Make the entire system interpretable without an image

An AI or human collaborator must be able to understand the entities, dependencies, needs, scenarios and uncertainty from text alone. Coordinates, rings, sectors, colours and routes reproduce a view; they do not secretly define infrastructure meaning.

### 4. Support exact reproducible diagrams

When a view is frozen, another compatible tool or capable AI should be able to recreate the same layout using the declared canvas, rings, sectors, node positions, sizes and relationship routes. Visual compatibility is versioned through immutable renderer profiles.

### 5. Support transparent scenario planning

A scenario should be an explicit set of changes to the accepted baseline rather than a duplicated map. The application should show direct scenario changes, propagated dependency failures, warnings and human-readable explanations.

### 6. Enable safe human–AI collaboration

A user should be able to ask an AI to expand a model, challenge assumptions, identify single points of failure, create scenarios or propose mitigations. The AI must return a complete candidate model with rationale, assumptions and open questions. The user reviews canonical changes before anything becomes accepted state.

### 7. Keep manual modelling first-class

AI assistance should not replace direct human editing. People must remain able to create, inspect, move and connect infrastructure objects without using a chatbot or writing raw source.

### 8. Make changes attributable and reversible

Accepted manual and AI-origin changes should use the same canonical diff and revision history. A user should be able to see whether a change was human- or AI-originated and undo accepted work.

### 9. Work on phones and tablets as well as desktops

Core inspection, movement, creation, scenario review and proposal acceptance should work with mouse, touch and pen. Primary workflows must not depend on hover, double-click or tiny desktop-only controls.

### 10. Remain portable and provider-neutral

The core model and proposal protocol should work with embedded assistants, ChatGPT, Claude, organisational systems and local models. The application should not require one AI vendor to understand or preserve the model.

### 11. Progress from failure mapping to action planning

The longer-term product should help users propose and compare structured interventions and plans of action: who acts, what resources are required, what prerequisites exist, what effect is expected and what remains uncertain. Plans must remain reviewable structure rather than disappearing into chat prose.

## Core product rule

> The accepted source of truth is one validated `ScimDocument`. Visual editing, text editing, scenarios, simulation and AI collaboration must preserve that canonical model.

Every feature should be able to answer:

1. Which canonical fields does it read or change?
2. Is the change semantic, scenario-related, view-only or a combination?
3. How is it represented in portable text?
4. Can it be reviewed, validated and undone?
5. What evidence or assumptions support it?
6. Does it expose any sensitive information to an external service?

## Design decisions so far

The detailed records live in [`docs/decisions/`](docs/decisions/). The decisions below describe the architecture the project is committed to preserving.

### Decision 1: use a canonical text-first model

The original mapper mixed infrastructure meaning, scenario state and screen coordinates inside one large React component. That was effective for prototyping but made exchange, validation, simulation and AI collaboration difficult.

SCIM therefore uses a Zod-validated `ScimDocument` as accepted state and SCIM Markdown containing a fenced Mermaid-like DSL as the primary portable human/AI format.

JSON remains useful for machine interchange and browser persistence, but it is not the main format people are expected to discuss or author.

**Consequences:**

- visual, text and AI authors converge on one schema;
- stable IDs support references, diffs and revision history;
- parser and serializer behaviour becomes a product contract;
- schema migration must be explicit;
- a feature is incomplete when its meaning exists only in component-local UI state.

See [ADR 0001](docs/decisions/0001-canonical-text-first-model.md).

### Decision 2: separate semantics from views

Infrastructure meaning belongs in entities, directed relationships, requirements, scenarios, evidence and attributes. Presentation belongs in explicit versioned views.

A frozen radial view may repeat facts visually, such as showing an entity in a locality ring, but its coordinates do not create those facts.

**Interpretation rules:**

- proximity does not create a relationship;
- ring placement does not replace an entity's declared locality layer;
- sector placement does not assert a supported need;
- line colour or shape does not alter relationship meaning;
- multiple incoming lines do not define AND/OR logic;
- moving a node changes a view, not the infrastructure system.

**Consequences:**

- one semantic model can support radial, INAM, dependency, geographic or timeline views;
- view-only proposal changes can be distinguished from infrastructure changes;
- automatic layout cannot silently become authoritative;
- editors must make semantic and visual changes visibly different.

See [ADR 0002](docs/decisions/0002-separate-semantics-from-views.md).

### Decision 3: make relationships directed and dependency logic explicit

Every relationship points from **provider or enabler** to **receiver**.

For example:

```text
regional grid -> hospital -> patient
```

Several incoming relationships do not, by themselves, say whether all providers are needed, any one is sufficient, or a threshold is required. SCIM therefore uses explicit requirement groups with `all`, `any` and `at-least` policies.

**Consequences:**

- AIs and simulators do not guess redundancy from labels or drawing layout;
- ambiguous dependency logic remains visible as a question;
- scenario propagation can explain exactly why a requirement became unsatisfied.

See [`docs/dependency-requirements.md`](docs/dependency-requirements.md).

### Decision 4: represent scenarios as changes to a baseline

A scenario is an ordered set of explicit operations against the accepted model, not another complete copied map.

The current engine:

1. applies declared scenario changes to a validated clone;
2. evaluates explicit dependency requirements;
3. applies a conservative fallback rule where no requirement is declared;
4. returns changed IDs, warnings and explanation traces.

**Consequences:**

- the baseline remains intact;
- direct scenario assumptions can be separated from propagated results;
- scenarios can be compared and versioned;
- the current status engine does not pretend to model time, capacity, probability or resource depletion.

See [`docs/scenario-and-requirement-engine.md`](docs/scenario-and-requirement-engine.md).

### Decision 5: version deterministic renderer profiles

`scim-radial-1` defines the exact radial rendering contract: paint order, geometry interpretation, palette, status styles, edge styles and label wrapping.

Published profiles are immutable. A materially different rendering algorithm receives a new profile ID rather than changing historical diagrams silently.

**Consequences:**

- the same frozen view remains reproducible;
- visual changes can be tested independently from semantic changes;
- interaction overlays are kept separate from exported deterministic SVG;
- small visual improvements may require a new profile when they alter the contract.

See [`docs/scim-radial-1.md`](docs/scim-radial-1.md).

### Decision 6: treat AI output as a proposal, never a hidden mutation

An AI returns:

- a proposal title;
- rationale;
- explicit assumptions;
- open questions;
- one complete candidate SCIM model.

The application compares that candidate with the accepted baseline, presents canonical operations, allows individual acceptance or rejection, validates the resulting combination and records an AI-origin revision only after human acceptance.

**Rejected approaches:**

- giving an AI direct write access to accepted state;
- accepting prose and asking the application to infer hidden changes;
- requiring a provider-specific patch format.

**Consequences:**

- AI work is attributable, inspectable and reversible;
- invalid partial proposals are blocked;
- stable IDs can be checked;
- the workflow is deliberately more careful than direct chat-driven editing;
- human review remains necessary and does not prove domain correctness by itself.

See [ADR 0003](docs/decisions/0003-ai-output-is-a-proposal.md).

### Decision 7: use one revision model for human and AI changes

Manual edits are accepted immediately but recorded as human-origin revisions. Reviewed AI candidate changes become AI-origin revisions. Both use the same deterministic document comparison and complete before/after snapshots.

**Consequences:**

- provenance does not require a separate AI subsystem;
- undo works across manual and reviewed AI changes;
- semantic, scenario and view changes use one comparison model;
- a completed node drag records one view revision rather than one revision per movement frame.

See [`docs/workspace-and-revisions.md`](docs/workspace-and-revisions.md).

### Decision 8: stabilise a local-first workspace before cloud collaboration

The current accepted document and latest revision history are stored in browser local storage. External AI use happens only when a user deliberately copies or exports a handoff.

This avoids introducing accounts, permissions, synchronisation, retention and disclosure rules before the canonical model and review workflow are stable.

**Consequences:**

- the application can be used without an account or server;
- the user controls whether model content is sent to an AI provider;
- state is limited to one browser profile and device;
- local storage is not encrypted or a durable backup;
- future cloud projects must preserve canonical documents, proposals and provenance rather than replacing them with a UI-specific database graph.

See [ADR 0004](docs/decisions/0004-browser-local-first-workspace.md).

### Decision 9: use native Pointer Events and preserve the legacy mapper during migration

The original mapper used desktop mouse events and component-local state. A temporary touch-to-mouse bridge improved accessibility but retained the wrong architecture.

The primary `/` route now uses native Pointer Events, pointer capture, explicit Navigate/Edit modes and canonical view revisions. The historical mapper remains at `/legacy` until its specialist capabilities have canonical replacements.

**Consequences:**

- mouse, touch and pen use one interaction model;
- Navigate mode preserves ordinary panning and pinch zoom;
- scenario previews remain read-only;
- the project temporarily maintains two mapper routes;
- new product capability should target canonical state rather than extending the legacy private model.

See [ADR 0005](docs/decisions/0005-native-pointer-events-and-legacy-preservation.md).

### Decision 10: preserve visible uncertainty

Facts, evidence, assumptions, unknowns, scenario conditions and recommendations must remain distinguishable. An AI-generated value does not become verified because it is precise or confidently worded.

**Consequences:**

- missing information should generate an open question rather than a hidden guess;
- evidence and confidence are canonical concepts;
- current evidence round-trip limitations are documented instead of concealed;
- future action planning must distinguish expected effects from observed results.

See [`docs/implementation-status.md`](docs/implementation-status.md) and [`docs/action-planning-design.md`](docs/action-planning-design.md).

### Decision 11: remain provider-neutral

The portable handoff includes interpretation rules, a text-only structural reading, deterministic renderer instructions and the complete authoritative SCIM source. It can be pasted into different AI systems.

An embedded provider adapter may later automate transport, but it must still return candidate data through the same parse, compare, review and validation boundary.

**Consequences:**

- no provider receives direct write access to accepted state;
- the model remains usable with local or organisational systems;
- provider disclosure and retention must be explicit;
- copy/paste remains a valid fallback even after embedded integrations exist.

See [`docs/ai-collaboration-protocol.md`](docs/ai-collaboration-protocol.md).

### Decision 12: document implemented capability separately from intended design

SCIM is being developed iteratively. The repository distinguishes:

- canonical-schema capability;
- lossless DSL capability;
- current interface capability;
- normative intended behaviour;
- proposed future designs.

**Consequences:**

- documentation does not describe planned features as though they are complete;
- known parser, serializer, evidence, layout and accessibility gaps remain visible;
- tests and migration decisions are required before a gap is declared closed.

See [`docs/implementation-status.md`](docs/implementation-status.md).

### Decision 13: lead the interface with the six needs

The primary interface derives plain-language answers ("Am I protected from thirst?", "What did this failure put at risk?") from the canonical model, instead of opening on model machinery. The Home dashboard and Emergency workspace are read-only projections plus ordinary revisions; the canonical map, text editor and review workflow remain first-class underneath.

**Consequences:**

- need status is presentation logic, not a schema concept;
- guided additions produce complete validated canonical changes;
- emergency status reports share the same revision history as map edits;
- the fresh-workspace default is a personal household starter model.

See [ADR 0006](docs/decisions/0006-needs-first-interface.md).

## Current architecture

```text
SCIM Markdown / DSL
        |
        | parse + validate
        v
canonical ScimDocument <------ manual visual edits
        |
        +------> deterministic views and exports
        |
        +------> scenario application and explanations
        |
        +------> text-only AI handoff
        |
        +------> browser-local accepted state and revisions
        ^
        |
complete human/AI candidate
        |
        | compare -> select -> validate -> accept
        +-----------------------------------------
```

The canonical library is deliberately separated from the interface:

```text
lib/scim/schema.ts           canonical Zod model
lib/scim/parser.ts           SCIM text -> canonical model
lib/scim/serializer.ts       canonical model -> SCIM text / graph exports
lib/scim/radial-svg.ts       deterministic radial SVG
lib/scim/requirements.ts     explicit dependency policies
lib/scim/simulation.ts       scenario application and propagation
lib/scim/diff.ts             deterministic document comparison
lib/scim/diff-apply.ts       selective proposal application
lib/scim/handoff.ts          portable AI handoff
lib/scim/proposal.ts         proposal request and response format
lib/scim/workspace.ts        accepted local state and revisions
lib/scim/legacy-adapter.ts   historical mapper conversion
```

See [`docs/architecture.md`](docs/architecture.md) and [`docs/library-api.md`](docs/library-api.md).

## What the application currently supports

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

## Primary user journeys

### Understand your own resilience (start here)

Open the Home dashboard. Each of the six needs shows what currently protects it and whether that protection is working. Tap a need, answer its plain-language question ("Where does your drinking water come from?") and add the things you actually rely on — suggestions create the entity, its typical upstream dependency, the protecting relationship and a deterministic radial placement as one validated revision.

### Respond during a failure

Open Emergency on a phone. Mark what has stopped working with large touch targets. The app propagates critical failures through the canonical model, shows which of the six needs are now at risk and why, and highlights backups that still work. Every report is an ordinary human-origin revision: undoable, attributable and visible on the map.

### Build a map manually

Create and edit entities, connect providers to receivers, place nodes in a frozen radial view and preserve each accepted action in revision history.

### Author the complete model as text

Use SCIM Markdown and DSL to inspect or edit the whole system, validate it, render it, simulate it and export derived JSON, Mermaid, DOT or SVG representations.

### Ask an AI to analyse or extend the model

Copy a complete handoff and ask an AI to identify missing dependencies, challenge assumptions, create a scenario, explain failure chains or propose mitigations. Import the complete candidate response into Review rather than applying prose manually.

### Review a proposal

Compare accepted and candidate documents, inspect semantic/scenario/view changes, accept or reject individual operations and validate the partial result before committing one revision.

### Explore a scenario

Apply explicit scenario operations, evaluate requirements, inspect propagated statuses and read why each result occurred without changing the accepted baseline.

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

  entity generator "Clinic backup generator" {
    kind: power
    layer: municipality
  }

  grid -> clinic {
    id: grid-clinic
    kind: supplies
    mode: grid
    critical: true
    requirement-group: clinic-power
    requirement-policy: any
    minimum-available: 1
    when-unsatisfied: failed
  }

  generator -> clinic {
    id: generator-clinic
    kind: backup-for
    mode: on-site
    critical: true
    requirement-group: clinic-power
    requirement-policy: any
    minimum-available: 1
    when-unsatisfied: failed
  }

  clinic -> patient {
    id: clinic-patient
    kind: protects
    critical: true
  }
}
```

This means the grid and generator are alternative power providers for the clinic, the clinic protects the patient, and the clinic power requirement is satisfied while at least one provider path remains available. A separate frozen `view` block can reproduce an exact radial diagram without making coordinates part of the infrastructure meaning.

## Current non-goals

SCIM is not yet:

- a geographic information system;
- a real-time operational command platform;
- an authoritative infrastructure database;
- a probabilistic or capacity-aware simulator;
- a multi-user cloud collaboration service;
- an autonomous planning or decision system;
- a substitute for domain experts, operational validation or legal authority;
- a guarantee that an AI-generated model, scenario or plan is correct.

The current product is a portable, reviewable modelling and scenario-planning workspace.

## Current limitations

Important gaps are documented rather than hidden:

- canonical evidence, scenario timestamps and INAM notes are not yet lossless through SCIM DSL;
- nested extension values and some quoted-string cases are not yet robustly portable;
- automatic radial layout and strict missing-placement enforcement are not implemented;
- the source editor is not yet a fully transactional editor of the accepted browser-local workspace;
- persistence is browser-local rather than a shared project service;
- there is no authentication or real-time collaboration;
- simulation is status-based rather than time-, capacity-, resource- or probability-based;
- impact zones, sector editing, resizing and route editing are not fully migrated from `/legacy`;
- there is no embedded AI provider integration yet;
- automated test and accessibility coverage remain incomplete;
- local storage is not encrypted or a durable backup.

See [`docs/implementation-status.md`](docs/implementation-status.md) and [`docs/roadmap.md`](docs/roadmap.md).

## Roadmap direction

The intended sequence is:

1. **0.5.x hardening** — round-trip tests, evidence portability, parser correctness, renderer tests, persistence recovery, deployment consistency and mobile browser journeys.
2. **Complete canonical authoring** — migrate sectors, impact zones, node sizing, routes, rich metadata and source-workspace integration away from the legacy model.
3. **Richer scenarios and action planning** — time, stocks, capacity, restoration, interventions, ownership, prerequisites, resources and competing plans.
4. **Embedded provider-neutral AI** — reduce copy/paste friction while preserving explicit payload disclosure, proposal review and human acceptance.
5. **Shared projects** — authentication, permissions, comments, proposal branches, durable revisions and offline synchronisation without abandoning portable SCIM.

Correctness, explanation and reviewability take priority over automation.

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
- [`docs/scenario-and-requirement-engine.md`](docs/scenario-and-requirement-engine.md) — simulation semantics;
- [`docs/canonical-workspace.md`](docs/canonical-workspace.md) — primary map behaviour;
- [`docs/proposal-review.md`](docs/proposal-review.md) — human and AI review workflow;
- [`docs/ai-collaboration-protocol.md`](docs/ai-collaboration-protocol.md) — provider-neutral collaboration protocol;
- [`docs/workspace-and-revisions.md`](docs/workspace-and-revisions.md) — persistence, provenance and undo;
- [`docs/action-planning-design.md`](docs/action-planning-design.md) — proposed structured action planning;
- [`docs/mobile-and-accessibility.md`](docs/mobile-and-accessibility.md) — interaction contract;
- [`docs/development-and-release.md`](docs/development-and-release.md) — CI, Vercel and release process;
- [`docs/testing-strategy.md`](docs/testing-strategy.md) — current and intended test coverage;
- [`docs/governance.md`](docs/governance.md) — roles and decision rights;
- [`docs/roadmap.md`](docs/roadmap.md) — known limitations and sequenced next work;
- [`SECURITY.md`](SECURITY.md) — sensitive infrastructure data and vulnerability handling.

## Data and AI safety

The primary map does not automatically upload models to an AI provider. A user deliberately copies or exports a handoff.

SCIM models may reveal sensitive infrastructure dependencies, capacities, vulnerabilities or operational plans. Use synthetic examples in the public repository and read [`SECURITY.md`](SECURITY.md) before working with operational data.

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
- dependency logic is explicit rather than visually inferred;
- published renderer profiles are immutable;
- AI output remains a proposal until human acceptance;
- human and AI accepted changes use the same canonical diff and history;
- primary interactions work with mouse, touch and pen;
- sensitive data is not transmitted implicitly;
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
# SCIM roadmap

This roadmap describes current capability and likely sequencing. It is not a promise of dates. Work should remain driven by user learning while protecting the canonical model and trust boundaries.

## Current release: application 0.5.0

### Complete foundations

- SCIM schema 0.2 and Zod validation;
- portable Markdown and Mermaid-like SCIM DSL;
- canonical parser and serializer;
- text-only structural projection for AI interpretation;
- deterministic `scim-radial-1` SVG rendering;
- INAM view data;
- explicit dependency requirement policies;
- scenario application and deterministic status propagation;
- human-readable simulation explanations;
- proposal request and complete-candidate response protocol;
- deterministic canonical diff;
- selective proposal acceptance and validation;
- primary canonical visual map;
- native Pointer Events for mouse, touch and pen;
- shared human/AI browser-local revision history;
- local undo;
- model-agnostic external AI handoff;
- preserved legacy mapper at `/legacy`;
- GitHub type-check/build verification and Vercel deployment.

## Known limitations

### Canonical visual editing

The primary map does not yet provide all specialist controls from the legacy mapper:

- threat-sector editing;
- impact-zone modelling and editing;
- routed edge editing;
- node resizing;
- rich relationship editing;
- layer and ring editing;
- direct scenario editing on the canvas.

### Source workspace integration

`/editor` provides advanced source editing and exports but does not yet act as a fully transactional editor of the accepted browser-local workspace. Loading and replacing accepted state should be explicit and reviewable.

### Scenario engine

Current simulation is deterministic and status-based. It does not yet model:

- time progression;
- resource stocks and depletion;
- demand and capacity;
- restoration duration;
- probability or uncertainty ranges;
- geographic constraints;
- actor decisions;
- structured interventions and plans of action.

### Collaboration

Current collaboration is one browser profile on one device. There is no:

- authentication;
- server persistence;
- multi-user project;
- real-time collaboration;
- comments;
- roles and permissions;
- competing branches;
- durable organisational audit log.

### AI integration

AI use currently relies on portable copy and paste. There is no embedded provider adapter, automatic source retrieval or tool protocol. This is intentional until provider disclosure and review controls are designed.

### Testing

CI performs type-checking and production build. Comprehensive automated schema, parser, renderer, simulation, component and browser tests remain to be added.

### Accessibility

The primary map has native touch support and labelled controls, but known gaps include:

- keyboard node movement;
- screen-reader graph traversal;
- automated accessibility checks;
- fully contextual mobile inspectors;
- accessible canvas relationship creation.

## Next: 0.5.x hardening

Focus on correctness and recovery before adding major capability.

- establish Vitest and golden SCIM round-trip tests;
- add renderer snapshot tests for `scim-radial-1`;
- add workspace persistence and undo tests;
- add proposal partial-acceptance tests;
- add Playwright smoke journeys for desktop and mobile;
- fix usability defects found in production;
- add explicit reset, import and recovery controls for local workspace;
- normalise pnpm lockfile handling and restore frozen installs if practical;
- audit peer-dependency warnings;
- improve error messages and empty states.

## Proposed 0.6: complete canonical authoring

Goal: remove the need to use `/legacy` for ordinary SCIM mapping.

- canonical ring and sector editing;
- canonical impact-zone schema and view support;
- node resize and edge-route editing with touch-sized handles;
- relationship inspector for kind, mode, criticality, service effects, requirements, notes and evidence;
- entity inspector for failure modes, evidence, attributes and confidence;
- explicit source-editor integration with accepted workspace;
- canonical import of legacy JSON through a review step;
- export of complete workspace and revision history;
- keyboard movement and selection of map nodes;
- contextual mobile bottom sheets;
- deprecation plan for the legacy route.

## Proposed 0.7: richer scenarios and plans of action

Goal: move from static failure states to transparent crisis planning.

- ordered or timestamped scenario events;
- resource quantities, units and stocks;
- consumption and replenishment rates;
- capacity and demand;
- delayed degradation and failure;
- restoration events;
- explicit uncertainty ranges;
- structured interventions;
- action ownership, prerequisites, resources, duration and expected effects;
- baseline versus scenario comparison;
- competing response-plan comparison;
- explanation traces for every propagated outcome.

A plan must be modelled as reviewable structure rather than hidden in chat prose.

## Proposed 0.8: embedded AI collaboration

Goal: reduce copy/paste friction without changing the trust model.

- model-provider adapter interface;
- explicit outbound payload preview;
- user-selected provider or local model;
- streamed proposal generation;
- operation-level comments and questions;
- proposal overlays on the map;
- AI commands such as expand, challenge, simulate and propose mitigations;
- evidence and assumption labelling;
- provider disclosure and retention information;
- no direct provider write access to accepted state.

The portable handoff remains available and authoritative.

## Proposed 0.9: shared projects

Goal: enable durable collaboration between people and AIs.

- authenticated projects;
- encrypted transport and server persistence;
- project membership and permissions;
- named revisions;
- proposal branches;
- comments and review decisions;
- conflict handling;
- audit history;
- data classification and retention controls;
- offline cache and synchronisation;
- export of the complete portable project.

The server should store canonical SCIM and revisions, not a UI-specific graph format.

## Future research

Potential later work includes:

- geographic and network-topology views;
- probabilistic simulation;
- optimisation of intervention portfolios;
- live operational data adapters;
- sensor or incident-event ingestion;
- organisational decision and responsibility mapping;
- cross-model AI evaluation;
- domain-specific model packs;
- privacy-preserving local inference;
- formal verification of dependency policies;
- larger-scale graph performance.

These should not be added until the core modelling semantics and review workflow have proven useful with real users.

## Sequencing principles

1. Correctness before automation.
2. Canonical model before new visual controls.
3. Reviewable operations before embedded AI convenience.
4. Explanation before more sophisticated simulation.
5. Local recovery before cloud synchronisation.
6. Mobile and accessibility in each release, not as a final phase.
7. Synthetic examples before operationally sensitive data.
8. Maintain portable text even when richer services are added.

## How to update this roadmap

When a capability is completed:

- move it into the current-release section;
- update the relevant architecture and user documentation;
- remove or revise the limitation honestly;
- add the release to `CHANGELOG.md`;
- do not leave completed work described as future work.

When discovering a new limitation, add it immediately rather than waiting for a release.
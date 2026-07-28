# Product and domain guide

## Purpose

SCIM helps people reason about how infrastructure and social organisation protect life, how services depend on one another, what can fail, what fails next, and what actions could improve resilience.

It is not a generic diagramming application. The diagram is a view over a structured model. The structured model must remain understandable as text and usable by people, software and AI systems.

## The domain foundation

The implementation is grounded in the original Simple Critical Infrastructure Maps framework.

### Immediate individual needs

SCIM begins with six immediate threats to life:

| Service family | Need / threat |
| --- | --- |
| Shelter | `too-hot`, `too-cold` |
| Supply | `hunger`, `thirst` |
| Safety | `illness`, `injury` |

A useful infrastructure chain should ultimately be traceable to a person or group and the needs it protects.

### Locality and control

The standard layers are:

1. `individual`
2. `household`
3. `neighbourhood`
4. `municipality`
5. `region`
6. `country`
7. `world`

A layer is a semantic statement about the practical level at which an entity is controlled, supplied or organised. A ring in a radial view is only a visual repetition of that declared fact.

### Cooperation perspectives

A model may use one perspective or integrate several:

- `individual`
- `group`
- `organisation`
- `nation-state`
- `integrated`

The standard non-individual needs are:

| Perspective | Needs |
| --- | --- |
| Group | communications, transport, space, resource control |
| Organisation | shared map, shared plan, shared succession |
| Nation state | jurisdiction, citizens, territory, effective organisations, international recognition |

### Failure and service analysis

Standard infrastructure failure modes are:

- neglect;
- time and wear;
- operators;
- system externalities;
- economics;
- violence or disaster.

Standard service effects are:

- provision — whether a service is available;
- cost — whether it remains affordable;
- quality — whether it remains adequate and safe.

Standard delivery paths are:

- on-site;
- grid;
- delivery;
- fetch.

These are model fields, not presentation labels. They are intended to support scenario analysis, questioning and simulation.

## Primary user journeys

### Manual mapping

A person can create and edit entities, directed relationships and frozen radial positions on the map. Manual editing must remain a first-class capability even as AI assistance becomes more prominent.

### Text authoring

A person can author or inspect the complete model in SCIM Markdown and the SCIM DSL. The same source can be validated, rendered, simulated, copied and versioned.

### AI-assisted modelling

A person can copy a self-contained model into any capable AI interface and ask it to:

- identify missing entities or dependencies;
- challenge assumptions;
- create or extend scenarios;
- identify single points of failure;
- explain likely failure chains;
- propose mitigations or plans of action;
- return a complete candidate SCIM model.

The AI does not directly mutate the accepted model. Its response is reviewed as a structured proposal.

### Scenario planning

A person can apply a scenario to the accepted baseline, inspect changed statuses and read an explanation of propagated failures. Scenario viewing is read-only so the baseline cannot be changed accidentally while inspecting a simulated state.

## Product principles

### One accepted canonical model

The visual map, text editor, scenario engine and proposal review must operate on `ScimDocument`. A feature must not create a separate private representation that becomes a competing source of truth.

### Structure before layout

An AI must be able to understand the entities, needs, dependencies, evidence and scenario changes without seeing a rendered diagram. Coordinates, colours and routes reproduce a view; they do not define the infrastructure meaning.

### Directed and explicit relationships

Relationship direction is provider or enabler to receiver. Hidden meaning must not be inferred from proximity, line shape or visual grouping.

### Visible uncertainty

Facts, evidence, assumptions, unknowns and recommendations must remain distinguishable. The application must not present an inferred capacity or dependency as verified merely because an AI supplied it.

### Reviewable changes

Human and AI changes use the same canonical diff representation and revision history. AI-origin changes require explicit human acceptance. Manual changes are accepted immediately but remain attributable and reversible.

### Model-agnostic AI integration

The portable handoff and proposal protocol must work with embedded assistants, ChatGPT, Claude, local models and organisational AI systems. Core modelling must not depend on a single provider.

### Local-first safety

The map does not automatically upload infrastructure data to an AI service. The user deliberately copies or exports a handoff. Future cloud collaboration must preserve explicit control over storage and AI disclosure.

### Mobile is a primary environment

Core inspection, movement, creation, scenario review and proposal acceptance must work on phones and tablets. Desktop-only hover, double-click and mouse-specific behaviour are not acceptable for primary workflows.

### Build, measure and improve

The project is code-first and lean. Architectural discipline exists to protect the model and trust boundaries, not to require a complete formal design before learning from working software.

## Non-goals at the current stage

The project is not yet:

- a geographic information system;
- a real-time operational command platform;
- a probabilistic infrastructure simulator;
- a multi-user cloud collaboration service;
- an authoritative source of infrastructure facts;
- a replacement for domain experts or operational validation;
- a guarantee that an AI-generated scenario is correct.

These may inform later work, but the current product is a portable, reviewable modelling and scenario-planning workspace.

## Definition of a trustworthy feature

A feature is trustworthy when a collaborator can answer:

1. What canonical fields does it read or change?
2. Does it change semantics, a scenario, a view, or more than one?
3. How is the change represented in text?
4. Can the result round-trip through the parser and serializer?
5. Can a person inspect and undo the change?
6. Is the origin recorded as human or AI?
7. What assumptions or evidence support it?
8. Does it work with mouse, touch, pen and keyboard where relevant?
9. Does it preserve frozen geometry unless the user intended a layout change?
10. Does it expose sensitive data to any external service?
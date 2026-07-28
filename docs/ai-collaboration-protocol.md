# Human–AI collaboration protocol

## Purpose

SCIM allows a person to work with an embedded assistant, a public chat product, an organisational model or a local model without allowing conversational prose to mutate the accepted infrastructure model invisibly.

The protocol is provider-neutral and text-first.

## Roles

### Accepted workspace

The validated `ScimDocument` currently accepted by the human reviewer.

### Requesting human

The person who chooses what context to share, asks for analysis and decides whether any proposal is accepted.

### AI collaborator

A model that may interpret, question, extend, simulate or propose changes. Its output is untrusted candidate data until reviewed.

### Reviewer

The person who inspects rationale, assumptions, open questions and canonical operations before accepting a result.

The requester and reviewer may be the same person, but the review step remains explicit.

## Protocol overview

```text
accepted ScimDocument
        |
        | generate handoff / proposal request
        v
portable Markdown package
        |
        | paste or send deliberately
        v
AI analysis and complete candidate model
        |
        | paste into Review workspace
        v
parse -> validate -> compare -> select operations -> validate
        |
        | explicit human acceptance
        v
new accepted ScimDocument + AI-origin revision
```

## Outbound handoff

`serializeScimAiHandoff` creates a self-contained Markdown package containing:

1. SCIM language and renderer identifiers;
2. interpretation rules;
3. a deterministic text-only structural reading;
4. exact frozen radial rendering instructions;
5. the complete authoritative fenced `scim` block.

The structural reading helps an AI understand the graph without drawing it. The fenced SCIM source remains authoritative if any generated explanation differs.

## Proposal request

`serializeScimProposalRequest` wraps the handoff with a specific task and a required response format.

A useful request names the analytical objective, for example:

- review this model for missing critical dependencies;
- identify single points of failure;
- create a 72-hour regional power-outage scenario;
- challenge unsupported assumptions;
- propose three mitigation options;
- add a plan of action while preserving the accepted baseline;
- compare an intervention with the current scenario.

The request must not imply that the AI may silently rewrite the accepted model.

## Required AI response

A reviewable response has this form:

~~~markdown
# Proposal title

## Rationale

Explain each proposed change and the problem it addresses.

## Assumptions

- State every new assumption.

## Open questions

- State unresolved questions for a human or domain expert.

## Complete candidate model

```scim
model example "Complete candidate" {
  # The whole model, not a patch or fragment.
}
```
~~~

The complete candidate model makes comparison deterministic and avoids depending on a model-specific patch language.

## AI interpretation rules

An AI collaborator must:

- treat the fenced `scim` block as authoritative;
- understand semantic structure before considering view geometry;
- preserve stable IDs for unchanged objects;
- interpret relationship arrows as provider or enabler to receiver;
- preserve frozen view geometry unless layout change is explicitly requested;
- distinguish facts, evidence, assumptions, scenario conditions and recommendations;
- avoid inventing capacities, endurance, ownership or dependencies without marking them as assumptions or proposals;
- return the complete candidate model;
- explain semantic and scenario changes;
- state clearly when it cannot render SVG or apply the requested analysis.

An AI must not infer a dependency merely because objects are close together, share a colour or appear in the same sector.

## Structural interpretation without rendering

The generated structural projection lists:

- model perspective and focus;
- all entities, kinds, layers, needs, statuses, failure modes, attributes and evidence;
- all relationships as `provider -> receiver`;
- delivery modes, criticality, service effects and evidence;
- scenario operations;
- view rings, sectors, placements, routes and INAM cells;
- explicit rules separating semantic meaning from presentation.

This enables reasoning in chat interfaces that cannot display SVG.

## Review in the application

The Review workspace performs these steps:

1. parse and validate the accepted baseline;
2. parse the proposal Markdown and complete candidate SCIM block;
3. compare both documents using `compareScimDocuments`;
4. show semantic, scenario and view operation counts;
5. show each object-level add, remove or change operation;
6. allow individual acceptance or rejection;
7. apply selected operations to a clone of the baseline;
8. validate the complete partial result;
9. commit a valid accepted result to the shared workspace;
10. record one `ai` revision with the proposal title.

The reviewer should inspect the structured before and after values, not rely only on the AI’s prose rationale.

## What the protocol protects against

The protocol reduces the risk of:

- hidden model mutation;
- losing stable IDs;
- mixing layout changes with infrastructure changes;
- accepting a relationship without its endpoint;
- presenting AI assumptions as facts;
- losing the accepted baseline in a long chat;
- becoming dependent on a single model vendor;
- returning an attractive diagram whose underlying structure is incomplete.

It does not prove that a proposal is operationally correct. Human and domain review remain necessary.

## Suggested AI tasks

### Expand the model

> Identify important entities, services and dependencies missing from this model. Ask questions where the evidence is insufficient. Return one complete candidate model.

### Challenge assumptions

> Find claims that appear unsupported, overly precise or visually implied. Move uncertain claims into explicit assumptions or open questions and return a complete candidate model.

### Build a scenario

> Add a 72-hour grid-failure scenario. Do not assume generator endurance or restoration time unless declared. State unresolved values as open questions.

### Find failure chains

> Trace each critical service chain to the focus entity. Identify single points of failure and ambiguous redundancy policies. Do not infer AND/OR logic from multiple lines.

### Propose mitigations

> Propose three distinct mitigation strategies. For each, explain which entities, relationships, requirements or scenario events change and what remains uncertain.

### Plan actions

> Propose a structured plan of action linked to the model. Until action objects are part of the SCIM schema, keep operational actions in rationale and open questions rather than hiding them in arbitrary layout changes.

## Provider integration

The protocol currently works through copy and paste. An embedded model adapter may later automate transport, but it must preserve the same boundaries:

```text
provider adapter
  receives explicit user-approved handoff
  returns proposal text
  does not write accepted state
```

Provider adapters must not bypass parsing, comparison, selective review or validation.

## Privacy and disclosure

Before sharing a handoff externally, the user must consider whether it contains:

- real infrastructure locations;
- capacities or endurance;
- vulnerabilities or failure dependencies;
- access procedures;
- personally identifiable information;
- security-sensitive operational plans;
- confidential evidence or source links.

The core application does not automatically transmit the map. A future embedded integration must show what will be sent, to which provider, under which retention policy.

## Evidence and provenance

AI-proposed claims should use existing evidence fields where a source is available and should mark confidence honestly.

A proposal should not transform:

> “The generator may have around 24 hours of fuel.”

into:

> `fuel-hours: 24`

without recording that this is an assumption or citing verified evidence.

## Failure handling

The reviewer should reject or request revision when:

- the AI returns only prose;
- the SCIM block is partial;
- stable IDs are replaced unnecessarily;
- frozen geometry changes without explanation;
- a proposal does not parse;
- the candidate fails canonical validation;
- assumptions are hidden as typed facts;
- dependency direction is reversed;
- the candidate removes context unrelated to the request.

## Future protocol extensions

Planned extensions may include:

- typed proposal metadata and author identity;
- comments on individual operations;
- competing proposal branches;
- structured evidence verification;
- structured action and intervention objects;
- tool or MCP access for reading accepted models and submitting proposals;
- explicit provider disclosure records;
- server-backed audit history.

These extensions must preserve the rule that a model can be exported, understood and reviewed as complete text without access to a proprietary AI service.
# User guide

Status: current application 0.5.0.

## Choose a workspace

| Workspace | Use it for |
| --- | --- |
| **Map** `/` | visual modelling, mobile interaction, scenarios, history and export |
| **Model** `/editor` | direct SCIM text editing, validation, deterministic preview and format exports |
| **Review proposals** `/review` | reviewing a complete human or AI candidate against the accepted map |
| **Legacy** `/legacy` | specialist original-mapper functions not yet migrated to canonical state |

## Start with the Map

The Map loads a synthetic example when no accepted browser-local model exists.

The accepted model is saved in the current browser profile. Export SCIM for durable backup or use on another device.

## Navigate the map

Use **Navigate** mode to:

- scroll or pan around the full diagram;
- use browser pinch zoom on a phone or tablet;
- select objects for inspection without moving them accidentally;
- inspect scenario results.

Navigate is the safe default.

## Edit the map

Switch to **Edit map** before dragging a node.

- Press or touch a node.
- Move it to the intended position.
- Release the pointer.

The movement changes only the frozen radial view. It does not change the entity’s kind, layer, needs or dependencies.

A completed movement is recorded as one human-origin view revision.

## Select and edit an entity

Select an entity to load its inspector.

Current editable semantic fields include:

- name;
- kind;
- locality/control layer;
- status;
- supported needs.

Saving creates one validated human-origin revision.

Stable IDs are preserved when wording changes.

## Add an entity

Use the entity-creation controls to provide at least a name, kind and layer.

The application:

1. creates a canonical entity;
2. creates a radial placement;
3. validates the complete model;
4. records a human-origin revision;
5. selects the new entity.

Add evidence and richer attributes through SCIM source until the visual inspector exposes them.

## Add a relationship

Choose the provider or enabling entity as **from** and the receiver as **to**.

For example:

```text
regional grid -> hospital
hospital -> patient
```

Choose a relationship kind and whether it is critical.

Do not reverse the arrow to mean “depends on” visually. SCIM always stores the provider/enabler-to-receiver direction.

## Model redundancy explicitly

Two incoming lines do not tell the application whether both providers are required or whether either one is sufficient.

Use SCIM source to declare a requirement group:

```scim
grid -> hospital {
  id: grid-hospital
  critical: true
  requirement-group: hospital-power
  requirement-policy: any
  minimum-available: 1
  when-unsatisfied: failed
}
```

See [`dependency-requirements.md`](dependency-requirements.md).

## Preview a scenario

Select a scenario from the Map.

The application:

- applies explicit scenario changes;
- evaluates dependency requirements;
- propagates conservative critical failures;
- renders the simulated statuses;
- lists warnings and explanations.

Scenario preview is read-only. Return to the baseline before editing the accepted map.

## Understand why something failed

Read the explanation trace. It distinguishes:

- status changes declared directly by the scenario;
- requirement groups that became unsatisfied;
- fallback failures where all incoming critical dependencies were unavailable.

The current engine does not calculate time, capacity, fuel depletion or probability unless a later feature explicitly models them.

## Use the Model editor

Open `/editor` to work directly with portable SCIM text.

Use it to:

- paste SCIM DSL or a Markdown handoff;
- validate syntax and canonical references;
- inspect a deterministic radial preview;
- apply declared scenarios;
- inspect dependency requirements;
- export SCIM, JSON, SVG, Mermaid or DOT where available;
- copy the complete model for an AI conversation.

The source editor is advanced. The accepted Map workspace and source text are not yet silently synchronised; use explicit exports and review changes carefully.

## Ask an AI to help

From the Map or Review workflow, copy the AI handoff or proposal request.

Paste it into a capable chat and ask for a specific task, such as:

- find missing dependencies;
- challenge assumptions;
- identify single points of failure;
- model a 72-hour outage;
- propose mitigations;
- compare two plans.

The handoff includes the complete text model and instructions not to infer meaning from layout.

## Required AI response

Ask the AI to return:

- a proposal title;
- rationale;
- assumptions;
- open questions;
- one complete candidate SCIM model.

Do not accept a prose-only answer as a model update.

## Review an AI proposal

Open `/review`.

1. Confirm the accepted workspace baseline is correct.
2. Paste the complete AI proposal.
3. Inspect rationale, assumptions and open questions.
4. Review semantic, scenario and view operation counts.
5. Inspect each before and after value.
6. Accept or reject individual operations.
7. Resolve invalid partial combinations.
8. Accept the reviewed result into the workspace.
9. Return to the Map and inspect the AI-origin revision.

The AI never performs the final acceptance action.

## Undo

Use the revision controls on the Map to undo the latest accepted revision.

Undo restores the complete `before` snapshot. Current history is linear and has no redo.

## Export and backup

Export authoritative SCIM after meaningful work.

Portable SCIM is the current method for:

- durable backup;
- cross-device transfer;
- sharing with another person;
- version control;
- use in external AI conversations.

Browser local storage is not encrypted and may be cleared.

## Use the Legacy mapper

Open `/legacy` only when you need specialist controls not yet migrated, such as legacy impact-zone or threat-sector behaviour.

The legacy mapper uses a different internal state model. Move work into canonical SCIM through supported import/adaptation and validation rather than assuming both routes share live state.

## Sensitive information

Before copying, exporting or sharing a model, check for:

- real infrastructure locations;
- capacities and endurance;
- vulnerabilities or single points of failure;
- access procedures;
- personal information;
- confidential evidence;
- operational response plans.

The application does not automatically send the map to an AI, but external chat services have their own data policies. Read [`../SECURITY.md`](../SECURITY.md).

## Troubleshooting

### The map shows an old model

The accepted workspace may be stored in browser local storage. Check whether you are using the same device and browser profile.

### The production site shows an old application version

Check the version footer and refresh after the Vercel production deployment completes.

### A proposal cannot be accepted

Inspect validation messages. A selected relationship may refer to a rejected new entity, or a view/scenario may refer to an object missing from the partial result.

### The diagram and text appear to disagree

Treat the canonical semantic fields as authoritative for meaning. Treat the frozen view as authoritative for exact geometry. Export and inspect the complete SCIM source.

### An AI changed many IDs

Ask it to revise the proposal and preserve stable IDs for unchanged objects. Otherwise the review may show misleading removals and additions.

### A scenario result seems too certain

Check whether the model actually declares requirement policies, capacities or endurance. The current engine is intentionally limited and must not be treated as a full operational forecast.
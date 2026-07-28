# SCIM glossary

## Accepted model

The validated `ScimDocument` currently treated as authoritative in the workspace.

## AI handoff

A self-contained Markdown package containing interpretation rules, text-only structure, renderer instructions and the complete SCIM source for use in an external or embedded AI conversation.

## Assumption

A proposition used for modelling that has not been verified as a fact. Assumptions should be visible and reviewable.

## Canonical model

The validated `ScimDocument` used as the source of truth by the application, renderer, scenario engine, diff, review and persistence layers.

## Candidate model

A complete proposed `ScimDocument` returned by a human or AI. It is not accepted until reviewed.

## Critical relationship

A relationship marked as important to the receiver’s operation. Criticality alone does not define whether all, any or a minimum number of providers are required.

## Dependency requirement

Explicit typed logic describing how incoming providers satisfy a service requirement for a target entity, such as all providers, any provider or a minimum count.

## Deterministic renderer

A versioned algorithm that produces stable layout-equivalent output from the same canonical model and frozen view.

## Entity

A person, household, organisation, service, facility, resource or other infrastructure object represented in SCIM.

## Evidence

Source information attached to a model claim, optionally including a note, confidence and observation time.

## Failure mode

A cause or category through which infrastructure may degrade or fail, such as neglect, operators or system externalities.

## Focus entity

The principal person, group, organisation or state whose protection or operation the model is intended to explain.

## Frozen view

A view with explicit geometry that must be preserved for reproducible rendering.

## Human-origin revision

An accepted revision produced by direct manual editing and labelled with origin `human`.

## AI-origin revision

An accepted revision produced from a reviewed AI candidate and labelled with origin `ai`.

## INAM

Integrated Needs Analysis Matrix. A tabular SCIM view combining needs, locality/control layers and particular entities.

## Layer

The practical locality or control level of an entity: individual, household, neighbourhood, municipality, region, country or world.

## Legacy mapper

The original React-state-based visual mapper preserved at `/legacy` while its specialist controls are migrated to canonical state.

## Local workspace

The accepted document and revision history stored in browser local storage.

## Need

A condition or capability protected by infrastructure, including the six immediate individual needs and group, organisational or state needs.

## Operation

A structured add, remove or change record produced by comparing a candidate document with the accepted baseline.

## Perspective

The cooperative level from which the model is framed: individual, group, organisation, nation-state or integrated.

## Proposal

A complete candidate model accompanied by rationale, assumptions and open questions.

## Provider or enabler

The source entity of a directed relationship. In SCIM text, arrows point from provider/enabler to receiver.

## Receiver

The target entity of a directed relationship.

## Relationship

A directed semantic connection between two entities, such as supplies, depends-on, backup-for or protects.

## Renderer profile

An immutable versioned visual contract such as `scim-radial-1`.

## Revision

An accepted change record containing origin, label, timestamp, canonical operations and complete before/after documents.

## SCIM

Simple Critical Infrastructure Maps or Mapper, depending on context. The project uses SCIM as both the domain framework and the portable modelling language/application.

## SCIM DSL

The compact Mermaid-like language inside a fenced `scim` block.

## SCIM Markdown

A portable Markdown document containing narrative context and one authoritative fenced SCIM DSL block.

## Scenario

An explicit set of changes applied to the accepted baseline for analysis. A scenario is not a duplicate complete map.

## Service effect

A way service failure affects people or systems: provision, cost or quality.

## Stable ID

A persistent identifier used to refer to the same model object across text, views, scenarios, proposals and revisions.

## Structural reading

A deterministic entirely text-based projection listing semantic entities, relationships, scenarios and view structure for AI and accessible interpretation.

## View

A presentation of the canonical model, such as a radial diagram or INAM. A view is not the semantic source of truth.

## View-only change

A change to presentation such as node position or route geometry that does not alter infrastructure semantics.

## Workspace baseline

The accepted document against which a proposal is compared.
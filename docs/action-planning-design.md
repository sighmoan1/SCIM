# Structured action-planning design

Status: proposed future design. Not implemented in SCIM schema 0.2 or application 0.5.0.

## Purpose

SCIM should not stop at showing what fails. People and AIs need to propose, compare and approve plans of action that alter infrastructure, restore services, reduce exposure or improve decision-making.

A plan must be represented as reviewable structure rather than existing only as chat prose.

## Product goals

A future action-planning model should allow users to:

- link an action to the entities, relationships, requirements or scenarios it affects;
- state who is responsible;
- declare prerequisites and required resources;
- estimate start, duration and completion;
- describe expected effects and risks;
- distinguish a proposal from an authorised action;
- simulate a plan against one or more scenarios;
- compare competing plans;
- preserve evidence, assumptions and uncertainty;
- export the complete plan as text for human and AI collaboration.

## Non-goals

The first action model should not attempt to become:

- a full project-management suite;
- a dispatch or command-and-control system;
- an automatic optimiser that issues operational orders;
- a replacement for legal authority, professional judgement or incident command;
- a guarantee that estimated effects will occur.

## Domain distinction

SCIM should distinguish:

- **baseline fact** — what currently exists;
- **scenario condition** — what is assumed to happen;
- **intervention** — a change intended to alter the model or scenario outcome;
- **action** — work an actor performs to deliver an intervention;
- **plan** — an ordered or dependent set of actions;
- **decision** — a human acceptance or authorisation event;
- **result** — observed outcome after execution.

These must not be mixed into one status field.

## Candidate canonical shape

The following is illustrative and requires a schema ADR before implementation.

```ts
interface ScimAction {
  id: string;
  title: string;
  description: string;
  status:
    | "proposed"
    | "approved"
    | "ready"
    | "in-progress"
    | "blocked"
    | "completed"
    | "cancelled";
  responsibleActorIds: string[];
  targetEntityIds: string[];
  targetRelationshipIds: string[];
  scenarioIds: string[];
  prerequisites: ScimActionPrerequisite[];
  requiredResources: ScimResourceRequirement[];
  earliestStart?: string;
  durationMinutes?: number;
  expectedChanges: ScenarioChange[];
  expectedEffects: ScimExpectedEffect[];
  risks: ScimActionRisk[];
  assumptions: string[];
  evidence: Evidence[];
  confidence?: number;
}

interface ScimPlan {
  id: string;
  name: string;
  objective: string;
  scenarioIds: string[];
  actionIds: string[];
  successCriteria: ScimSuccessCriterion[];
  constraints: ScimPlanConstraint[];
  status: "draft" | "proposed" | "approved" | "active" | "completed" | "cancelled";
}
```

The exact shape remains open. It should reuse canonical entities and scenario operations where possible rather than creating parallel graph objects.

## Candidate text syntax

Illustrative only:

```scim
action deliver-generator-fuel "Deliver generator fuel" {
  status: proposed
  responsible: [logistics-team]
  targets: [generator, fuel-generator]
  scenarios: [regional-outage]
  prerequisites: [road-access, fuel-stock-confirmed]
  duration: 180 minutes
  requires: [diesel 4000 litres, tanker 1]
  expected: set generator status normal
  assumption: "A tanker can reach the hospital safely."
  risk: "Road access may be blocked."
}

plan hospital-power-72h "Maintain hospital power for 72 hours" {
  objective: "Keep essential clinical services powered during the outage."
  scenarios: [regional-outage]
  actions: [confirm-fuel-stock, deliver-generator-fuel, prioritise-essential-load]
  success: hospital status not failed
}
```

Any adopted grammar must be unambiguous, round-trip through the canonical model and remain readable in chat.

## Actor modelling

Responsible actors should normally be canonical entities with suitable kinds, for example:

- incident-management-team;
- hospital-estates;
- electricity-network-operator;
- local-authority;
- logistics-provider;
- volunteer-group.

This makes authority, communication and dependency chains visible.

The model should not assume that an entity capable of an action has authority to perform it. Authority and responsibility may require explicit relationship kinds or action fields.

## Resource modelling

Actions may require:

- people or skills;
- vehicles;
- fuel;
- equipment;
- money;
- information;
- legal authority;
- access;
- time;
- safe operating conditions.

The first implementation should define units and quantity semantics rather than encoding values in free-form strings if simulation will consume them.

## Preconditions and dependencies

Action prerequisites may include:

- another action completed;
- entity status at or above a threshold;
- relationship available;
- resource quantity available;
- decision approved;
- time window reached;
- evidence verified;
- external condition true.

Action dependency logic must be explicit, using all/any/minimum semantics where appropriate. It must not be inferred from list order alone.

## Expected changes versus observed results

A proposed action can declare expected canonical changes, but those are predictions.

The system should distinguish:

- expected change;
- simulated change;
- approved intention;
- observed result.

Completing an action must not automatically mark the expected infrastructure effect as true without confirmation or an authorised data source.

## Scenario integration

A plan should be evaluated against a specified scenario and time horizon.

Potential flow:

```text
baseline
  -> apply scenario
  -> propagate initial failures
  -> schedule proposed actions
  -> apply expected action changes at declared times
  -> propagate again
  -> compare service outcomes and success criteria
```

The engine should produce an explanation trace showing:

- which scenario event occurred;
- which action became possible or blocked;
- which expected change was applied;
- which dependency requirement changed state;
- which success criterion was met or missed;
- where uncertainty affects the result.

## Comparing plans

Plan comparison should not collapse everything into one opaque score.

Useful dimensions include:

- protected needs;
- time until service restoration;
- people or services remaining unsupported;
- resource consumption;
- robustness to uncertain assumptions;
- number of unresolved critical dependencies;
- execution risk;
- reversibility;
- authority and coordination burden;
- evidence quality.

An AI may summarise trade-offs, but the underlying measures and assumptions must remain visible.

## AI collaboration

Useful AI tasks include:

- propose several plans with distinct strategies;
- identify prerequisites and missing actors;
- challenge resource and duration assumptions;
- identify actions that do not affect the modelled failure chain;
- find common actions across scenarios;
- identify decisions that require authority or evidence;
- compare plans under changed assumptions;
- convert an accepted plan into a role-specific checklist.

The AI returns a complete candidate model or proposal containing structured actions and plans. It does not mark actions approved or completed by itself.

## Review and authorisation

Proposal review should separate:

- new or changed infrastructure semantics;
- scenario changes;
- action and plan changes;
- view changes;
- authorisation status changes.

Approving a model proposal is not necessarily the same as authorising operational execution. A future system may need separate permissions and signatures.

## Mobile design

On mobile, action planning should use:

- a scenario timeline or ordered list;
- compact action cards;
- explicit blocked/ready states;
- role filters;
- prerequisites and resources in a bottom sheet;
- visible provenance and assumptions;
- one-tap navigation to affected map objects;
- no requirement to edit raw SCIM for routine actions.

## Evidence and uncertainty

Every precise action estimate should be traceable to:

- verified evidence;
- an explicit assumption;
- a domain-expert judgement;
- a simulation output;
- an external live-data source.

Confidence should not become a substitute for explanation. Ranges may be more honest than a single number.

## Safety constraints

A future action engine must not:

- issue autonomous operational orders;
- hide who approved an action;
- present simulated outcomes as observed facts;
- remove uncertainty because an AI supplied a confident answer;
- expose sensitive plans to an external provider without explicit disclosure;
- encourage users to bypass legal, safety or incident-command procedures.

## Implementation sequence

1. Validate the user workflow with plans represented in proposal rationale and structured mock-ups.
2. Write an ADR defining action, intervention, decision and result semantics.
3. Add canonical schemas and text syntax.
4. Add parser/serializer round-trip tests.
5. Add proposal diff and selective acceptance for actions and plans.
6. Add manual plan editor and mobile timeline.
7. Add deterministic schedule and prerequisite evaluation.
8. Add scenario comparison and explanation traces.
9. Add role, authority and approval controls before multi-user operational use.
10. Add provider-neutral AI assistance through the existing proposal boundary.

## Open design questions

- Should actions be top-level document objects or a specialised scenario structure?
- How should quantities and units be represented?
- How should authority differ from responsibility?
- Are expected changes reusable scenario operations or a separate intervention type?
- How are observed results recorded without rewriting history?
- How should plans branch when assumptions change?
- Which action fields are portable and which belong to an organisational extension?
- What permissions are required to propose, approve, start and complete an action?
- How should offline execution and later synchronisation work?

These questions should remain explicit until resolved through user research and an accepted architecture decision.
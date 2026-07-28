# Scenario and dependency requirement engine

Status: current deterministic behaviour for SCIM schema 0.2.

## Purpose

The engine answers two separate questions:

1. What explicit changes does a named scenario make to the baseline?
2. Given the resulting state, which dependency requirements are no longer satisfied and what should happen next?

It produces an explanation trace so a human or AI can inspect why a status changed.

## Stage 1: apply a scenario

`applyScenario(document, scenarioOrId)` validates the baseline and then processes scenario operations in order.

Supported operations:

- set entity status;
- set relationship status;
- add entity;
- add relationship.

The function works on cloned objects and returns a new validated document. It does not mutate the accepted baseline.

The result records:

- changed entity IDs;
- changed relationship IDs;
- warnings;
- explanations such as `Scenario outage sets relationship grid-clinic to failed.`

Unknown references encountered at runtime become warnings, although canonical schema validation should normally prevent them.

## Stage 2: propagate dependency failures

`propagateCriticalFailures(document, options)` performs deterministic passes until no further state changes occur or a maximum-pass limit is reached.

It uses two modes.

### Explicit requirement mode

Targets with declared dependency requirement groups are evaluated according to those groups.

### Conservative fallback mode

For entities without explicit requirements, the engine retains a conservative legacy rule:

> An entity fails only when every incoming critical dependency of a configured kind is unavailable.

This avoids inventing redundancy logic, but it is still only a fallback. Important systems should declare explicit requirements.

## Declaring a requirement

SCIM 0.2 stores requirement declarations on participating relationships so they survive generic attribute round trips.

```scim
grid -> clinic {
  id: grid-clinic
  kind: supplies
  critical: true
  requirement-group: clinic-power
  requirement-service: electricity
  requirement-policy: any
  minimum-available: 1
  when-unsatisfied: failed
}

generator -> clinic {
  id: generator-clinic
  kind: backup-for
  critical: true
  requirement-group: clinic-power
  requirement-service: electricity
  requirement-policy: any
  minimum-available: 1
  when-unsatisfied: failed
}
```

Relationships sharing `requirement-group` define one requirement. They must point to the same target entity.

## Requirement fields

| Attribute | Type | Meaning |
| --- | --- | --- |
| `requirement-group` | non-empty string | requirement ID shared by participating relationships |
| `requirement-policy` | `all`, `any` or `at-least` | provider satisfaction policy |
| `minimum-available` | positive integer | number of available providers required |
| `when-unsatisfied` | `degraded` or `failed` | target status applied when the requirement is not met |
| `requirement-service` | string | optional service label used in explanations |

## Policies

### `all`

Default minimum equals the number of relationships in the group.

Every provider path must be available.

### `any`

Default minimum is 1.

One available provider path satisfies the requirement.

### `at-least`

The declared `minimum-available` is used. When omitted, the engine warns and uses 1.

## Availability

A relationship counts as available when:

- the relationship exists;
- the relationship status is not `failed`;
- its source entity exists;
- its source entity status is not `failed`.

The current evaluator treats `degraded` as available. Future capacity-aware requirements may distinguish full and partial availability.

The target entity status does not determine whether its incoming provider path is counted.

## Conflict handling

`extractDependencyRequirements` emits warnings when a group has:

- more than one target entity;
- conflicting policies;
- conflicting minimum values;
- conflicting `when-unsatisfied` values;
- conflicting service labels;
- an unknown policy;
- an invalid unsatisfied status;
- `at-least` without a minimum.

Current fallback behaviour:

- conflicting targets: skip the requirement;
- unknown policy: use `all`;
- missing `at-least` minimum: use 1;
- invalid unsatisfied status: use `failed`;
- minimum above provider count: clamp to provider count;
- conflicting values: use the first distinct declaration and warn.

A future first-class requirement schema should validate these conflicts before simulation rather than resolving them at runtime.

## Evaluation output

Each evaluated requirement contains:

- requirement ID;
- target entity ID;
- relationship IDs;
- policy;
- minimum available count;
- status when unsatisfied;
- optional service;
- available relationship IDs;
- unavailable relationship IDs;
- satisfied boolean;
- explanation.

Example explanation:

```text
clinic electricity requirement clinic-power is unsatisfied:
0/2 providers available; minimum 1.
```

## Propagation behaviour

For each pass:

1. evaluate all explicit requirements;
2. change unsatisfied targets to their configured status where allowed;
3. evaluate conservative fallback targets;
4. fail fallback targets whose incoming critical dependencies are all unavailable;
5. mark those incoming relationships failed when needed;
6. repeat until stable.

Explicit requirement targets are excluded from the fallback rule.

A target already `failed` is not changed again. An unsatisfied requirement may move a `normal` or `new` target to `degraded` or `failed`. A configured `failed` outcome can also replace a currently degraded target.

## Fallback relationship kinds

Default relationship kinds considered by conservative propagation are:

- `depends-on`;
- `supplies`;
- `backup-for`.

Callers may override the list.

## Pass limit

The default maximum number of passes is the number of entities plus one. Reaching the limit adds a warning.

This protects against unexpected cycles or future logic that does not converge.

## Cycles

Infrastructure graphs may contain cycles. The current status-only engine can converge when failure statuses move monotonically toward `failed`, but it does not perform formal cycle analysis.

Future work should distinguish:

- legitimate mutual support;
- circular reasoning;
- bootstrap dependencies;
- recovery cycles;
- oscillating time-based behaviour.

## Scenario preview contract

The primary map:

- applies the selected scenario;
- propagates failures;
- renders the simulated result;
- displays warnings and explanations;
- does not save the simulated result as the accepted baseline;
- disables node movement during the preview.

## What the engine does not model

Current behaviour does not include:

- timestamps or ordered time progression beyond scenario list order;
- capacity or load;
- stock consumption;
- generator fuel endurance;
- restoration duration;
- probability;
- correlated failure likelihood;
- cost or quality thresholds;
- human decision-making;
- action-plan execution;
- geographical travel time.

Do not encode these as precise conclusions unless a future schema and engine support them.

## AI interpretation

AI systems should:

- use explicit requirement metadata;
- describe ungrouped incoming dependencies as logically unspecified;
- ask whether providers are all required, interchangeable or threshold-based;
- avoid inferring redundancy from line position or labels;
- distinguish scenario status changes from propagated results;
- quote or paraphrase explanation traces when describing why something failed;
- state current engine limitations.

## Contributor rules

A change to requirement or scenario semantics must update:

- `schema.ts` when canonical fields change;
- `parser.ts` and `serializer.ts` when syntax changes;
- `requirements.ts`;
- `simulation.ts`;
- structural reading and AI handoff instructions;
- examples;
- tests;
- this document;
- language version or compatibility notes where required.

Changes must remain deterministic and must not derive dependency logic from visual layout.
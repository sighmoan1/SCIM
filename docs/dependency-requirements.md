# Explicit dependency requirements

A line between two entities says that a directed relationship exists. It does not, by itself, say how several incoming relationships combine.

SCIM 0.2 therefore supports explicit requirement groups as typed relationship attributes. This is an incremental extension which already survives parsing, serialisation, JSON export and AI handoff round trips.

## Example: grid or generator

```scim
grid -> hospital {
  id: grid-hospital
  kind: supplies
  mode: grid
  critical: true
  requirement-group: hospital-power
  requirement-service: electricity
  requirement-policy: any
  minimum-available: 1
  when-unsatisfied: failed
}

generator -> hospital {
  id: generator-hospital
  kind: backup-for
  mode: on-site
  critical: true
  requirement-group: hospital-power
  requirement-service: electricity
  requirement-policy: any
  minimum-available: 1
  when-unsatisfied: failed
}
```

Both relationships belong to `hospital-power`. The hospital requires at least one available provider. A failed grid does not fail the hospital while the generator remains available.

## Fields

- `requirement-group` — stable identifier shared by relationships which satisfy one requirement.
- `requirement-service` — human and machine-readable name of the required service.
- `requirement-policy` — `all`, `any`, or `at-least`.
- `minimum-available` — positive integer threshold; required for precise `at-least` semantics.
- `when-unsatisfied` — target status, currently `degraded` or `failed`.

All relationships in a group must point to the same target entity and should declare consistent values. The requirement evaluator reports conflicts rather than choosing silently.

## Policies

### `all`

Every listed relationship must be available. This models complementary inputs such as fuel **and** skilled operators when both are indispensable.

### `any`

At least one listed relationship must be available. This models alternatives such as grid power **or** a capable backup generator.

### `at-least`

At least `minimum-available` relationships must be available. This models N-of-M redundancy, such as two of three pumps or three of five staff teams.

## Availability

A relationship currently counts as available when:

1. the relationship is not `failed`; and
2. its source entity is not `failed`.

This is deliberately conservative and deterministic. Capacity, quality thresholds, time-to-exhaustion and partial contribution are not inferred. They require later typed semantics.

## Simulation

During propagation:

1. explicit requirement groups are evaluated first;
2. an unsatisfied requirement changes its target to `when-unsatisfied`;
3. downstream requirement groups are reevaluated on the next pass;
4. entities without explicit groups retain the legacy conservative rule that they fail only when every incoming critical dependency is unavailable.

Simulation results include explanations such as:

```text
hospital electricity requirement hospital-power is unsatisfied:
0/2 providers available; minimum 1. Entity hospital becomes failed.
```

## AI interpretation

AI handoffs contain a generated text-only list of each requirement, its target, service, policy, threshold, providers and current satisfaction state.

An AI must not infer AND/OR logic from proximity, line routing, labels such as “backup”, or visual placement. Incoming relationships without an explicit requirement group remain logically unspecified and should produce a question or proposal rather than a hidden assumption.

## Future canonical syntax

A future schema version may promote these attributes to a first-class block:

```scim
requirement hospital-power "Hospital electricity" {
  target: hospital
  service: electricity
  policy: any
  relationships: [grid-hospital, generator-hospital]
  minimum-available: 1
  when-unsatisfied: failed
}
```

The relationship-attribute representation is intentionally compatible with that future model and avoids delaying explicit structural reasoning while the core schema evolves.

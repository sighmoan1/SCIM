# Legacy mapper migration

## Purpose

The original radial mapper remains at `/legacy` while its useful specialist controls are moved onto canonical `ScimDocument` state.

This document explains the compatibility boundary so future collaborators do not accidentally create two competing product architectures.

## Why the legacy mapper is preserved

The historical mapper includes capabilities not yet available in the canonical Map workspace, including:

- editable threat sectors;
- editable layers;
- impact zones;
- node resizing;
- relationship metadata dialogs;
- copied-map scenario editing;
- legacy JSON import and export.

Removing it immediately would discard working manual capability. Extending it as the main product would preserve its structural limitations.

## Architectural status

| Route | Internal model | Role |
| --- | --- | --- |
| `/` | canonical `ScimDocument` | primary product and destination architecture |
| `/legacy` | original component-local React state | compatibility and migration surface |

New product capabilities should target `/` and `lib/scim`.

## Legacy format

The legacy export contains:

- version;
- Cartesian centre-origin pixel coordinate metadata;
- layer records;
- threats with angles and impact radii;
- infrastructure elements with semantic and layout fields mixed together;
- connections;
- impact zones;
- export metadata.

It does not fully represent current canonical semantics such as perspective, supported needs, evidence, explicit requirement groups, versioned views or review history.

## Adapter

`lib/scim/legacy-adapter.ts` defines:

- legacy TypeScript interfaces;
- `legacyMapToScim`;
- `scimToLegacyMap`;
- separate `ScimLayout` compatibility data.

### Legacy to canonical

`legacyMapToScim`:

- normalises layer aliases;
- normalises the six threat names;
- maps known failure modes;
- maps known service effects;
- maps delivery modes;
- creates canonical entities and relationships;
- creates a frozen `scim-radial-1` view from coordinates, rings and sectors;
- preserves unrecognised legacy properties in attributes or layout compatibility data;
- validates the resulting SCIM 0.2 document.

### Canonical to legacy

`scimToLegacyMap`:

- validates the canonical document;
- maps canonical entities and relationships into legacy fields;
- uses supplied compatibility layout for coordinates, layers, threats and impact zones;
- maps known delivery modes, failure modes and service effects back to legacy names;
- preserves compatible unknown arrays from attributes.

This conversion is necessarily lossy for canonical features the legacy format cannot express.

## Alias mapping

### Layers

Examples:

- `person` -> `individual`
- `home` -> `household`
- `village` -> `neighbourhood`
- `town` or `city` -> `municipality`
- `international` -> `world`

### Threats

Examples:

- `too cold` -> `too-cold`
- `too hot` -> `too-hot`

### Delivery modes

- `Produce on site` -> `on-site`
- `Grid` -> `grid`
- `Delivery` -> `delivery`
- `Fetch` -> `fetch`
- `Other` -> `other`

## Important semantic warning

The legacy default connections appear to use `from` and `to` in ways that may not consistently follow the canonical provider/enabler-to-receiver direction.

A migration must review relationship direction rather than assuming every historical line is semantically correct.

For example, a historical connection from `home` to `power station` might visually mean “home depends on power station”, while canonical SCIM requires:

```text
power station -> home
```

Future import UX should flag likely reversed relationships for human review.

## Impact zones

Legacy impact zones are preserved in compatibility layout data because SCIM schema 0.2 does not yet have a first-class canonical impact-zone object.

Do not hide new impact-zone semantics only in `ScimLayout`. The planned canonical feature should define:

- semantic meaning and target scope;
- associated threat or scenario;
- criticality;
- evidence and uncertainty;
- geometry as view data;
- portable text syntax;
- simulation implications.

## Legacy scenarios

The historical mapper stores copied arrays of elements, connections and impact zones for each scenario.

Canonical SCIM stores scenario operations against a baseline.

Migration should calculate changes rather than preserve full duplicated maps as the long-term representation.

Potential translation:

- changed element status -> `set-entity-status`;
- changed connection status -> `set-relationship-status`;
- scenario-only element -> `add-entity`;
- scenario-only connection -> `add-relationship`;
- changed geometry -> scenario-specific view proposal, when supported;
- removed objects -> future remove operations or an explicit compatibility note.

## Safe import workflow

A future canonical import should:

1. parse legacy JSON as untrusted input;
2. validate the legacy shape;
3. run `legacyMapToScim`;
4. display warnings and unmapped fields;
5. show a text-only structural reading;
6. compare the imported candidate with the current accepted model;
7. require explicit human acceptance;
8. store one import-origin or human revision;
9. preserve the original file for recovery.

Do not replace accepted state silently after file selection.

## Migration priorities

1. Relationship direction review.
2. Canonical layer and sector controls.
3. Canonical impact-zone design.
4. Node resizing and route editing.
5. Rich entity and relationship metadata.
6. Scenario operation migration.
7. Legacy JSON import through review.
8. Usage evidence that `/legacy` is no longer needed.
9. Deprecation notice and eventual route removal.

## Retirement criteria

The legacy route may be retired when:

- active manual workflows have canonical equivalents;
- legacy exports can be imported safely;
- no essential model data exists only in legacy state;
- mobile and accessibility are at least equivalent;
- users have a clear migration path;
- documentation and examples no longer direct new work to `/legacy`;
- a release notes the removal and recovery options.

## Contributor guardrail

Do not add a new semantic concept only to `advanced-infrastructure-mapper.tsx`.

First define the concept in the canonical schema and portable language. Then add a canonical editor and, only when needed, a compatibility mapping for the legacy route.
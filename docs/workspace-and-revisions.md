# Workspace and revision model

## Purpose

The SCIM workspace gives visual editing and reviewed AI proposals one accepted state and one history. The accepted object is always a validated `ScimDocument`.

The current implementation is browser-local. It is deliberately simple so the canonical model and collaboration semantics can stabilise before cloud synchronisation is added.

## Stored data

`lib/scim/workspace.ts` uses two local-storage keys:

| Key | Value |
| --- | --- |
| `scim.workspace.document.v1` | the accepted canonical `ScimDocument` as JSON |
| `scim.workspace.revisions.v1` | up to 100 accepted revisions as JSON |

The key suffix is the storage-format version, not the SCIM schema version. A future incompatible storage shape must use a new key or provide a migration.

## Workspace snapshot

```ts
interface ScimWorkspaceSnapshot {
  document: ScimDocument;
  revisions: ScimWorkspaceRevision[];
}
```

The document is the current accepted model. Revisions are an audit and undo history; they are not applied at load time to reconstruct the model.

## Revision shape

```ts
type ScimRevisionOrigin = "human" | "ai";

interface ScimWorkspaceRevision {
  id: string;
  origin: ScimRevisionOrigin;
  label: string;
  createdAt: string;
  changes: ScimDocumentChange[];
  before: ScimDocument;
  after: ScimDocument;
}
```

A revision stores complete before and after documents as well as the canonical diff. This is intentionally redundant:

- the change list supports review and explanation;
- the complete snapshots make undo reliable;
- future migration work can inspect the exact accepted states;
- a revision remains understandable even if display summaries change.

## Creating a revision

`createScimWorkspaceRevision(before, after, options)`:

1. validates both documents;
2. compares them with `compareScimDocuments`;
3. returns `null` when no canonical change exists;
4. otherwise creates an ID, timestamp, origin, label, change list and complete snapshots.

A revision is therefore created only from two valid canonical states.

## Human-origin revisions

Manual edits on the primary map are accepted immediately and recorded with `origin: "human"`.

Examples include:

- adding or editing an entity;
- adding or removing a directed relationship;
- moving a node in a frozen radial view;
- deleting an entity and any dependent view placements or relationships;
- accepting another explicit manual form change.

A completed drag records one revision. Intermediate pointer movement updates the working view in memory but does not create frame-by-frame history.

## AI-origin revisions

An AI response is not a revision by itself.

The Review workspace:

1. loads the accepted document as the baseline;
2. parses the complete candidate model;
3. creates deterministic review operations;
4. lets a person accept or reject each operation;
5. applies the selected operations to a clone of the baseline;
6. validates the complete result;
7. records one `origin: "ai"` revision only after explicit acceptance.

The revision label is normally the proposal title.

## Diff semantics

A `ScimDocumentChange` identifies:

- area: model, entity, relationship, scenario or view;
- kind: added, removed or changed;
- stable key;
- object ID;
- human-readable summary;
- changed fields;
- structured before and after values.

Semantic, scenario and view changes are counted separately. This matters because moving a node is not equivalent to changing what an entity does.

## Partial acceptance

A reviewer may accept a subset of proposal operations. The subset is applied by object ID and the resulting full document is validated.

Examples of invalid partial acceptance:

- accepting a relationship but rejecting its new endpoint entity;
- removing an entity but retaining a relationship that references it;
- accepting a scenario change that references an object not present in the accepted result;
- accepting a view placement for an entity that was rejected.

Invalid combinations do not enter the workspace.

## Loading behaviour

`loadScimWorkspace(storage, fallback)`:

- validates the supplied fallback document;
- attempts to parse and validate the stored accepted document;
- uses the fallback if stored JSON is malformed or fails schema validation;
- parses each revision independently;
- discards malformed revisions without blocking the map.

This is a resilience choice: a damaged optional history must not make the application unusable.

## Saving behaviour

`saveScimWorkspace(storage, snapshot)`:

- validates the accepted document;
- stores the complete document;
- stores only the most recent 100 revisions.

The map saves after hydration when document or revision state changes.

## Undo

The current map supports undoing the latest accepted revision by restoring its `before` document and removing that revision from the active history.

This is a linear local history, not a branching version-control system. A future collaborative implementation will need explicit decisions about:

- concurrent edits;
- branches and competing proposals;
- redo;
- revision compaction;
- server-side audit retention;
- permissions to revert another person’s work.

## Route interaction

### `/`

Loads and writes the accepted local workspace. It displays revisions from both human and AI origins.

### `/review`

Loads the same accepted baseline. After review it writes the accepted candidate and the new AI-origin revision to the same storage keys.

### `/editor`

The source editor currently focuses on portable text authoring and export. A future change should provide explicit **load accepted workspace** and **replace accepted workspace through review** actions rather than creating implicit synchronisation.

### `/legacy`

The legacy mapper does not use this canonical workspace. Importing legacy work should pass through `legacyMapToScim`, canonical validation and an explicit acceptance step.

## Privacy and durability

Local storage is:

- local to one browser profile and device;
- not encrypted by SCIM;
- subject to browser clearing and storage limits;
- unavailable to other collaborators;
- not a reliable backup.

Users should export portable SCIM for durable records. Highly sensitive operational infrastructure data should not be assumed safe merely because it remains in local storage.

## Migration rules

A contributor changing persistence must document:

1. old and new keys;
2. old and new stored shapes;
3. migration timing and failure behaviour;
4. treatment of schema-version changes inside stored documents;
5. revision-history compatibility;
6. rollback and user recovery;
7. privacy and retention implications.

Never overwrite incompatible stored data silently.

## Future server-backed shape

A later shared workspace can preserve the same domain contract:

```text
Project
  accepted ScimDocument revision
  ordered accepted revisions
  pending proposals
  comments and review decisions
  members and permissions
```

The browser-local implementation should be treated as the first persistence adapter, not as a reason to change the canonical document or proposal protocol when a server is introduced.
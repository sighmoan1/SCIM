# ADR 0004: Stabilise a browser-local workspace before cloud collaboration

- Status: accepted
- Date: 2026-07-28

## Context

The product needs one accepted document and shared human/AI revision history. Cloud persistence would introduce authentication, permissions, synchronisation, audit, retention and sensitive-data decisions before the canonical model and review workflow have stabilised.

## Decision

Store the accepted `ScimDocument` and latest 100 revisions in browser local storage for the current stage.

Use explicit portable SCIM export for durable exchange and backup.

Do not automatically upload maps to an AI provider or cloud service.

## Consequences

### Positive

- The accepted-state and revision semantics can be tested quickly.
- No account or server is required.
- Users retain explicit control over external AI disclosure.
- The persistence adapter remains simple and replaceable.
- Offline and local use are possible after the application is loaded.

### Negative

- State is limited to one browser profile and device.
- Local storage is not encrypted or a durable backup.
- There is no multi-user collaboration.
- Clearing browser data may remove the workspace.
- Large histories and models may hit browser storage limits.

## Storage contract

Current keys:

- `scim.workspace.document.v1`
- `scim.workspace.revisions.v1`

Stored documents and revision snapshots are validated when loaded. Malformed optional history is discarded rather than blocking the map.

## Future migration

A server-backed workspace should preserve:

- canonical accepted documents;
- proposal and revision semantics;
- stable IDs;
- human/AI provenance;
- portable export.

It should not replace the canonical model with a UI-specific database graph.

## Guardrail

Adding cloud persistence requires explicit decisions on authentication, permissions, encryption, retention, export, deletion, audit, conflict handling and AI-provider disclosure. A database connection alone is not an adequate design.
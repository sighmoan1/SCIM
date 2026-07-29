# ADR 0008: Display INAM as a deterministic dependency projection

Status: accepted in application 0.7.1. SCIM schema remains 0.2.

## Context

The canonical schema can store an authored INAM view with explicit rows, columns, cells and notes. The first user-facing Matrix implementation instead derived cells only from entities that directly declared a supported need. That omitted upstream infrastructure and left the relationship between authored and derived INAM data ambiguous.

## Decision

The primary `/matrix` route is a deterministic projection from the accepted semantic model.

For each canonical need it displays:

1. entities that directly declare that they meet or protect the need;
2. every upstream provider reachable by following incoming provider-to-receiver relationships;
3. each entity's canonical layer, reported and effective status, direct/upstream role and shortest graph distance from a direct provider.

View geometry does not create Matrix membership. Explicit `ScimInamView` objects remain portable authored views for specialist layouts and notes, but they do not silently override the primary dependency projection.

## Consequences

- The Matrix exposes infrastructure chains rather than only direct need tags.
- Direct providers and upstream dependencies remain visibly distinct.
- Relationship direction is operationally important to Matrix correctness.
- Cycles are handled by retaining the shortest discovered distance.
- Authored annotations may later be overlaid explicitly, but must retain provenance and must not replace derived semantic facts invisibly.
- Changes to this projection require regression tests and documentation updates; they do not require a schema version change unless the portable model changes.

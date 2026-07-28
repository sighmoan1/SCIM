# ADR 0005: Use native Pointer Events and preserve the legacy mapper during migration

- Status: accepted
- Date: 2026-07-28

## Context

The original mapper was built around mouse events, double-clicks and local React state. A temporary touch-to-mouse compatibility bridge improved phone usability but retained the wrong interaction and data architecture.

At the same time, the legacy mapper contains specialist controls not yet available in the canonical workspace.

## Decision

Make the primary `/` route a canonical `ScimDocument` map using native Pointer Events for mouse, touch and pen.

Preserve the complete historical mapper at `/legacy` while specialist functions are migrated.

Use explicit Navigate and Edit modes. Use pointer capture for drag operations and record one canonical view revision per completed drag.

## Consequences

### Positive

- Touch is a native interaction rather than translated mouse input.
- Manual edits now change the same canonical model used by text and AI review.
- Human changes enter the shared revision history.
- Mobile panning and pinch zoom remain available in Navigate mode.
- Existing specialist capability is not destroyed during migration.

### Negative

- Two mapper routes exist temporarily.
- The legacy route remains a maintenance burden.
- Some specialist workflows require switching routes.
- Canonical replacement controls must be implemented before legacy retirement.

## Interaction rules

- Navigate is the safe default.
- Edit mode is required for node movement.
- Nodes use touch-sized hit targets.
- The active node captures its pointer.
- Pointer cancellation must end the drag safely.
- Scenario previews are read-only.
- Essential actions must not rely on hover or double-click.

## Legacy retirement criteria

The legacy route can be deprecated only when canonical equivalents exist for the workflows users still need, including:

- sector and ring editing;
- impact zones;
- node sizing;
- route editing;
- rich entity and relationship metadata;
- scenario editing;
- import of legacy data through canonical validation.

## Guardrail

Do not add new product capability only to the legacy state model. New work should target the canonical workspace unless it is a narrowly scoped compatibility or migration fix.
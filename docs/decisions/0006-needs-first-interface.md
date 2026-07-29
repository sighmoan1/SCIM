# ADR 0006: Lead the interface with the six needs, not the model machinery

Date: 2026-07-29

Status: accepted

## Context

Through 0.5.0 the primary route opened directly onto the canonical map
workspace. Its vocabulary (canonical model, revisions, proposals, semantic
versus view changes) is essential for contributors and for the review
workflow, but it is not how a person in a heatwave or a power cut thinks. The
map also rendered at fixed canvas scale, so a phone showed one corner of the
diagram, and the first visible actions were "Copy SCIM" and "Copy for AI".

SCIM itself ("Dealing in Security", 2010) starts from the six ways to die —
too hot, too cold, hunger, thirst, illness, injury — and the three service
families that protect against them. That framing is already plain language.

## Decision

The interface leads with derived answers to two user questions, computed
read-only from the one accepted `ScimDocument`:

1. **"Am I protected?"** — the Home dashboard groups the six needs under
   Shelter, Supply and Safety and classifies each as protected, at risk,
   unprotected or not mapped yet, using the existing critical-failure
   propagation engine. A guided builder adds protections as complete
   validated canonical changes (entity, relationships, deterministic radial
   placement) in one revision.
2. **"Something failed — what does that mean?"** — the Emergency workspace
   lets a user set entity statuses with large touch controls. These are
   ordinary human-origin semantic revisions. The screen then explains the
   propagated impact per need and names surviving backups.

The interactive canonical map remains first-class at `/map` (with fit-to-
screen zoom); text authoring, proposal review and the legacy mapper remain
at their existing routes, linked from `/more`. Navigation is a bottom tab
bar on phones.

The fresh-workspace default is a personal household starter model rather
than the hospital example, because the first-run experience must describe
the user's own situation.

## Consequences

- New derived-state modules (`lib/scim/needs.ts`, `lib/scim/guided.ts`)
  read the canonical document or return complete validated documents; no UI
  surface writes accepted state outside `commit`/revision recording.
- Need status is presentation logic, not a schema concept: nothing was added
  to schema 0.2, the DSL or the renderer profile.
- The guided builder's suggestion catalogue is deliberately generic and
  synthetic; correctness of a real map still depends on the user.
- The conservative propagation rule means an entity with several critical
  providers and no explicit requirement group only fails when all providers
  fail; need status inherits that conservatism.
- Screens derive their own view of shared browser-local state; there is no
  cross-tab live synchronisation beyond navigation remounts.

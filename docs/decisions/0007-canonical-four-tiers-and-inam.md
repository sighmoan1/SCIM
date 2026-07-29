# ADR 0007: Realise the full canonical model — four tiers and the INAM matrix

Date: 2026-07-29

Status: accepted

## Context

A review against the canonical source, *Dealing in Security* (Gupta & Bennett,
2010), together with the supplementary FluSCIM manual (Lucas González, 2011/13),
found that the application modelled only the **individual** tier — the six ways
to die — while presenting itself as "SCIM." The canonical model is broader:

- **Four tiers of cooperation** — individual, group, organisation, nation-state
  — each with its own critical needs beyond the individual six.
- **Eighteen needs** total: individual (6), group (communications, transport,
  space, resource control), organisation (shared map, plan, succession),
  nation-state (jurisdiction, citizens, territory, effective organisations,
  international recognition).
- **Seven layers of provision** (plus the island layer for archipelagos).
- **Two canonical views**: the radial map (centre-out) *and* the **INAM matrix**
  (needs × levels), which shows where every critical resource comes from and how
  needs interdepend.
- **Four delivery paths**: produce on site, grid, delivery, fetch.

The schema (0.2) already permitted this vocabulary and an `inam` view type;
nothing rendered them and no UI authored beyond the individual tier.

Source hierarchy correction recorded here: *Dealing in Security* is **canonical**;
FluSCIM and any AI-assisted strategy material are **supplementary**. An earlier
planning draft elevated a supplementary AI conversation's invented mnemonic
("SCIM-5") toward the centre of the product; that is rejected. The five-step
reflex and any training remain supplementary ways of *using* the canonical
model, not a replacement for it, and are out of scope for this ADR.

## Decision

Realise the canonical model faithfully as views and authoring over the existing
`ScimDocument`, without changing the canonical model, schema 0.2 or the
`scim-radial-1` renderer:

1. A canonical taxonomy module (`lib/scim/tiers.ts`) defines the four tiers, the
   eighteen needs, the layers of provision and the delivery paths.
2. Needs assessment becomes tier-aware across all eighteen needs, keeping the
   individual six-ways-to-die view intact.
3. The **INAM matrix** is rendered as the second canonical view (`/matrix`),
   deterministically derived from the same document.
4. Home gains a four-tiers overview; the map gains first-class delivery-path
   authoring and a prominent human↔AI "work on this map" action, reinforcing the
   map as the shared model humans and AIs coordinate around.

## Consequences

- A SCIM map can now describe a group, an organisation, a municipality or a
  state — not only one person — and be read in both canonical views.
- The map remains first-class as the shared, portable, human- and AI-readable
  collaboration substrate; no AI writes accepted state directly.
- No schema/renderer version change; new data validates and round-trips.
- The mobile matrix is horizontally scrollable; providers at further layers sit
  off the initial viewport (row status still summarises coverage). A future
  improvement may pin the need column and improve small-screen density.
- Supplementary directions (substitution workflow, OODA iteration, AI game-
  master practice) build on this canonical base and are tracked separately.

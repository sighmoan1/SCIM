# Changelog

Notable application changes are recorded here. The application, SCIM schema and renderer profile are versioned independently.

## 0.6.0 — 2026-07-29

Needs-first interface rewrite: the application now leads with the six ways to die rather than with the canonical model machinery.

- Added a Home dashboard at `/` that shows live protected / at-risk / unprotected status for each of the six needs, grouped by Shelter, Supply and Safety, with plain-language explanations derived from the canonical document and failure propagation.
- Added a guided builder inside each need card: tap-to-add common protections (with their typical upstream dependency) or a custom protector; entities, relationships and deterministic radial placement are created as one validated canonical revision.
- Added a mobile-first Emergency workspace at `/emergency`: mark infrastructure Working / Struggling / Down with large touch targets, see which needs are now at risk and why, see surviving backups, undo, and one-tap all clear. Status reports are ordinary human-origin semantic revisions.
- Moved the interactive radial map to `/map`, added zoom in/out and fit-to-screen (the whole map is now visible on a phone by default), and rewrote its copy in plain language.
- Added `/more`: a plain-language explanation of SCIM, AI collaboration and export actions moved out of the map header, links to the advanced editor/review/legacy tools, example loading, and version information.
- Added bottom tab navigation on phones and a top bar on larger screens.
- Added a personal household starter model (`my-resilience`) as the fresh-workspace default, including a ready-made power-cut scenario; the hospital example remains loadable from More.
- Added `lib/scim/needs.ts` (derived need assessment) and `lib/scim/guided.ts` (suggestions and deterministic placement). Both are read-only or produce complete validated documents; the canonical model, schema 0.2, DSL and `scim-radial-1` renderer are unchanged.
- Added a full design system: brand palette with automatic light/dark themes (and a manual switcher under More), Inter typography, soft elevation, motion with reduced-motion support, loading skeletons and snackbar confirmations.
- Added the SCIM brand mark (radial-map motif), favicon, app icons and a web app manifest so the application can be installed to a phone's home screen.
- Added an animated six-segment resilience ring on Home summarising all six needs at a glance.
- Added comprehensive documentation for contributors, architecture, security, testing, mobile interaction, AI collaboration, workspace history and future work.
- Updated the README and current workspace guides.

## 0.5.0 — 2026-07-28

- Replaced the primary route with a canonical `ScimDocument` map.
- Added native Pointer Events for mouse, touch and pen.
- Added manual canonical entity and relationship editing.
- Added browser-local accepted state and one human/AI revision history.
- Added undo, scenario previews and simulation explanations.
- Connected reviewed AI proposals to the same accepted workspace.
- Preserved the original mapper at `/legacy`.
- Schema remains 0.2; renderer remains `scim-radial-1`.

## 0.4.1 — 2026-07-28

- Added mobile Navigate and Edit modes to the original mapper.
- Added a pannable full-size viewport, pinch zoom and a temporary touch compatibility bridge.
- This bridge was superseded on the primary route by native Pointer Events in 0.5.0.

## 0.4.0 — 2026-07-28

- Added complete candidate proposal format with rationale, assumptions and open questions.
- Added deterministic canonical comparison and semantic/scenario/view counts.
- Added individual operation acceptance and validation of partial results.
- Added the `/review` workspace and global navigation.
- Established that AI output is a proposal until human acceptance.

## 0.3.1 — 2026-07-28

- Added explicit dependency requirement groups.
- Added `all`, `any` and `at-least` policies and minimum-provider thresholds.
- Added requirement-aware propagation and explanation traces.
- Schema remains 0.2.

## 0.3.0 — 2026-07-28

- Grounded the language in the original SCIM vocabulary.
- Published SCIM schema 0.2 and the immutable `scim-radial-1` renderer.
- Added frozen radial and INAM views.
- Added deterministic SVG rendering and text-only AI structural interpretation.
- Added complete portable AI handoff, SVG export and improved round trips.

## 0.2.0 — 2026-07-28

- Added the canonical Zod model and semantic/layout separation.
- Added SCIM DSL and Markdown parsing and serialisation.
- Added JSON, Mermaid and DOT export.
- Added legacy adapters, scenario application and failure propagation.
- Added `/editor`, CI verification and version information.
- Updated Next.js to the patched 15.5 maintenance line for deployment compatibility.

## 0.1.0 — initial prototype

- Added the original radial mapper, seven layers, six threat sectors, manually positioned elements, connections, impact zones, copied-map scenarios and legacy JSON import/export.

## Maintenance rule

Every release entry should state user-visible changes, schema and renderer compatibility, persistence migrations, trust-boundary changes and known superseded behaviour. Planned capability belongs in `docs/roadmap.md`, not in a released section.
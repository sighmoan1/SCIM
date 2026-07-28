# Changelog

Notable application changes are recorded here. The application, SCIM schema and renderer profile are versioned independently.

## Unreleased

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
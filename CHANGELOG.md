# Changelog

Notable application changes are recorded here. The application, SCIM schema and renderer profile are versioned independently.

## 0.8.2 — 2026-07-30

Readable scroll-led mobile layout. SCIM schema remains 0.2 and the `scim-radial-1` renderer profile is unchanged.

- Increased the baseline type size on coarse-pointer devices instead of compressing the dashboard to fit above the fold.
- Strongly compensated for Android desktop-style layout viewports so text remains physically readable.
- Changed the Home hero to a vertical mobile composition and allowed the dashboard to scroll naturally.
- Changed the primary Home actions to full-width stacked controls on mobile.
- Added explicit document scrolling and overflow protection while retaining user zoom.
- Increased bottom-navigation clearance and refreshed the offline shell cache namespace.

Persistence, canonical semantics, renderer behaviour and AI trust boundaries are unchanged.

## 0.8.1 — 2026-07-30

Mobile viewport correction. SCIM schema remains 0.2 and the `scim-radial-1` renderer profile is unchanged.

- Removed the 38rem width cap from coarse-pointer Home layouts so Android browsers using a desktop-style layout viewport no longer centre a narrow, scaled-down column.
- Added conservative coarse-pointer typography scaling when a phone reports an abnormally wide layout viewport.
- Replaced breakpoint-based main-content bottom padding with pointer-aware safe-area spacing so the fixed mobile navigation does not cover other routes.
- Kept ordinary `width=device-width` behaviour and user zoom support intact.
- Refreshed the offline shell cache namespace.

Persistence, canonical semantics, renderer behaviour and AI trust boundaries are unchanged.

## 0.8.0 — 2026-07-30

Mobile-first product redesign. SCIM schema remains 0.2 and the `scim-radial-1` renderer profile is unchanged.

- Replaced breakpoint-only navigation with a coarse-pointer-aware mobile shell, so phones remain in the mobile interface even when a browser reports a desktop-sized layout viewport.
- Reduced the mobile primary navigation from five cramped tabs to four task-oriented destinations: Home, Emergency, Map and More.
- Rebuilt Home as a single-column touch interface with larger controls, clearer hierarchy, a compact resilience summary and progressive disclosure for each need.
- Replaced the dense four-tier card grid with one focused wider-system workflow linking to Build and Matrix.
- Added a sticky mobile action bar for reporting failures and opening the map.
- Made the resilience ring size-configurable and reduced its mobile footprint.
- Increased mobile spacing, safe-area padding and minimum touch-target sizes.
- Refreshed the service-worker cache namespace and added `/build` to the offline application shell.

Persistence keys, canonical semantics and AI disclosure boundaries are unchanged. The redesign changes presentation and navigation only; accepted SCIM documents remain compatible.

## 0.7.1 — 2026-07-29

Hardening release. SCIM schema remains 0.2 and the `scim-radial-1` renderer profile is unchanged.

- Corrected degraded/“Struggling” semantics: impaired infrastructure remains available but places the supported need at risk, instead of being treated as completely absent.
- Changed the displayed INAM matrix into a deterministic dependency projection containing direct providers and traced upstream providers, with their effective status and graph distance.
- Added referentially safe canonical entity and relationship deletion covering scenarios, radial routes and explicit INAM cells.
- Consolidated Home, Emergency, Map, Matrix and More on one transactional browser-local workspace API; completed pointer drags create one view revision.
- Fixed shared-workspace undo so its revision label is returned synchronously and revision state cannot lag React state.
- Added a guided `/build` workflow for group, organisation and nation-state needs.
- Added service-worker application-shell caching and an explicit offline-state banner.
- Added Node-native semantic regression tests for need status, mutation safety, INAM projection and starter-model text round trips.
- Made tests part of `pnpm verify` and GitHub Actions.

Persistence keys and AI disclosure boundaries are unchanged. The advanced Model editor still requires an explicit reviewed replacement flow before it can transactionally replace accepted workspace state.

## 0.7.0 — 2026-07-29

Faithful realisation of the canonical model in *Dealing in Security* (Gupta & Bennett, 2010), after a review found the app modelled only the individual tier. Canonical model, schema 0.2 and the `scim-radial-1` renderer are unchanged; this adds views and authoring over the vocabulary the schema already permitted.

- Added `lib/scim/tiers.ts`: the canonical taxonomy — the **four tiers of cooperation** (individual, group, organisation, nation-state), the **eighteen critical needs** grouped by tier, the **seven layers of provision** (plus island), and the **four service delivery paths** (on-site / grid / delivery / fetch).
- Made needs assessment **tier-aware** across all eighteen needs (`assessAllTiers`, `assessCanonicalNeed`, `mappedTierIds` in `lib/scim/needs.ts`), keeping the six-ways-to-die individual view intact.
- Added the **INAM needs matrix** — the second canonical view — at `/matrix`: needs as rows grouped by tier, layers of provision as columns, showing where each vital need is met and where it is not (`lib/scim/inam.ts`, `components/inam-matrix.tsx`).
- Added a **four-tiers overview** to Home linking to the matrix, so the app no longer presents as individual-only.
- Made **delivery paths** first-class when authoring dependencies on the map, and shown in the relationship list.
- Surfaced human↔AI collaboration on the map as a prominent **"Work on this with an AI"** action (the portable text handoff), reinforcing the map as a shared model people and AIs coordinate around; nothing is transmitted implicitly.
- Added a worked **town example** spanning all four tiers (`lib/scim/town-example.ts`), loadable from More, so the matrix demonstrates the full model.
- Added a fifth navigation tab (Matrix). Documented in ADR 0007.

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

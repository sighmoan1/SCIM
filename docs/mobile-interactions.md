# Legacy mobile compatibility layer

Status: historical documentation for application 0.4.1. Superseded on the primary route by the canonical native-Pointer-Events workspace in 0.5.0.

Current contributors should read [`mobile-and-accessibility.md`](mobile-and-accessibility.md) and [`canonical-workspace.md`](canonical-workspace.md).

## Why the compatibility layer existed

The original radial mapper was written around desktop mouse events and a desktop-sized canvas. SCIM 0.4.1 added a temporary shell so the existing mapper could be used on touch devices without removing desktop editing while the canonical migration was built.

The historical implementation remains relevant at `/legacy`.

## Navigate mode

Navigate mode was the mobile default.

- The full map retained a desktop-sized working surface instead of being compressed into an unreadable phone-width diagram.
- The viewport could be panned using normal touch scrolling.
- Browser pinch zoom remained available.
- **Centre** returned the working surface to its centre.
- Normal form controls and buttons kept native touch behaviour.

## Edit map mode

Edit mode translated one active touch pointer into mouse events expected by the legacy mapper.

- One-finger drag moved existing draggable objects.
- A tap generated the existing click interaction.
- A double-tap generated the existing double-click interaction.
- Pointer capture kept a drag active outside the original SVG object.
- Form controls, links and dialogs were excluded from translation.

This reduced accidental movement while panning, but retained the legacy event and state architecture.

## Why it was superseded

The compatibility approach had unavoidable limitations:

- touch events were translated into mouse events;
- the legacy mapper still owned semantic and layout state privately;
- manual edits did not naturally enter the canonical human/AI history;
- essential editing inherited hover, double-click and small-handle assumptions;
- scenarios remained copied maps;
- interaction behaviour was difficult to reason about and test.

## Current architecture

Application 0.5.0 replaced the primary `/` route with:

- direct `ScimDocument` editing;
- native Pointer Events for mouse, touch and pen;
- pointer capture on node drags;
- explicit Navigate and Edit modes;
- touch-sized node hit targets;
- one canonical revision per completed drag;
- read-only scenario previews;
- shared human/AI accepted state and history.

The touch-to-mouse bridge remains only as part of the preserved legacy route and should not be copied into new canonical controls.

## Historical lesson

A compatibility bridge can preserve working capability during an incremental migration, but it should have an explicit retirement target. Mobile support is complete only when the underlying state and interaction model are mobile-native, not when touch is converted into desktop events.
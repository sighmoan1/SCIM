# Mobile map interaction modes

The original radial mapper was written around desktop mouse events and a desktop-sized canvas. Replacing its internal state and handlers will take an incremental migration because the component also contains the current manual editing workflow.

SCIM 0.4.1 introduces a compatibility shell so the existing mapper is usable on touch devices without removing desktop editing.

## Navigate mode

Navigate mode is the mobile default.

- The full map retains a desktop-sized working surface rather than being compressed into an unreadable phone-width diagram.
- The viewport can be panned using normal touch scrolling.
- Browser pinch zoom remains available.
- **Centre** scrolls the working surface back to its centre.
- Normal form controls and buttons keep native touch behaviour.

## Edit map mode

Edit mode translates one active touch pointer into the mouse events expected by the legacy mapper.

- One-finger drag moves existing draggable map objects.
- A tap produces the existing click interaction.
- A double-tap produces the existing double-click interaction for editors which still depend on it.
- Pointer capture keeps a drag active when the finger leaves the original SVG object.
- Form controls, links and dialogs are excluded from the translation layer.

The two-mode design prevents an ordinary attempt to pan around the diagram from accidentally moving infrastructure objects.

## Accessibility

The toolbar uses native buttons with `aria-pressed` state. Mode changes and centring actions are announced through an `aria-live` region.

The compatibility layer does not change keyboard or mouse behaviour on desktop.

## Limitations

This release is a compatibility step, not the final mobile architecture:

- the legacy mapper still owns domain and layout state inside one large React component;
- object editing still inherits some desktop-oriented dialogs and small SVG handles;
- map zoom is browser-level rather than a canonical view transform;
- two-finger map-specific pinch and pan are not yet modelled as persistent view state;
- the compatibility bridge should eventually disappear as the mapper adopts pointer events directly.

## Next migration

The next stage should move the radial mapper onto the canonical `ScimDocument` plus a separate view object. Direct pointer-event handlers can then update a reviewable operation log shared by manual edits and AI proposals. That will allow:

1. native one-finger selection and explicit move mode;
2. persistent pan and zoom;
3. larger touch handles and contextual bottom sheets;
4. undo and revision history;
5. manual changes represented by the same structured diff used for AI proposals.

# Mobile and accessibility contract

## Status

The primary canonical map at `/` uses native Pointer Events for mouse, touch and pen. The historical mapper remains available at `/legacy` and may still contain desktop-oriented interactions while specialist controls are migrated.

Mobile behaviour is a product requirement, not a later responsive-design pass.

## Interaction modes

### Navigate

Navigate is the default mode.

- Browser scrolling and panning remain available.
- Pinch zoom remains available.
- Tapping a node may select it for inspection but must not begin an accidental drag.
- Scenario previews are safe to explore.

### Edit map

Edit mode enables direct manipulation.

- A pointer down on a node begins a possible drag.
- The node captures that pointer.
- Movement updates the frozen radial view placement.
- Pointer up or cancellation completes the interaction.
- One completed drag records one canonical view revision.

The mode distinction reduces accidental movement on touchscreens.

## Pointer Events

Primary map interaction must use:

- `onPointerDown`;
- `onPointerMove`;
- `onPointerUp`;
- `onPointerCancel`;
- `setPointerCapture` and `releasePointerCapture`.

Do not reintroduce synthetic touch-to-mouse translation for canonical controls.

Pointer handling must work for:

- mouse;
- single-touch input;
- stylus or pen;
- pointer cancellation caused by browser or operating-system gestures.

## Coordinate conversion

Pointer coordinates are converted from the rendered SVG rectangle into the declared SCIM view canvas:

```text
x = ((clientX - renderedLeft) / renderedWidth) * canvasWidth
y = ((clientY - renderedTop) / renderedHeight) * canvasHeight
```

The internal frozen geometry remains stable regardless of responsive display size.

## Target size

Movable node hit areas must be at least 48 by 48 SCIM view units, even when the visible node is smaller.

Visible resize, route or sector handles introduced later should also provide touch-sized invisible hit targets. Small decorative handles alone are not sufficient.

## Essential actions

An essential action must not require:

- hover;
- double-click;
- a right-click context menu;
- pixel-precise tapping;
- holding a pointer for an undocumented duration.

Selection should expose visible controls in an inspector or bottom sheet.

## Mobile layout

The interface should prioritise one task at a time on narrow screens:

- map interaction;
- selected-object inspection;
- entity or relationship editing;
- scenario inspection;
- proposal review.

Avoid compressing a desktop multi-column workspace until labels and controls become unusable. Prefer stacked sections, tabs or bottom sheets.

## Text editing on mobile

Large SCIM source areas should not be the only way to perform common mobile tasks. When source editing is available:

- preserve readable font size;
- avoid horizontal overflow where possible;
- keep validation close to the source;
- account for the virtual keyboard;
- provide explicit copy, paste and save actions;
- do not place essential controls under fixed footers.

## Scenario safety

Scenario previews are currently read-only.

This prevents a drag or inspector edit from changing the accepted baseline while the user is looking at a simulated result. A future scenario editor must have an explicit editing mode and clearly indicate whether a change affects:

- the accepted baseline;
- scenario operations;
- a scenario-specific view.

## Keyboard requirements

Core non-canvas controls must be keyboard accessible.

- Use native buttons, inputs, selects and links.
- Provide visible focus styles.
- Maintain a logical tab order.
- Give icon-only buttons accessible names.
- Support Enter and Space for button activation.
- Do not trap focus in custom overlays.

Direct keyboard node movement is not yet implemented. It is a known accessibility gap and should be added through explicit commands rather than simulating pointer movement.

## Screen-reader requirements

The application should expose:

- page and workspace headings;
- labelled navigation;
- selected entity or relationship details;
- mode state through `aria-pressed` or equivalent;
- live announcements for completed edits, validation errors and scenario results;
- meaningful labels for copy, download, delete and undo actions;
- text alternatives to visual status colours.

The text-only structural reading is also an important accessible representation of the diagram.

## Colour and status

Status must not be communicated by colour alone.

A node or relationship status should be available through:

- text in the inspector or structural reading;
- stroke pattern or icon where appropriate;
- accessible labels;
- colour as an additional cue.

New palette choices should meet suitable contrast for text and interactive boundaries.

## Error handling

Errors should:

- appear near the relevant control or source;
- remain in the document flow;
- use plain language;
- identify the affected entity, relationship, scenario or field;
- be announced when they block an action;
- never be shown only through `alert()`.

## Mobile review checklist

For every map or collaboration UI change, check at approximately:

- 320 px width;
- 375–390 px width;
- 768 px tablet width;
- desktop width.

Test:

1. navigate and pinch zoom;
2. switch to Edit mode;
3. select and drag a node;
4. cancel a pointer interaction;
5. open and use the inspector;
6. create an entity and relationship;
7. inspect a scenario without changing the baseline;
8. review and accept a proposal;
9. use undo;
10. use the interface with keyboard only for non-canvas controls;
11. zoom the browser to 200%;
12. rotate the device or resize the viewport;
13. use the virtual keyboard in text fields.

## Regression risks

Watch for:

- pointer capture not being released;
- drag completion not recording a revision;
- panning being blocked in Navigate mode;
- a scenario preview becoming editable;
- fixed navigation or version elements covering controls;
- controls depending on hover;
- overlays intercepting pointer events intended for nodes;
- SVG scaling changing canonical coordinates;
- touch gestures creating accidental relationships.

## Future work

Priority accessibility and mobile work includes:

- keyboard selection and movement of nodes;
- screen-reader-friendly graph traversal;
- contextual mobile bottom sheets;
- pinch-zoom state controlled by the app rather than only browser zoom;
- fit-to-view and centre-selection controls;
- accessible relationship creation that does not require canvas gestures;
- mobile scenario timeline and action-plan views;
- automated accessibility checks in CI.

The target is not merely that the page opens on a phone. A user must be able to understand, edit, simulate and review the same canonical model without switching to a desktop.
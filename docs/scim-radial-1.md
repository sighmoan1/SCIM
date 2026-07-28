# `scim-radial-1` renderer profile

Status: normative renderer profile 1

This profile turns a SCIM 0.2 frozen radial view into a self-contained SVG. Implementations MUST follow this profile rather than choosing their own layout or palette.

## Canvas and order

- Use the declared canvas as `viewBox="0 0 width height"`.
- Use a white `#ffffff` background.
- Paint in this order: sectors, ring bands and outlines, directed relationships, nodes, node labels and failed-node crosses.
- Preserve source order unless a rule below requires sorting.

## Sectors

- Sort sectors by ascending angle.
- A sector begins at its declared angle and ends at the next sector's angle.
- The final sector wraps to the first angle plus 360 degrees.
- Use fill and stroke `#ef4444`.
- Use fill opacity `0.07`, stroke opacity `0.35` and stroke width `1`.
- Place the label 28 units beyond the outermost ring at the sector midpoint.
- Sector labels use Arial/Helvetica/sans-serif, size 12, weight 700, colour `#1f2937`.

## Ring bands

Draw annular bands from the centre outwards using this ordered palette:

1. `#dcfce7`
2. `#bbf7d0`
3. `#86efac`
4. `#4ade80`
5. `#22c55e`
6. `#16a34a`
7. `#15803d`

Additional rings use the final colour.

- Band fill opacity is `0.32`.
- Ring outlines use `#374151`, opacity `0.65`, width `1`.
- Ring labels use `#374151`, Arial/Helvetica/sans-serif, size 11 and weight 600.
- Place a ring label at `max(inner radius + 12, outer radius - 15)` on its declared label angle.

## Relationships

- Draw each relationship in source-to-target order.
- An explicit route is a round-joined, round-capped polyline through the declared points.
- Without a route, draw a straight line between the centres of the placed source and target nodes.
- Use an 8 by 8 triangular arrow marker at the target end.
- Normal relationships use `#6b7280`, width `1.75`, opacity `0.9`.
- Critical relationships use `#111827`, width `2.5`, opacity `0.9`.
- Failed relationships use dash `5 5` and opacity `0.65`.

## Nodes

Nodes are rounded rectangles with corner radius `6` and stroke width `2`.

| Status | Fill | Stroke | Dash |
| --- | --- | --- | --- |
| `normal` | `#ffffff` | `#65a30d` | none |
| `degraded` | `#fef3c7` | `#f59e0b` | `3 2` |
| `failed` | `#fee2e2` | `#ef4444` | `5 5` |
| `new` | `#d1fae5` | `#10b981` | none |

A failed node also receives two diagonal lines across its full rectangle using its status stroke colour and width `2`.

## Node labels

- Use Arial/Helvetica/sans-serif, size `10`, weight `600`, colour `#1f2937`.
- Centre labels horizontally and vertically.
- Calculate `maxCharacters = max(1, floor((node width - 12) / 7))`.
- Split on whitespace and greedily append words while the candidate line is no longer than `maxCharacters`.
- If a single word exceeds the limit, keep the word intact on its own line.
- Use line height `12`.
- Calculate total text height as `line count * 12`.
- Place the first line at `node centre y - total height / 2 + 6`.

## Missing geometry

A frozen view MUST NOT be automatically rearranged.

- An entity without a placement is omitted and reported as a validation or rendering warning.
- A relationship whose source or target has no placement is omitted and reported.
- A route referencing a missing relationship is invalid.

## Equivalence

Compliant renderers produce the same geometry, ordering, colours, text wrapping and SVG structure in all material respects. Font rasterisation and anti-aliasing may vary by operating system, so compliance means layout-equivalent output rather than byte-identical pixels.

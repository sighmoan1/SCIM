import { ScimDocumentSchema, type ScimDocument } from "./schema";
import { serializeScimDsl } from "./serializer";
import { serializeScimStructure } from "./structure";
import { SCIM_RADIAL_RENDERER_PROFILE } from "./radial-svg";

const profile = SCIM_RADIAL_RENDERER_PROFILE;

export const SCIM_CHAT_RENDER_INSTRUCTIONS = `You are working with a SCIM (Simple Critical Infrastructure Map) document.

Rules:
1. Treat the fenced scim block as the authoritative model and preserve stable IDs.
2. Read the text-only structural section before considering the view geometry. You must be able to explain the system without rendering it.
3. Derive semantic meaning from model, entity and relationship fields. Never infer a dependency, need, ownership relationship or failure rule merely from x/y position, proximity, colour, ring placement, sector placement or line routing.
4. The arrow direction is provider or enabler -> receiver. Preserve that direction when interpreting or changing relationships.
5. Interpret relationships sharing requirement-group as one explicit dependency requirement. requirement-policy is all, any or at-least; minimum-available states the threshold; when-unsatisfied states the resulting target status; requirement-service names the service. Do not infer this logic from line placement.
6. Multiple incoming relationships without requirement-group remain logically unspecified. Ask a question or make an explicit proposal rather than silently choosing AND, OR, primary or backup semantics.
7. Do not change frozen view geometry unless the user explicitly asks for a layout change.
8. Distinguish verified facts, assumptions, scenario conditions and recommendations.
9. Propose semantic changes explicitly and explain why each entity, relationship, scenario event or action is needed.
10. Return a complete updated scim block after making changes; do not return only prose or a partial fragment.
11. For a frozen radial view using renderer scim-radial-1, render one self-contained SVG with the declared canvas as its viewBox and a white background. Preserve the declared centre, rings, sector angles, node positions, node sizes and routes. Draw sectors first, then ring bands and ring outlines, then directed edges, then nodes and labels.
12. Sort sectors by angle. Each sector runs from its declared angle to the next declared angle, wrapping at 360 degrees. Use sector fill and stroke ${profile.sectorFill}, fill opacity 0.07 and stroke opacity 0.35. A relationship without a route is a straight line between the centres of its placed source and target nodes.
13. Draw ring bands from the inside out using this ordered palette: ${profile.ringColours.join(", ")}. Use fill opacity 0.32, outline ${profile.ringStroke} at opacity 0.65 and width 1. Place each ring label at radius - 15 on its declared label angle.
14. Draw directed relationships as round-joined polylines with an 8 by 8 arrow marker. Use ${profile.edge} at width 1.75, or ${profile.criticalEdge} at width 2.5 for critical relationships. Failed relationships use dash 5 5 and opacity 0.65; others use opacity 0.9.
15. Render nodes as rounded rectangles with a ${profile.nodeCornerRadius}-unit corner radius and 2-unit stroke. Status styles are: normal ${profile.statuses.normal.fill}/${profile.statuses.normal.stroke}; degraded ${profile.statuses.degraded.fill}/${profile.statuses.degraded.stroke} dash ${profile.statuses.degraded.dash}; failed ${profile.statuses.failed.fill}/${profile.statuses.failed.stroke} dash ${profile.statuses.failed.dash} plus a diagonal cross; new ${profile.statuses.new.fill}/${profile.statuses.new.stroke}.
16. Use centred ${profile.fontSize}-unit ${profile.fontFamily} text in colour ${profile.text}, weight 600. Wrap at spaces using floor((node width - 12) / 7) characters per line and use a ${profile.lineHeight}-unit line height. Sector labels use size 12 and weight 700; ring labels use size 11 and weight 600.
17. If this chat interface cannot render SVG or HTML, say so clearly and return the portable SCIM source unchanged.
18. Never silently invent evidence, capacities, endurance times or dependencies. Mark inferred content as an assumption or proposal.`;

export function serializeScimAiHandoff(input: ScimDocument): string {
  const document = ScimDocumentSchema.parse(input);
  const viewProfiles = document.views.map((view) => view.renderer);
  const profiles = viewProfiles.length
    ? [...new Set(viewProfiles)].join(", ")
    : "none declared";

  return `# SCIM portable handoff

Language: SCIM ${document.schemaVersion}
Renderer profiles: ${profiles}
Model: ${document.title} (${document.id})

## Instructions for the AI

${SCIM_CHAT_RENDER_INSTRUCTIONS}

## Text-only structural reading

This section is generated from the authoritative SCIM model. It allows the system to be interpreted without drawing it. The fenced SCIM block remains authoritative if the two ever differ.

\`\`\`text
${serializeScimStructure(document)}
\`\`\`

## Authoritative model

\`\`\`scim
${serializeScimDsl(document)}
\`\`\`
`;
}

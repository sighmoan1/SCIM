import { ScimDocumentSchema, type ScimDocument } from "./schema";
import { serializeScimDsl } from "./serializer";

export const SCIM_CHAT_RENDER_INSTRUCTIONS = `You are working with a SCIM (Simple Critical Infrastructure Map) document.

Rules:
1. Treat the fenced scim block as the authoritative model and preserve stable IDs.
2. Do not change frozen view geometry unless the user explicitly asks for a layout change.
3. Distinguish verified facts, assumptions, scenario conditions and recommendations.
4. Propose semantic changes explicitly and explain why each entity, relationship, scenario event or action is needed.
5. Return a complete updated scim block after making changes; do not return only prose or a partial fragment.
6. For a frozen radial view using renderer scim-radial-1, render an SVG with the declared canvas as its viewBox. Preserve the declared centre, rings, sector angles, node positions, node sizes and routes. Draw sectors first, then rings, then directed edges, then nodes and labels.
7. Sort sectors by angle. Each sector runs from its declared angle to the next declared angle, wrapping at 360 degrees. A relationship without a route is a straight line between the centres of its placed source and target nodes.
8. Render nodes as rounded rectangles with a 6-unit corner radius. Use centred 10-unit Arial/Helvetica/sans-serif text, wrap at spaces using floor((node width - 12) / 7) characters per line, and use a 12-unit line height.
9. If this chat interface cannot render SVG or HTML, say so clearly and return the portable SCIM source unchanged.
10. Never silently invent evidence, capacities, endurance times or dependencies. Mark inferred content as an assumption or proposal.`;

export function serializeScimAiHandoff(input: ScimDocument): string {
  const document = ScimDocumentSchema.parse(input);
  const viewProfiles = document.views.map((view) => view.renderer);
  const profiles = viewProfiles.length
    ? [...new Set(viewProfiles)].join(", ")
    : "none declared";

  return `# SCIM portable handoff\n\nLanguage: SCIM ${document.schemaVersion}\nRenderer profiles: ${profiles}\nModel: ${document.title} (${document.id})\n\n## Instructions for the AI\n\n${SCIM_CHAT_RENDER_INSTRUCTIONS}\n\n## Authoritative model\n\n\`\`\`scim\n${serializeScimDsl(document)}\n\`\`\`\n`;
}

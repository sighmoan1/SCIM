import { parseScimMarkdown } from "./parser";
import { serializeScimAiHandoff } from "./handoff";
import { serializeScimDsl } from "./serializer";
import { ScimDocumentSchema, type ScimDocument } from "./schema";

export interface ScimProposal {
  title: string;
  rationale: string;
  assumptions: string[];
  openQuestions: string[];
  candidate: ScimDocument;
  source: string;
}

function heading(markdown: string): string {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "Untitled SCIM proposal";
}

function section(markdown: string, names: string[]): string {
  const expected = new Set(names.map((name) => name.toLowerCase()));
  const lines = markdown.split(/\r?\n/);
  let collecting = false;
  const collected: string[] = [];

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      if (collecting) break;
      collecting = expected.has(sectionMatch[1].trim().toLowerCase());
      continue;
    }
    if (collecting && line.trim().startsWith("```scim")) break;
    if (collecting) collected.push(line);
  }

  return collected.join("\n").trim();
}

function bullets(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
    .filter(Boolean);
}

export function parseScimProposal(markdown: string): ScimProposal {
  return {
    title: heading(markdown),
    rationale: section(markdown, ["Rationale", "Reasoning"]),
    assumptions: bullets(section(markdown, ["Assumptions"])),
    openQuestions: bullets(section(markdown, ["Open questions", "Questions"])),
    candidate: parseScimMarkdown(markdown),
    source: markdown,
  };
}

export function serializeScimProposal(input: Omit<ScimProposal, "source">): string {
  const candidate = ScimDocumentSchema.parse(input.candidate);
  const assumptions = input.assumptions.length
    ? input.assumptions.map((item) => `- ${item}`).join("\n")
    : "- None declared.";
  const questions = input.openQuestions.length
    ? input.openQuestions.map((item) => `- ${item}`).join("\n")
    : "- None.";

  return `# ${input.title}\n\n## Rationale\n\n${input.rationale || "No rationale supplied."}\n\n## Assumptions\n\n${assumptions}\n\n## Open questions\n\n${questions}\n\n## Complete candidate model\n\n\`\`\`scim\n${serializeScimDsl(candidate)}\n\`\`\`\n`;
}

export function serializeScimProposalRequest(
  baselineInput: ScimDocument,
  request = "Review this SCIM model and propose improvements."
): string {
  const baseline = ScimDocumentSchema.parse(baselineInput);
  return `# SCIM proposal request\n\n${request}\n\nDo not claim that any proposed change has already been accepted. Return exactly one reviewable proposal using this structure:\n\n# <proposal title>\n\n## Rationale\n\nExplain the proposed changes and the problem each change addresses.\n\n## Assumptions\n\n- List every new assumption.\n\n## Open questions\n\n- List unresolved questions which a human should answer.\n\n## Complete candidate model\n\nReturn one complete fenced scim block. Preserve stable IDs for unchanged objects. Include the whole candidate model, not a fragment or prose-only answer. Keep frozen view geometry unchanged unless the proposal intentionally changes layout, and explain any layout change separately.\n\n---\n\n${serializeScimAiHandoff(baseline)}\n`;
}

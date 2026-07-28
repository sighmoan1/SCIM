import { ScimDocumentSchema, type ScimDocument } from "./schema";

function quote(value: string): string {
  return JSON.stringify(value);
}

function scalar(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(String).join(", ")}]`;
  if (typeof value === "string") return /^[a-z0-9-]+$/.test(value) ? value : quote(value);
  return String(value);
}

export function serializeScimDsl(input: ScimDocument): string {
  const document = ScimDocumentSchema.parse(input);
  const lines: string[] = [`model ${document.id} ${quote(document.title)} {`];

  for (const entity of document.entities) {
    lines.push(`  entity ${entity.id} ${quote(entity.name)} {`);
    lines.push(`    kind: ${entity.kind}`);
    lines.push(`    layer: ${entity.layer}`);
    if (entity.description) lines.push(`    description: ${quote(entity.description)}`);
    if (entity.status !== "normal") lines.push(`    status: ${entity.status}`);
    if (entity.protectsAgainst.length) {
      lines.push(`    protects-against: [${entity.protectsAgainst.join(", ")}]`);
    }
    for (const [key, value] of Object.entries(entity.attributes)) {
      if (value !== undefined) lines.push(`    ${key}: ${scalar(value)}`);
    }
    lines.push("  }", "");
  }

  for (const relationship of document.relationships) {
    lines.push(`  ${relationship.from} -> ${relationship.to} {`);
    lines.push(`    id: ${relationship.id}`);
    lines.push(`    kind: ${relationship.kind}`);
    if (relationship.deliveryMode) lines.push(`    mode: ${relationship.deliveryMode}`);
    if (relationship.status !== "normal") lines.push(`    status: ${relationship.status}`);
    if (relationship.critical) lines.push("    critical: true");
    for (const [key, value] of Object.entries(relationship.attributes)) {
      if (value !== undefined) lines.push(`    ${key}: ${scalar(value)}`);
    }
    lines.push("  }", "");
  }

  for (const scenario of document.scenarios) {
    lines.push(`  scenario ${scenario.id} ${quote(scenario.name)} {`);
    if (scenario.description) lines.push(`    description: ${quote(scenario.description)}`);
    for (const change of scenario.changes) {
      if (change.operation === "set-entity-status") {
        lines.push(`    set ${change.entityId} status ${change.status}`);
      } else if (change.operation === "set-relationship-status") {
        lines.push(`    set relationship ${change.relationshipId} status ${change.status}`);
      }
    }
    lines.push("  }", "");
  }

  lines.push("}");
  return lines.join("\n");
}

export function serializeScimMarkdown(input: ScimDocument): string {
  const document = ScimDocumentSchema.parse(input);
  return `# ${document.title}\n\n${document.description}\n\n\`\`\`scim\n${serializeScimDsl(document)}\n\`\`\`\n`;
}

function mermaidId(id: string): string {
  return id.replace(/[^A-Za-z0-9_]/g, "_");
}

export function serializeMermaid(input: ScimDocument): string {
  const document = ScimDocumentSchema.parse(input);
  const lines = ["flowchart LR"];
  for (const entity of document.entities) {
    lines.push(`  ${mermaidId(entity.id)}[${JSON.stringify(entity.name)}]`);
  }
  for (const relationship of document.relationships) {
    const label = relationship.deliveryMode
      ? `${relationship.kind} · ${relationship.deliveryMode}`
      : relationship.kind;
    lines.push(
      `  ${mermaidId(relationship.from)} -->|${label.replace(/\|/g, "\\|")}| ${mermaidId(relationship.to)}`
    );
  }
  return lines.join("\n");
}

export function serializeDot(input: ScimDocument): string {
  const document = ScimDocumentSchema.parse(input);
  const lines = ["digraph SCIM {", "  rankdir=LR;"];
  for (const entity of document.entities) {
    lines.push(`  ${JSON.stringify(entity.id)} [label=${JSON.stringify(entity.name)}];`);
  }
  for (const relationship of document.relationships) {
    const label = relationship.deliveryMode
      ? `${relationship.kind} (${relationship.deliveryMode})`
      : relationship.kind;
    lines.push(
      `  ${JSON.stringify(relationship.from)} -> ${JSON.stringify(relationship.to)} [label=${JSON.stringify(label)}];`
    );
  }
  lines.push("}");
  return lines.join("\n");
}

import {
  ScimDocumentSchema,
  type ScimDocument,
  type ScimEntity,
  type ScimRelationship,
} from "./schema";

function quote(value: string): string {
  return JSON.stringify(value);
}

function scalar(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => scalar(item)).join(", ")}]`;
  if (typeof value === "string") {
    return /^[a-z0-9-]+$/.test(value) ? value : quote(value);
  }
  return String(value);
}

function entitySupports(entity: ScimEntity): string[] {
  return [...new Set([...entity.supportsNeeds, ...entity.protectsAgainst])];
}

function isSimpleAddedEntity(entity: ScimEntity): boolean {
  return (
    !entity.description &&
    entity.status === "new" &&
    entity.supportsNeeds.length === 0 &&
    entity.protectsAgainst.length === 0 &&
    entity.failureModes.length === 0 &&
    Object.keys(entity.attributes).length === 0 &&
    entity.evidence.length === 0
  );
}

function isSimpleAddedRelationship(relationship: ScimRelationship): boolean {
  return (
    relationship.status === "new" &&
    relationship.serviceEffects.length === 0 &&
    Object.keys(relationship.attributes).length === 0 &&
    relationship.evidence.length === 0
  );
}

export function serializeScimDsl(input: ScimDocument): string {
  const document = ScimDocumentSchema.parse(input);
  const lines: string[] = [`model ${document.id} ${quote(document.title)} {`];

  lines.push(`  perspective: ${document.perspective}`);
  if (document.focusEntityId) lines.push(`  focus: ${document.focusEntityId}`);
  if (document.description) lines.push(`  description: ${quote(document.description)}`);
  lines.push("");

  for (const entity of document.entities) {
    lines.push(`  entity ${entity.id} ${quote(entity.name)} {`);
    lines.push(`    kind: ${entity.kind}`);
    lines.push(`    layer: ${entity.layer}`);
    if (entity.description) lines.push(`    description: ${quote(entity.description)}`);
    if (entity.status !== "normal") lines.push(`    status: ${entity.status}`);
    const supports = entitySupports(entity);
    if (supports.length) lines.push(`    supports: [${supports.join(", ")}]`);
    if (entity.failureModes.length) {
      lines.push(`    failure-modes: [${entity.failureModes.join(", ")}]`);
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
    if (relationship.serviceEffects.length) {
      lines.push(`    service-effects: [${relationship.serviceEffects.join(", ")}]`);
    }
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
      } else if (change.operation === "add-entity") {
        if (isSimpleAddedEntity(change.entity)) {
          lines.push(
            `    add entity ${change.entity.id} ${quote(change.entity.name)} kind ${change.entity.kind} layer ${change.entity.layer}`
          );
        } else {
          lines.push(`    add entity-json ${JSON.stringify(change.entity)}`);
        }
      } else if (isSimpleAddedRelationship(change.relationship)) {
        const mode = change.relationship.deliveryMode
          ? ` mode ${change.relationship.deliveryMode}`
          : "";
        const critical = change.relationship.critical
          ? " critical true"
          : "";
        lines.push(
          `    add relationship ${change.relationship.from} -> ${change.relationship.to} id ${change.relationship.id} kind ${change.relationship.kind}${mode}${critical}`
        );
      } else {
        lines.push(
          `    add relationship-json ${JSON.stringify(change.relationship)}`
        );
      }
    }
    lines.push("  }", "");
  }

  for (const view of document.views) {
    lines.push(`  view ${view.id} ${view.type} ${quote(view.name)} {`);
    lines.push(`    renderer: ${view.renderer}`);

    if (view.type === "radial") {
      lines.push(`    layout: ${view.layout}`);
      lines.push(`    canvas: ${view.canvas.width} ${view.canvas.height}`);
      lines.push(`    centre: ${view.centre.x} ${view.centre.y}`);
      lines.push(`    segments: ${view.showSegments}`);
      lines.push("");

      for (const ring of view.rings) {
        const labelAngle = ring.labelAngle === -90
          ? ""
          : ` label-angle ${ring.labelAngle}`;
        lines.push(`    ring ${ring.layer} radius ${ring.radius}${labelAngle}`);
      }
      if (view.rings.length) lines.push("");

      for (const sector of view.sectors) {
        lines.push(`    sector ${sector.need} angle ${sector.angle}`);
      }
      if (view.sectors.length) lines.push("");

      for (const node of view.nodes) {
        lines.push(
          `    place ${node.entityId} at ${node.x} ${node.y} size ${node.width} ${node.height}`
        );
      }
      if (view.nodes.length) lines.push("");

      for (const route of view.routes) {
        const points = route.points
          .map((point) => `${point.x} ${point.y}`)
          .join(", ");
        lines.push(`    route ${route.relationshipId} via ${points}`);
      }
    } else {
      lines.push(`    rows: [${view.rowNeeds.join(", ")}]`);
      lines.push(`    columns: [${view.columns.join(", ")}]`);
      for (const cell of view.cells) {
        lines.push(
          `    cell ${cell.rowNeed} ${cell.column}: [${cell.entityIds.join(", ")}]`
        );
      }
    }

    lines.push("  }", "");
  }

  while (lines.at(-1) === "") lines.pop();
  lines.push("}");
  return lines.join("\n");
}

export function serializeScimMarkdown(input: ScimDocument): string {
  const document = ScimDocumentSchema.parse(input);
  const description = document.description ? `${document.description}\n\n` : "";
  return `# ${document.title}\n\n${description}\`\`\`scim\n${serializeScimDsl(document)}\n\`\`\`\n`;
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

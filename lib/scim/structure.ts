import { ScimDocumentSchema, type ScimDocument } from "./schema";

function list(values: string[]): string {
  return values.length ? values.join(", ") : "none";
}

function entityLabel(document: ScimDocument, entityId: string): string {
  const entity = document.entities.find((candidate) => candidate.id === entityId);
  return entity ? `${entity.id} (${entity.name})` : entityId;
}

/**
 * Produce a deterministic, entirely text-based reading of a SCIM document.
 *
 * This projection deliberately separates semantic structure from presentation.
 * An AI can ignore every coordinate and still understand the entities, needs,
 * dependencies and scenarios. The final section then records the optional view
 * structure needed to reproduce a particular diagram.
 */
export function serializeScimStructure(input: ScimDocument): string {
  const document = ScimDocumentSchema.parse(input);
  const lines: string[] = [
    `SCIM ${document.schemaVersion} STRUCTURAL READING`,
    `Model: ${document.id} (${document.title})`,
    `Perspective: ${document.perspective}`,
    `Focus: ${document.focusEntityId ? entityLabel(document, document.focusEntityId) : "none"}`,
  ];

  if (document.description) lines.push(`Description: ${document.description}`);

  lines.push("", "SEMANTIC ENTITIES");
  if (!document.entities.length) lines.push("- none");
  for (const entity of document.entities) {
    const supports = [...new Set([...entity.supportsNeeds, ...entity.protectsAgainst])];
    lines.push(
      `- ${entity.id} (${entity.name}): kind=${entity.kind}; layer=${entity.layer}; status=${entity.status}; supports=[${list(supports)}]; failure-modes=[${list(entity.failureModes)}]`
    );
    if (entity.description) lines.push(`  description: ${entity.description}`);
    if (Object.keys(entity.attributes).length) {
      lines.push(`  attributes: ${JSON.stringify(entity.attributes)}`);
    }
    if (entity.evidence.length) {
      lines.push(`  evidence: ${JSON.stringify(entity.evidence)}`);
    }
  }

  lines.push("", "SEMANTIC RELATIONSHIPS (PROVIDER/ENABLER -> RECEIVER)");
  if (!document.relationships.length) lines.push("- none");
  for (const relationship of document.relationships) {
    lines.push(
      `- ${relationship.id}: ${entityLabel(document, relationship.from)} -> ${entityLabel(document, relationship.to)}; kind=${relationship.kind}; mode=${relationship.deliveryMode ?? "unspecified"}; critical=${relationship.critical}; status=${relationship.status}; service-effects=[${list(relationship.serviceEffects)}]`
    );
    if (Object.keys(relationship.attributes).length) {
      lines.push(`  attributes: ${JSON.stringify(relationship.attributes)}`);
    }
    if (relationship.evidence.length) {
      lines.push(`  evidence: ${JSON.stringify(relationship.evidence)}`);
    }
  }

  lines.push("", "SCENARIOS (CHANGES TO THE BASELINE)");
  if (!document.scenarios.length) lines.push("- none");
  for (const scenario of document.scenarios) {
    lines.push(`- ${scenario.id} (${scenario.name})`);
    if (scenario.description) lines.push(`  description: ${scenario.description}`);
    if (!scenario.changes.length) lines.push("  changes: none");
    for (const change of scenario.changes) {
      if (change.operation === "set-entity-status") {
        lines.push(`  - set entity ${change.entityId} status ${change.status}`);
      } else if (change.operation === "set-relationship-status") {
        lines.push(`  - set relationship ${change.relationshipId} status ${change.status}`);
      } else if (change.operation === "add-entity") {
        lines.push(
          `  - add entity ${change.entity.id} (${change.entity.name}); kind=${change.entity.kind}; layer=${change.entity.layer}`
        );
      } else {
        lines.push(
          `  - add relationship ${change.relationship.id}: ${change.relationship.from} -> ${change.relationship.to}; kind=${change.relationship.kind}`
        );
      }
    }
  }

  lines.push("", "VIEW STRUCTURE (PRESENTATION, NOT SEMANTIC INFERENCE)");
  if (!document.views.length) lines.push("- none");
  for (const view of document.views) {
    lines.push(`- ${view.id} (${view.name}): type=${view.type}; renderer=${view.renderer}`);
    if (view.type === "radial") {
      lines.push(
        `  layout=${view.layout}; canvas=${view.canvas.width}x${view.canvas.height}; centre=${view.centre.x},${view.centre.y}; segments=${view.showSegments}`
      );
      lines.push(
        `  rings(inner-to-outer): ${view.rings.map((ring) => `${ring.layer}@${ring.radius}`).join(" | ") || "none"}`
      );
      lines.push(
        `  sectors: ${[...view.sectors]
          .sort((a, b) => a.angle - b.angle)
          .map((sector) => `${sector.need}@${sector.angle}deg`)
          .join(" | ") || "none"}`
      );
      lines.push(
        `  placements: ${view.nodes
          .map((node) => `${node.entityId}@(${node.x},${node.y})[${node.width}x${node.height}]`)
          .join(" | ") || "none"}`
      );
      lines.push(
        `  routes: ${view.routes
          .map(
            (route) =>
              `${route.relationshipId}:${route.points
                .map((point) => `(${point.x},${point.y})`)
                .join("->")}`
          )
          .join(" | ") || "none"}`
      );
    } else {
      lines.push(`  rows: ${view.rowNeeds.join(" | ")}`);
      lines.push(`  columns: ${view.columns.join(" | ")}`);
      for (const cell of view.cells) {
        lines.push(
          `  cell ${cell.rowNeed} x ${cell.column}: [${cell.entityIds.join(", ")}]${cell.note ? `; note=${cell.note}` : ""}`
        );
      }
    }
  }

  lines.push(
    "",
    "INTERPRETATION RULES",
    "- Semantic meaning comes from model, entity and relationship fields, not from x/y position, proximity, colour or line routing.",
    "- A radial ring repeats an entity's declared locality layer; it does not create that layer membership.",
    "- A sector is a presentation of a declared need; it does not by itself assert that a nearby entity supports that need.",
    "- Multiple incoming relationships do not automatically mean all are required or that any one is sufficient. Treat dependency logic as unspecified unless the model states it explicitly in typed fields or attributes.",
    "- Frozen view geometry is required only to reproduce the same diagram; it is not required to understand the infrastructure structure."
  );

  return lines.join("\n");
}

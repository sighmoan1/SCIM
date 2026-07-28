import {
  ScimDocumentSchema,
  type ScimDocument,
  type ScimScenario,
} from "./schema";

export interface SimulationResult {
  document: ScimDocument;
  changedEntityIds: string[];
  changedRelationshipIds: string[];
  warnings: string[];
}

export function applyScenario(
  input: ScimDocument,
  scenarioOrId: ScimScenario | string
): SimulationResult {
  const baseline = ScimDocumentSchema.parse(input);
  const scenario =
    typeof scenarioOrId === "string"
      ? baseline.scenarios.find((candidate) => candidate.id === scenarioOrId)
      : scenarioOrId;

  if (!scenario) throw new Error(`Unknown scenario: ${scenarioOrId}`);

  const entities = new Map(
    baseline.entities.map((entity) => [entity.id, structuredClone(entity)])
  );
  const relationships = new Map(
    baseline.relationships.map((relationship) => [
      relationship.id,
      structuredClone(relationship),
    ])
  );
  const changedEntityIds = new Set<string>();
  const changedRelationshipIds = new Set<string>();
  const warnings: string[] = [];

  for (const change of scenario.changes) {
    if (change.operation === "set-entity-status") {
      const entity = entities.get(change.entityId);
      if (!entity) {
        warnings.push(`Unknown entity ${change.entityId}`);
        continue;
      }
      entity.status = change.status;
      changedEntityIds.add(entity.id);
      continue;
    }

    if (change.operation === "set-relationship-status") {
      const relationship = relationships.get(change.relationshipId);
      if (!relationship) {
        warnings.push(`Unknown relationship ${change.relationshipId}`);
        continue;
      }
      relationship.status = change.status;
      changedRelationshipIds.add(relationship.id);
      continue;
    }

    if (change.operation === "add-entity") {
      entities.set(change.entity.id, structuredClone(change.entity));
      changedEntityIds.add(change.entity.id);
      continue;
    }

    relationships.set(
      change.relationship.id,
      structuredClone(change.relationship)
    );
    changedRelationshipIds.add(change.relationship.id);
  }

  return {
    document: ScimDocumentSchema.parse({
      ...baseline,
      entities: [...entities.values()],
      relationships: [...relationships.values()],
      scenarios: baseline.scenarios,
    }),
    changedEntityIds: [...changedEntityIds],
    changedRelationshipIds: [...changedRelationshipIds],
    warnings,
  };
}

export interface PropagationOptions {
  relationshipKinds?: string[];
  failOnStatuses?: Array<"degraded" | "failed">;
  maximumPasses?: number;
}

/**
 * Conservative deterministic propagation. An entity fails only when every
 * incoming critical dependency is failed. This avoids pretending SCIM knows
 * capacities or redundancy that have not been explicitly modelled.
 */
export function propagateCriticalFailures(
  input: ScimDocument,
  options: PropagationOptions = {}
): SimulationResult {
  const document = ScimDocumentSchema.parse(structuredClone(input));
  const relationshipKinds = new Set(
    options.relationshipKinds ?? ["depends-on", "supplies", "backup-for"]
  );
  const failOnStatuses = new Set(options.failOnStatuses ?? ["failed"]);
  const maximumPasses = options.maximumPasses ?? document.entities.length + 1;
  const changedEntityIds = new Set<string>();
  const changedRelationshipIds = new Set<string>();
  const warnings: string[] = [];

  const entities = new Map(document.entities.map((entity) => [entity.id, entity]));

  for (let pass = 0; pass < maximumPasses; pass += 1) {
    let changed = false;

    for (const entity of document.entities) {
      if (entity.status === "failed") continue;
      const incoming = document.relationships.filter(
        (relationship) =>
          relationship.to === entity.id &&
          relationship.critical &&
          relationshipKinds.has(relationship.kind)
      );
      if (!incoming.length) continue;

      const allUnavailable = incoming.every((relationship) => {
        const source = entities.get(relationship.from);
        return (
          relationship.status === "failed" ||
          (source ? failOnStatuses.has(source.status as "degraded" | "failed") : true)
        );
      });

      if (allUnavailable) {
        entity.status = "failed";
        changedEntityIds.add(entity.id);
        incoming.forEach((relationship) => {
          if (relationship.status !== "failed") {
            relationship.status = "failed";
            changedRelationshipIds.add(relationship.id);
          }
        });
        changed = true;
      }
    }

    if (!changed) break;
    if (pass === maximumPasses - 1) {
      warnings.push("Failure propagation reached the maximum number of passes");
    }
  }

  return {
    document,
    changedEntityIds: [...changedEntityIds],
    changedRelationshipIds: [...changedRelationshipIds],
    warnings,
  };
}

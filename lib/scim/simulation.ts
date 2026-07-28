import {
  ScimDocumentSchema,
  type ScimDocument,
  type ScimScenario,
} from "./schema";
import {
  evaluateDependencyRequirements,
  extractDependencyRequirements,
} from "./requirements";

export interface SimulationResult {
  document: ScimDocument;
  changedEntityIds: string[];
  changedRelationshipIds: string[];
  warnings: string[];
  explanations: string[];
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
  const explanations: string[] = [];

  for (const change of scenario.changes) {
    if (change.operation === "set-entity-status") {
      const entity = entities.get(change.entityId);
      if (!entity) {
        warnings.push(`Unknown entity ${change.entityId}`);
        continue;
      }
      entity.status = change.status;
      changedEntityIds.add(entity.id);
      explanations.push(
        `Scenario ${scenario.id} sets entity ${entity.id} to ${change.status}.`
      );
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
      explanations.push(
        `Scenario ${scenario.id} sets relationship ${relationship.id} to ${change.status}.`
      );
      continue;
    }

    if (change.operation === "add-entity") {
      entities.set(change.entity.id, structuredClone(change.entity));
      changedEntityIds.add(change.entity.id);
      explanations.push(`Scenario ${scenario.id} adds entity ${change.entity.id}.`);
      continue;
    }

    relationships.set(
      change.relationship.id,
      structuredClone(change.relationship)
    );
    changedRelationshipIds.add(change.relationship.id);
    explanations.push(
      `Scenario ${scenario.id} adds relationship ${change.relationship.id}.`
    );
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
    explanations,
  };
}

export interface PropagationOptions {
  relationshipKinds?: string[];
  failOnStatuses?: Array<"degraded" | "failed">;
  maximumPasses?: number;
}

function uniquePush(values: string[], value: string): void {
  if (!values.includes(value)) values.push(value);
}

/**
 * Deterministic propagation with two modes:
 *
 * 1. Explicit requirement groups define whether all, any, or at least N
 *    incoming providers are needed.
 * 2. Entities without an explicit requirement retain the conservative legacy
 *    rule: they fail only when every incoming critical dependency is unavailable.
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
  const explanations: string[] = [];

  const entities = new Map(document.entities.map((entity) => [entity.id, entity]));
  const explicitRequirementTargets = new Set(
    extractDependencyRequirements(document).requirements.map(
      (requirement) => requirement.targetEntityId
    )
  );

  for (let pass = 0; pass < maximumPasses; pass += 1) {
    let changed = false;
    const requirementResult = evaluateDependencyRequirements(document);
    requirementResult.warnings.forEach((warning) => uniquePush(warnings, warning));

    for (const evaluation of requirementResult.evaluations) {
      if (evaluation.satisfied) continue;
      const target = entities.get(evaluation.targetEntityId);
      if (!target || target.status === "failed") continue;

      const nextStatus = evaluation.whenUnsatisfied;
      const shouldChange =
        nextStatus === "failed" ||
        target.status === "normal" ||
        target.status === "new";
      if (!shouldChange || target.status === nextStatus) continue;

      target.status = nextStatus;
      changedEntityIds.add(target.id);
      explanations.push(
        `${evaluation.explanation} Entity ${target.id} becomes ${nextStatus}.`
      );
      changed = true;
    }

    for (const entity of document.entities) {
      if (entity.status === "failed") continue;
      if (explicitRequirementTargets.has(entity.id)) continue;

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
        explanations.push(
          `Entity ${entity.id} fails because all ${incoming.length} incoming critical dependencies are unavailable and no explicit requirement policy is declared.`
        );
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
    explanations,
  };
}

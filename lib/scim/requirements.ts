import { z } from "zod";
import { ScimDocumentSchema, type EntityStatus, type ScimDocument } from "./schema";

export const RequirementPolicySchema = z.enum(["all", "any", "at-least"]);
export type RequirementPolicy = z.infer<typeof RequirementPolicySchema>;

export interface DependencyRequirement {
  id: string;
  targetEntityId: string;
  relationshipIds: string[];
  policy: RequirementPolicy;
  minimumAvailable: number;
  whenUnsatisfied: Extract<EntityStatus, "degraded" | "failed">;
  service?: string;
}

export interface DependencyRequirementEvaluation extends DependencyRequirement {
  availableRelationshipIds: string[];
  unavailableRelationshipIds: string[];
  satisfied: boolean;
  explanation: string;
}

export interface DependencyRequirementResult {
  requirements: DependencyRequirement[];
  warnings: string[];
}

function stringAttribute(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function integerAttribute(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : undefined;
}

/**
 * SCIM 0.2 dependency requirements are declared on relationships so they
 * survive the existing generic-attribute round trip:
 *
 * requirement-group: hospital-power
 * requirement-policy: any | all | at-least
 * minimum-available: 1
 * when-unsatisfied: degraded | failed
 * requirement-service: electricity
 */
export function extractDependencyRequirements(
  input: ScimDocument
): DependencyRequirementResult {
  const document = ScimDocumentSchema.parse(input);
  const grouped = new Map<string, typeof document.relationships>();
  const warnings: string[] = [];

  for (const relationship of document.relationships) {
    const group = stringAttribute(relationship.attributes["requirement-group"]);
    if (!group) continue;
    grouped.set(group, [...(grouped.get(group) ?? []), relationship]);
  }

  const requirements: DependencyRequirement[] = [];

  for (const [id, relationships] of grouped) {
    const targetEntityIds = [...new Set(relationships.map((item) => item.to))];
    if (targetEntityIds.length !== 1) {
      warnings.push(
        `Requirement ${id} points to multiple target entities: ${targetEntityIds.join(", ")}`
      );
      continue;
    }

    const policies = relationships
      .map((item) => stringAttribute(item.attributes["requirement-policy"]))
      .filter((value): value is string => Boolean(value));
    const distinctPolicies = [...new Set(policies)];
    if (distinctPolicies.length > 1) {
      warnings.push(
        `Requirement ${id} has conflicting policies: ${distinctPolicies.join(", ")}`
      );
    }
    const parsedPolicy = RequirementPolicySchema.safeParse(distinctPolicies[0] ?? "all");
    const policy = parsedPolicy.success ? parsedPolicy.data : "all";
    if (!parsedPolicy.success) {
      warnings.push(
        `Requirement ${id} has unknown policy ${distinctPolicies[0]}; using all`
      );
    }

    const minimums = relationships
      .map((item) => integerAttribute(item.attributes["minimum-available"]))
      .filter((value): value is number => value !== undefined);
    const distinctMinimums = [...new Set(minimums)];
    if (distinctMinimums.length > 1) {
      warnings.push(
        `Requirement ${id} has conflicting minimum-available values: ${distinctMinimums.join(", ")}`
      );
    }

    const defaultMinimum =
      policy === "all" ? relationships.length : policy === "any" ? 1 : 1;
    const minimumAvailable = Math.min(
      distinctMinimums[0] ?? defaultMinimum,
      relationships.length
    );
    if (policy === "at-least" && distinctMinimums.length === 0) {
      warnings.push(
        `Requirement ${id} uses at-least without minimum-available; using 1`
      );
    }

    const statuses = relationships
      .map((item) => stringAttribute(item.attributes["when-unsatisfied"]))
      .filter((value): value is string => Boolean(value));
    const distinctStatuses = [...new Set(statuses)];
    if (distinctStatuses.length > 1) {
      warnings.push(
        `Requirement ${id} has conflicting when-unsatisfied values: ${distinctStatuses.join(", ")}`
      );
    }
    const whenUnsatisfied =
      distinctStatuses[0] === "degraded" ? "degraded" : "failed";
    if (
      distinctStatuses[0] &&
      distinctStatuses[0] !== "degraded" &&
      distinctStatuses[0] !== "failed"
    ) {
      warnings.push(
        `Requirement ${id} has invalid when-unsatisfied value ${distinctStatuses[0]}; using failed`
      );
    }

    const services = relationships
      .map((item) => stringAttribute(item.attributes["requirement-service"]))
      .filter((value): value is string => Boolean(value));
    const distinctServices = [...new Set(services)];
    if (distinctServices.length > 1) {
      warnings.push(
        `Requirement ${id} has conflicting service labels: ${distinctServices.join(", ")}`
      );
    }

    requirements.push({
      id,
      targetEntityId: targetEntityIds[0],
      relationshipIds: relationships.map((item) => item.id),
      policy,
      minimumAvailable,
      whenUnsatisfied,
      service: distinctServices[0],
    });
  }

  return { requirements, warnings };
}

export function evaluateDependencyRequirements(
  input: ScimDocument
): { evaluations: DependencyRequirementEvaluation[]; warnings: string[] } {
  const document = ScimDocumentSchema.parse(input);
  const { requirements, warnings } = extractDependencyRequirements(document);
  const entities = new Map(document.entities.map((entity) => [entity.id, entity]));
  const relationships = new Map(
    document.relationships.map((relationship) => [relationship.id, relationship])
  );

  const evaluations = requirements.map((requirement) => {
    const availableRelationshipIds: string[] = [];
    const unavailableRelationshipIds: string[] = [];

    for (const relationshipId of requirement.relationshipIds) {
      const relationship = relationships.get(relationshipId);
      const source = relationship ? entities.get(relationship.from) : undefined;
      const available = Boolean(
        relationship &&
          relationship.status !== "failed" &&
          source &&
          source.status !== "failed"
      );
      (available ? availableRelationshipIds : unavailableRelationshipIds).push(
        relationshipId
      );
    }

    const satisfied = availableRelationshipIds.length >= requirement.minimumAvailable;
    const service = requirement.service ? ` ${requirement.service}` : "";
    const explanation = satisfied
      ? `${requirement.targetEntityId}${service} requirement ${requirement.id} is satisfied: ${availableRelationshipIds.length}/${requirement.relationshipIds.length} providers available; minimum ${requirement.minimumAvailable}.`
      : `${requirement.targetEntityId}${service} requirement ${requirement.id} is unsatisfied: ${availableRelationshipIds.length}/${requirement.relationshipIds.length} providers available; minimum ${requirement.minimumAvailable}.`;

    return {
      ...requirement,
      availableRelationshipIds,
      unavailableRelationshipIds,
      satisfied,
      explanation,
    };
  });

  return { evaluations, warnings };
}

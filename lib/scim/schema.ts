import { z } from "zod";

export const STANDARD_SCIM_LAYERS = [
  "individual",
  "household",
  "neighbourhood",
  "municipality",
  "region",
  "country",
  "world",
] as const;

export const STANDARD_SCIM_THREATS = [
  "injury",
  "illness",
  "thirst",
  "hunger",
  "too-cold",
  "too-hot",
] as const;

const ExtensibleIdentifierSchema = z
  .string()
  .min(1)
  .regex(
    /^[a-z0-9][a-z0-9-]*$/,
    "Identifiers must use lowercase letters, numbers and hyphens"
  );

// These are controlled vocabularies, but SCIM deliberately permits extensions.
export const ScimLayerSchema = ExtensibleIdentifierSchema;
export const ScimThreatSchema = ExtensibleIdentifierSchema;

export const EntityStatusSchema = z.enum([
  "normal",
  "degraded",
  "failed",
  "new",
]);

export const DeliveryModeSchema = z.enum([
  "on-site",
  "grid",
  "delivery",
  "fetch",
  "other",
]);

export const EvidenceSchema = z.object({
  source: z.string().min(1),
  note: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  observedAt: z.string().datetime().optional(),
});

export const ScimEntitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  kind: ExtensibleIdentifierSchema,
  layer: ScimLayerSchema,
  status: EntityStatusSchema.default("normal"),
  protectsAgainst: z.array(ScimThreatSchema).default([]),
  attributes: z.record(z.string(), z.unknown()).default({}),
  evidence: z.array(EvidenceSchema).default([]),
});

export const ScimRelationshipSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  kind: ExtensibleIdentifierSchema.default("depends-on"),
  deliveryMode: DeliveryModeSchema.optional(),
  status: EntityStatusSchema.default("normal"),
  critical: z.boolean().default(false),
  attributes: z.record(z.string(), z.unknown()).default({}),
  evidence: z.array(EvidenceSchema).default([]),
});

export const ScenarioChangeSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("set-entity-status"),
    entityId: z.string().min(1),
    status: EntityStatusSchema,
  }),
  z.object({
    operation: z.literal("set-relationship-status"),
    relationshipId: z.string().min(1),
    status: EntityStatusSchema,
  }),
  z.object({
    operation: z.literal("add-entity"),
    entity: ScimEntitySchema,
  }),
  z.object({
    operation: z.literal("add-relationship"),
    relationship: ScimRelationshipSchema,
  }),
]);

export const ScimScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  changes: z.array(ScenarioChangeSchema).default([]),
  createdAt: z.string().datetime().optional(),
  modifiedAt: z.string().datetime().optional(),
});

function addDuplicateIssues(
  values: Array<{ id: string }>,
  path: string,
  context: z.RefinementCtx
) {
  const seen = new Set<string>();

  values.forEach((value, index) => {
    if (seen.has(value.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [path, index, "id"],
        message: `Duplicate ID: ${value.id}`,
      });
    }
    seen.add(value.id);
  });
}

export const ScimDocumentSchema = z
  .object({
    schemaVersion: z.literal("0.1"),
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().default(""),
    entities: z.array(ScimEntitySchema).default([]),
    relationships: z.array(ScimRelationshipSchema).default([]),
    scenarios: z.array(ScimScenarioSchema).default([]),
  })
  .superRefine((document, context) => {
    addDuplicateIssues(document.entities, "entities", context);
    addDuplicateIssues(document.relationships, "relationships", context);
    addDuplicateIssues(document.scenarios, "scenarios", context);

    const entityIds = new Set(document.entities.map((entity) => entity.id));
    const relationshipIds = new Set(
      document.relationships.map((relationship) => relationship.id)
    );

    document.relationships.forEach((relationship, index) => {
      if (!entityIds.has(relationship.from)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["relationships", index, "from"],
          message: `Unknown source entity: ${relationship.from}`,
        });
      }

      if (!entityIds.has(relationship.to)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["relationships", index, "to"],
          message: `Unknown target entity: ${relationship.to}`,
        });
      }
    });

    document.scenarios.forEach((scenario, scenarioIndex) => {
      const scenarioEntityIds = new Set(entityIds);
      const scenarioRelationshipIds = new Set(relationshipIds);

      scenario.changes.forEach((change, changeIndex) => {
        const path = ["scenarios", scenarioIndex, "changes", changeIndex];

        if (change.operation === "add-entity") {
          if (scenarioEntityIds.has(change.entity.id)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: [...path, "entity", "id"],
              message: `Entity already exists: ${change.entity.id}`,
            });
          }
          scenarioEntityIds.add(change.entity.id);
          return;
        }

        if (change.operation === "set-entity-status") {
          if (!scenarioEntityIds.has(change.entityId)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: [...path, "entityId"],
              message: `Unknown scenario entity: ${change.entityId}`,
            });
          }
          return;
        }

        if (change.operation === "add-relationship") {
          const relationship = change.relationship;
          if (scenarioRelationshipIds.has(relationship.id)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: [...path, "relationship", "id"],
              message: `Relationship already exists: ${relationship.id}`,
            });
          }
          if (!scenarioEntityIds.has(relationship.from)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: [...path, "relationship", "from"],
              message: `Unknown scenario source entity: ${relationship.from}`,
            });
          }
          if (!scenarioEntityIds.has(relationship.to)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: [...path, "relationship", "to"],
              message: `Unknown scenario target entity: ${relationship.to}`,
            });
          }
          scenarioRelationshipIds.add(relationship.id);
          return;
        }

        if (!scenarioRelationshipIds.has(change.relationshipId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, "relationshipId"],
            message: `Unknown scenario relationship: ${change.relationshipId}`,
          });
        }
      });
    });
  });

export type ScimLayer = z.infer<typeof ScimLayerSchema>;
export type ScimThreat = z.infer<typeof ScimThreatSchema>;
export type EntityStatus = z.infer<typeof EntityStatusSchema>;
export type DeliveryMode = z.infer<typeof DeliveryModeSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type ScimEntity = z.infer<typeof ScimEntitySchema>;
export type ScimRelationship = z.infer<typeof ScimRelationshipSchema>;
export type ScenarioChange = z.infer<typeof ScenarioChangeSchema>;
export type ScimScenario = z.infer<typeof ScimScenarioSchema>;
export type ScimDocument = z.infer<typeof ScimDocumentSchema>;

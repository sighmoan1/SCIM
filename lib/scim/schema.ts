import { z } from "zod";

export const ScimLayerSchema = z.enum([
  "individual",
  "household",
  "neighbourhood",
  "municipality",
  "region",
  "country",
  "world",
]);

export const ScimThreatSchema = z.enum([
  "injury",
  "illness",
  "thirst",
  "hunger",
  "too-cold",
  "too-hot",
]);

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
  kind: z.string().min(1),
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
  kind: z.string().min(1).default("depends-on"),
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
});

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
    const entityIds = new Set(document.entities.map((entity) => entity.id));

    for (const relationship of document.relationships) {
      if (!entityIds.has(relationship.from)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["relationships", relationship.id, "from"],
          message: `Unknown source entity: ${relationship.from}`,
        });
      }

      if (!entityIds.has(relationship.to)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["relationships", relationship.id, "to"],
          message: `Unknown target entity: ${relationship.to}`,
        });
      }
    }
  });

export type ScimLayer = z.infer<typeof ScimLayerSchema>;
export type ScimThreat = z.infer<typeof ScimThreatSchema>;
export type ScimEntity = z.infer<typeof ScimEntitySchema>;
export type ScimRelationship = z.infer<typeof ScimRelationshipSchema>;
export type ScimScenario = z.infer<typeof ScimScenarioSchema>;
export type ScimDocument = z.infer<typeof ScimDocumentSchema>;

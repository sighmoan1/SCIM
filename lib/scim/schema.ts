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

export const STANDARD_SCIM_NEEDS = [
  ...STANDARD_SCIM_THREATS,
  "communications",
  "transport",
  "space",
  "resource-control",
  "shared-map",
  "shared-plan",
  "shared-succession",
  "jurisdiction",
  "citizens",
  "territory",
  "effective-organisations",
  "international-recognition",
] as const;

export const STANDARD_SCIM_FAILURE_MODES = [
  "neglect",
  "time-and-wear",
  "operators",
  "system-externalities",
  "economics",
  "violence-or-disaster",
] as const;

export const STANDARD_SCIM_SERVICE_EFFECTS = [
  "provision",
  "cost",
  "quality",
] as const;

export const ExtensibleIdentifierSchema = z
  .string()
  .min(1)
  .regex(
    /^[a-z0-9][a-z0-9-]*$/,
    "Identifiers must use lowercase letters, numbers and hyphens"
  );

// These are controlled vocabularies, but SCIM deliberately permits extensions.
export const ScimLayerSchema = ExtensibleIdentifierSchema;
export const ScimThreatSchema = ExtensibleIdentifierSchema;
export const ScimNeedSchema = ExtensibleIdentifierSchema;
export const FailureModeSchema = ExtensibleIdentifierSchema;
export const ServiceEffectSchema = ExtensibleIdentifierSchema;

export const ScimPerspectiveSchema = z.enum([
  "individual",
  "group",
  "organisation",
  "nation-state",
  "integrated",
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
  description: z.string().default(""),
  kind: ExtensibleIdentifierSchema,
  layer: ScimLayerSchema,
  status: EntityStatusSchema.default("normal"),
  supportsNeeds: z.array(ScimNeedSchema).default([]),
  // Deprecated compatibility alias used by the first prototype schema.
  protectsAgainst: z.array(ScimThreatSchema).default([]),
  failureModes: z.array(FailureModeSchema).default([]),
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
  serviceEffects: z.array(ServiceEffectSchema).default([]),
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

export const ScimPointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

export const ScimCanvasSchema = z.object({
  width: z.number().positive().max(10000),
  height: z.number().positive().max(10000),
});

export const ScimRingSchema = z.object({
  layer: ScimLayerSchema,
  radius: z.number().positive(),
  labelAngle: z.number().finite().default(-90),
});

export const ScimSectorSchema = z.object({
  need: ScimNeedSchema,
  angle: z.number().min(0).lt(360),
});

export const ScimNodePlacementSchema = z.object({
  entityId: z.string().min(1),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive().default(100),
  height: z.number().positive().default(36),
});

export const ScimRelationshipRouteSchema = z.object({
  relationshipId: z.string().min(1),
  points: z.array(ScimPointSchema).min(2),
});

export const ScimRadialViewSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.literal("radial"),
  renderer: z.literal("scim-radial-1"),
  layout: z.enum(["automatic", "frozen"]).default("automatic"),
  canvas: ScimCanvasSchema.default({ width: 1000, height: 1000 }),
  centre: ScimPointSchema.default({ x: 500, y: 500 }),
  showSegments: z.boolean().default(true),
  rings: z.array(ScimRingSchema).default([]),
  sectors: z.array(ScimSectorSchema).default([]),
  nodes: z.array(ScimNodePlacementSchema).default([]),
  routes: z.array(ScimRelationshipRouteSchema).default([]),
});

export const ScimInamCellSchema = z.object({
  rowNeed: ScimNeedSchema,
  column: ExtensibleIdentifierSchema,
  entityIds: z.array(z.string().min(1)).default([]),
  note: z.string().optional(),
});

export const ScimInamViewSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.literal("inam"),
  renderer: z.literal("scim-inam-1"),
  rowNeeds: z.array(ScimNeedSchema).min(1),
  columns: z.array(ExtensibleIdentifierSchema).min(1),
  cells: z.array(ScimInamCellSchema).default([]),
});

export const ScimViewSchema = z.discriminatedUnion("type", [
  ScimRadialViewSchema,
  ScimInamViewSchema,
]);

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

function addDuplicateStringIssues(
  values: string[],
  path: Array<string | number>,
  context: z.RefinementCtx
) {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...path, index],
        message: `Duplicate value: ${value}`,
      });
    }
    seen.add(value);
  });
}

export const ScimDocumentSchema = z
  .object({
    schemaVersion: z.literal("0.2"),
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().default(""),
    perspective: ScimPerspectiveSchema.default("individual"),
    focusEntityId: z.string().min(1).optional(),
    entities: z.array(ScimEntitySchema).default([]),
    relationships: z.array(ScimRelationshipSchema).default([]),
    scenarios: z.array(ScimScenarioSchema).default([]),
    views: z.array(ScimViewSchema).default([]),
  })
  .superRefine((document, context) => {
    addDuplicateIssues(document.entities, "entities", context);
    addDuplicateIssues(document.relationships, "relationships", context);
    addDuplicateIssues(document.scenarios, "scenarios", context);
    addDuplicateIssues(document.views, "views", context);

    const entityIds = new Set(document.entities.map((entity) => entity.id));
    const relationshipIds = new Set(
      document.relationships.map((relationship) => relationship.id)
    );

    if (document.focusEntityId && !entityIds.has(document.focusEntityId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["focusEntityId"],
        message: `Unknown focus entity: ${document.focusEntityId}`,
      });
    }

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

    document.views.forEach((view, viewIndex) => {
      if (view.type === "radial") {
        addDuplicateStringIssues(
          view.nodes.map((node) => node.entityId),
          ["views", viewIndex, "nodes"],
          context
        );
        addDuplicateStringIssues(
          view.routes.map((route) => route.relationshipId),
          ["views", viewIndex, "routes"],
          context
        );
        addDuplicateStringIssues(
          view.rings.map((ring) => ring.layer),
          ["views", viewIndex, "rings"],
          context
        );
        addDuplicateStringIssues(
          view.sectors.map((sector) => sector.need),
          ["views", viewIndex, "sectors"],
          context
        );

        view.nodes.forEach((node, nodeIndex) => {
          if (!entityIds.has(node.entityId)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["views", viewIndex, "nodes", nodeIndex, "entityId"],
              message: `Unknown view entity: ${node.entityId}`,
            });
          }
        });

        view.routes.forEach((route, routeIndex) => {
          if (!relationshipIds.has(route.relationshipId)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: [
                "views",
                viewIndex,
                "routes",
                routeIndex,
                "relationshipId",
              ],
              message: `Unknown view relationship: ${route.relationshipId}`,
            });
          }
        });
        return;
      }

      addDuplicateStringIssues(
        view.rowNeeds,
        ["views", viewIndex, "rowNeeds"],
        context
      );
      addDuplicateStringIssues(
        view.columns,
        ["views", viewIndex, "columns"],
        context
      );

      const rowNeeds = new Set(view.rowNeeds);
      const columns = new Set(view.columns);
      view.cells.forEach((cell, cellIndex) => {
        if (!rowNeeds.has(cell.rowNeed)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["views", viewIndex, "cells", cellIndex, "rowNeed"],
            message: `Unknown INAM row: ${cell.rowNeed}`,
          });
        }
        if (!columns.has(cell.column)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["views", viewIndex, "cells", cellIndex, "column"],
            message: `Unknown INAM column: ${cell.column}`,
          });
        }
        cell.entityIds.forEach((entityId, entityIndex) => {
          if (!entityIds.has(entityId)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: [
                "views",
                viewIndex,
                "cells",
                cellIndex,
                "entityIds",
                entityIndex,
              ],
              message: `Unknown INAM entity: ${entityId}`,
            });
          }
        });
      });
    });
  });

export type ScimLayer = z.infer<typeof ScimLayerSchema>;
export type ScimThreat = z.infer<typeof ScimThreatSchema>;
export type ScimNeed = z.infer<typeof ScimNeedSchema>;
export type FailureMode = z.infer<typeof FailureModeSchema>;
export type ServiceEffect = z.infer<typeof ServiceEffectSchema>;
export type ScimPerspective = z.infer<typeof ScimPerspectiveSchema>;
export type EntityStatus = z.infer<typeof EntityStatusSchema>;
export type DeliveryMode = z.infer<typeof DeliveryModeSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type ScimEntity = z.infer<typeof ScimEntitySchema>;
export type ScimRelationship = z.infer<typeof ScimRelationshipSchema>;
export type ScenarioChange = z.infer<typeof ScenarioChangeSchema>;
export type ScimScenario = z.infer<typeof ScimScenarioSchema>;
export type ScimPoint = z.infer<typeof ScimPointSchema>;
export type ScimRadialView = z.infer<typeof ScimRadialViewSchema>;
export type ScimInamView = z.infer<typeof ScimInamViewSchema>;
export type ScimView = z.infer<typeof ScimViewSchema>;
export type ScimDocument = z.infer<typeof ScimDocumentSchema>;

import { ScimDocumentSchema, type ScimDocument } from "./schema";

export interface LegacyLayer {
  id: string;
  name: string;
  radius: number;
  color: string;
  opacity: number;
}

export interface LegacyThreat {
  id: string;
  name: string;
  angle: number;
  impactRadius: number;
}

export interface LegacyElement {
  id: string;
  name: string;
  x: number;
  y: number;
  layer: number;
  width?: number;
  height?: number;
  infrastructureProblems?: string[];
  otherInfrastructureProblem?: string;
}

export interface LegacyConnection {
  id: string;
  from: string;
  to: string;
  connectorType?: "Produce on site" | "Grid" | "Delivery" | "Fetch" | "Other";
  strength?: number;
  notes?: string;
  impactEffects?: string[];
  otherImpactEffect?: string;
}

export interface LegacyImpactZone {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  threatId?: string;
  zIndex?: number;
  criticality?: "Low" | "Medium" | "High";
  description?: string;
}

export interface LegacyInfrastructureMap {
  version: string;
  coordinateSystem: {
    type: "cartesian";
    origin: "center";
    units: "pixels";
    centerX: number;
    centerY: number;
  };
  defaults: {
    distanceUnits: "px";
    angleUnits: "deg";
  };
  layers: Record<string, LegacyLayer> | LegacyLayer[];
  threats: LegacyThreat[];
  elements: LegacyElement[];
  connections: LegacyConnection[];
  impactZones: LegacyImpactZone[];
  metadata: {
    exportedAt: string;
    exportedBy: string;
  };
}

export interface ScimLayout {
  coordinateSystem: LegacyInfrastructureMap["coordinateSystem"];
  layers: LegacyLayer[];
  threats: LegacyThreat[];
  elements: Record<string, Pick<LegacyElement, "x" | "y" | "width" | "height">>;
  impactZones: LegacyImpactZone[];
}

export interface AdaptedLegacyMap {
  document: ScimDocument;
  layout: ScimLayout;
}

const layerAliases: Record<string, string> = {
  person: "individual",
  individual: "individual",
  home: "household",
  household: "household",
  village: "neighbourhood",
  neighborhood: "neighbourhood",
  neighbourhood: "neighbourhood",
  town: "municipality",
  city: "municipality",
  municipality: "municipality",
  region: "region",
  country: "country",
  international: "world",
  world: "world",
};

const threatAliases: Record<string, string> = {
  injury: "injury",
  illness: "illness",
  thirst: "thirst",
  hunger: "hunger",
  "too cold": "too-cold",
  "too-cold": "too-cold",
  "too hot": "too-hot",
  "too-hot": "too-hot",
};

const failureModeAliases: Record<string, string> = {
  Neglect: "neglect",
  "Time and wear": "time-and-wear",
  Operators: "operators",
  "System Externalities": "system-externalities",
  Economics: "economics",
  "Violence / Disaster": "violence-or-disaster",
};

const serviceEffectAliases: Record<string, string> = {
  "Service Unavailable": "provision",
  "Service Cost Spike": "cost",
  "Service Quality Drop": "quality",
};

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown"
  );
}

function normaliseLayer(value: string): string {
  return layerAliases[value.trim().toLowerCase()] ?? slugify(value);
}

function normaliseThreat(value: string): string {
  return threatAliases[value.trim().toLowerCase()] ?? slugify(value);
}

function deliveryMode(value: LegacyConnection["connectorType"]) {
  switch (value) {
    case "Produce on site":
      return "on-site" as const;
    case "Grid":
      return "grid" as const;
    case "Delivery":
      return "delivery" as const;
    case "Fetch":
      return "fetch" as const;
    case "Other":
      return "other" as const;
    default:
      return undefined;
  }
}

export function legacyMapToScim(
  legacy: LegacyInfrastructureMap,
  options: { id?: string; title?: string; description?: string } = {}
): AdaptedLegacyMap {
  const layers = Array.isArray(legacy.layers)
    ? legacy.layers
    : Object.values(legacy.layers);

  const sortedLayers = [...layers].sort((a, b) => a.radius - b.radius);
  const layerByLegacyIndex = new Map<number, string>();
  sortedLayers.forEach((layer, index) => {
    layerByLegacyIndex.set(index, normaliseLayer(layer.name));
    layerByLegacyIndex.set(index + 1, normaliseLayer(layer.name));
  });

  const entities = legacy.elements.map((element) => {
    const failureModes = (element.infrastructureProblems ?? [])
      .map((problem) => failureModeAliases[problem])
      .filter((value): value is string => Boolean(value));
    const unrecognisedProblems = (element.infrastructureProblems ?? []).filter(
      (problem) => !failureModeAliases[problem]
    );

    return {
      id: element.id,
      name: element.name,
      description: "",
      kind: slugify(element.name),
      layer: layerByLegacyIndex.get(element.layer) ?? "individual",
      status: "normal" as const,
      supportsNeeds: [] as string[],
      protectsAgainst: [] as string[],
      failureModes,
      attributes: {
        legacyInfrastructureProblems: unrecognisedProblems,
        legacyOtherInfrastructureProblem: element.otherInfrastructureProblem,
      },
      evidence: [],
    };
  });

  const relationships = legacy.connections.map((connection) => ({
    id: connection.id,
    from: connection.from,
    to: connection.to,
    kind: "depends-on",
    deliveryMode: deliveryMode(connection.connectorType),
    status: "normal" as const,
    critical: false,
    serviceEffects: (connection.impactEffects ?? [])
      .map((effect) => serviceEffectAliases[effect])
      .filter((value): value is string => Boolean(value)),
    attributes: {
      strength: connection.strength,
      notes: connection.notes,
      legacyImpactEffects: (connection.impactEffects ?? []).filter(
        (effect) => !serviceEffectAliases[effect]
      ),
      otherImpactEffect: connection.otherImpactEffect,
    },
    evidence: [],
  }));

  const width = Math.max(1, legacy.coordinateSystem.centerX * 2);
  const height = Math.max(1, legacy.coordinateSystem.centerY * 2);
  const document = ScimDocumentSchema.parse({
    schemaVersion: "0.2",
    id: options.id ?? "imported-infrastructure-map",
    title: options.title ?? "Imported infrastructure map",
    description:
      options.description ??
      `Imported from legacy mapper export ${legacy.version}.`,
    perspective: "individual",
    entities,
    relationships,
    scenarios: [],
    views: [
      {
        id: "legacy-radial",
        name: "Imported radial SCIM",
        type: "radial",
        renderer: "scim-radial-1",
        layout: "frozen",
        canvas: { width, height },
        centre: {
          x: legacy.coordinateSystem.centerX,
          y: legacy.coordinateSystem.centerY,
        },
        showSegments: true,
        rings: sortedLayers.map((layer) => ({
          layer: normaliseLayer(layer.name),
          radius: layer.radius,
          labelAngle: -90,
        })),
        sectors: legacy.threats.map((threat) => ({
          need: normaliseThreat(threat.name),
          angle: ((threat.angle % 360) + 360) % 360,
        })),
        nodes: legacy.elements.map((element) => ({
          entityId: element.id,
          x: element.x,
          y: element.y,
          width: element.width ?? 80,
          height: element.height ?? 30,
        })),
        routes: [],
      },
    ],
  });

  return {
    document,
    layout: {
      coordinateSystem: legacy.coordinateSystem,
      layers: sortedLayers,
      threats: legacy.threats.map((threat) => ({
        ...threat,
        name: normaliseThreat(threat.name),
      })),
      elements: Object.fromEntries(
        legacy.elements.map((element) => [
          element.id,
          {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
          },
        ])
      ),
      impactZones: legacy.impactZones,
    },
  };
}

export function scimToLegacyMap(
  document: ScimDocument,
  layout: ScimLayout,
  exportedAt = new Date().toISOString()
): LegacyInfrastructureMap {
  const parsed = ScimDocumentSchema.parse(document);
  const layerIndex = new Map(
    layout.layers.map((layer, index) => [normaliseLayer(layer.name), index + 1])
  );

  return {
    version: "2025-01-01",
    coordinateSystem: layout.coordinateSystem,
    defaults: { distanceUnits: "px", angleUnits: "deg" },
    layers: Object.fromEntries(layout.layers.map((layer) => [layer.name, layer])),
    threats: layout.threats,
    elements: parsed.entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      layer: layerIndex.get(entity.layer) ?? 1,
      x: layout.elements[entity.id]?.x ?? layout.coordinateSystem.centerX,
      y: layout.elements[entity.id]?.y ?? layout.coordinateSystem.centerY,
      width: layout.elements[entity.id]?.width,
      height: layout.elements[entity.id]?.height,
      infrastructureProblems: [
        ...entity.failureModes.map(
          (mode) =>
            Object.entries(failureModeAliases).find(([, value]) => value === mode)?.[0] ??
            mode
        ),
        ...(Array.isArray(entity.attributes.legacyInfrastructureProblems)
          ? (entity.attributes.legacyInfrastructureProblems as string[])
          : []),
      ],
      otherInfrastructureProblem:
        typeof entity.attributes.legacyOtherInfrastructureProblem === "string"
          ? entity.attributes.legacyOtherInfrastructureProblem
          : undefined,
    })),
    connections: parsed.relationships.map((relationship) => ({
      id: relationship.id,
      from: relationship.from,
      to: relationship.to,
      connectorType:
        relationship.deliveryMode === "on-site"
          ? "Produce on site"
          : relationship.deliveryMode === "grid"
            ? "Grid"
            : relationship.deliveryMode === "delivery"
              ? "Delivery"
              : relationship.deliveryMode === "fetch"
                ? "Fetch"
                : relationship.deliveryMode === "other"
                  ? "Other"
                  : undefined,
      strength:
        typeof relationship.attributes.strength === "number"
          ? relationship.attributes.strength
          : undefined,
      notes:
        typeof relationship.attributes.notes === "string"
          ? relationship.attributes.notes
          : undefined,
      impactEffects: [
        ...relationship.serviceEffects.map(
          (effect) =>
            Object.entries(serviceEffectAliases).find(([, value]) => value === effect)?.[0] ??
            effect
        ),
        ...(Array.isArray(relationship.attributes.legacyImpactEffects)
          ? (relationship.attributes.legacyImpactEffects as string[])
          : []),
      ],
      otherImpactEffect:
        typeof relationship.attributes.otherImpactEffect === "string"
          ? relationship.attributes.otherImpactEffect
          : undefined,
    })),
    impactZones: layout.impactZones,
    metadata: {
      exportedAt,
      exportedBy: "SCIM Infrastructure Mapper",
    },
  };
}

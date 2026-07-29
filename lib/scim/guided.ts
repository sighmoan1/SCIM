import {
  ScimDocumentSchema,
  type ScimDocument,
  type ScimEntity,
  type ScimRadialView,
} from "./schema";

/**
 * Guided model building: plain-language suggestions for what commonly protects
 * each of the six needs, plus deterministic automatic placement of new
 * entities into the frozen radial view (correct ring for the layer, correct
 * sector for the need).
 *
 * Placement writes view geometry only; the infrastructure meaning lives in the
 * entity's layer, supported needs and relationships.
 */

export interface ProtectionSuggestion {
  name: string;
  kind: string;
  layer: string;
  /** Optional single upstream system this protector critically depends on. */
  dependsOn?: {
    name: string;
    kind: string;
    layer: string;
  };
}

export const PROTECTION_SUGGESTIONS: Record<string, ProtectionSuggestion[]> = {
  "too-hot": [
    {
      name: "Home cooling",
      kind: "shelter",
      layer: "household",
      dependsOn: { name: "Electricity grid", kind: "power", layer: "region" },
    },
    { name: "Shade and ventilation", kind: "shelter", layer: "household" },
    {
      name: "Cool public building",
      kind: "shelter",
      layer: "municipality",
      dependsOn: { name: "Electricity grid", kind: "power", layer: "region" },
    },
  ],
  "too-cold": [
    {
      name: "Home heating",
      kind: "shelter",
      layer: "household",
      dependsOn: { name: "Gas supply", kind: "fuel", layer: "region" },
    },
    { name: "Warm clothes and blankets", kind: "shelter", layer: "household" },
    { name: "Neighbour with heating", kind: "shelter", layer: "neighbourhood" },
  ],
  hunger: [
    {
      name: "Local food shops",
      kind: "food",
      layer: "municipality",
      dependsOn: { name: "Food distribution", kind: "transport", layer: "region" },
    },
    { name: "Home food stores", kind: "food", layer: "household" },
    { name: "Community food support", kind: "food", layer: "neighbourhood" },
  ],
  thirst: [
    {
      name: "Tap water",
      kind: "water",
      layer: "household",
      dependsOn: { name: "Water treatment works", kind: "water", layer: "region" },
    },
    { name: "Stored drinking water", kind: "water", layer: "household" },
    { name: "Nearby water source", kind: "water", layer: "neighbourhood" },
  ],
  illness: [
    {
      name: "GP or clinic",
      kind: "healthcare",
      layer: "municipality",
      dependsOn: { name: "Electricity grid", kind: "power", layer: "region" },
    },
    { name: "Pharmacy", kind: "healthcare", layer: "municipality" },
    { name: "Home medicine cabinet", kind: "healthcare", layer: "household" },
  ],
  injury: [
    {
      name: "Hospital emergency department",
      kind: "healthcare",
      layer: "municipality",
      dependsOn: { name: "Electricity grid", kind: "power", layer: "region" },
    },
    { name: "Ambulance service", kind: "healthcare", layer: "region" },
    { name: "First aid kit", kind: "healthcare", layer: "household" },
  ],
};

export function slugifyName(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "entity"
  );
}

export function uniqueEntityId(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

interface SectorBand {
  need: string;
  startAngle: number;
  endAngle: number;
}

function sectorBands(view: ScimRadialView): SectorBand[] {
  const sorted = [...view.sectors].sort((a, b) => a.angle - b.angle);
  return sorted.map((sector, index) => {
    const next = sorted[(index + 1) % sorted.length];
    const endAngle =
      next.angle <= sector.angle ? next.angle + 360 : next.angle;
    return { need: sector.need, startAngle: sector.angle, endAngle };
  });
}

function ringRadiusForLayer(view: ScimRadialView, layer: string): number {
  const sorted = [...view.rings].sort((a, b) => a.radius - b.radius);
  const ring = sorted.find((candidate) => candidate.layer === layer);
  if (ring) {
    const index = sorted.indexOf(ring);
    const inner = index > 0 ? sorted[index - 1].radius : 0;
    // Middle of the annulus band so nodes sit inside their layer's ring.
    return (inner + ring.radius) / 2;
  }
  const outermost = sorted.at(-1);
  return outermost ? outermost.radius + 40 : 120;
}

/**
 * Deterministic position for a new entity: the middle of its layer ring, in
 * the middle of the sector for the need it protects, nudged by how many nodes
 * already share that band so additions do not stack exactly on top of each
 * other.
 */
export function placementFor(
  view: ScimRadialView,
  layer: string,
  needId: string | undefined
): { x: number; y: number } {
  const radius = ringRadiusForLayer(view, layer);
  const bands = sectorBands(view);
  const band = needId
    ? bands.find((candidate) => candidate.need === needId)
    : undefined;
  const midAngle = band
    ? (band.startAngle + band.endAngle) / 2
    : 315; /* upper-right gap by default */

  const crowd = view.nodes.filter((node) => {
    const distance = Math.hypot(node.x - view.centre.x, node.y - view.centre.y);
    return Math.abs(distance - radius) < 34;
  }).length;
  const angleOffsets = [0, 18, -18, 36, -36];
  const angle = midAngle + angleOffsets[crowd % angleOffsets.length];

  const radians = (angle * Math.PI) / 180;
  return {
    x: Math.round(view.centre.x + Math.cos(radians) * radius),
    y: Math.round(view.centre.y + Math.sin(radians) * radius),
  };
}

function firstRadialView(document: ScimDocument): ScimRadialView | undefined {
  return document.views.find(
    (view): view is ScimRadialView => view.type === "radial"
  );
}

function withPlacedEntity(
  document: ScimDocument,
  entity: ScimEntity,
  needId: string | undefined,
  size: { width: number; height: number } = { width: 124, height: 40 }
): ScimDocument {
  const view = firstRadialView(document);
  const next: ScimDocument = {
    ...document,
    entities: [...document.entities, entity],
  };
  if (!view) return next;
  const position = placementFor(view, entity.layer, needId);
  return {
    ...next,
    views: next.views.map((candidate) =>
      candidate.id === view.id && candidate.type === "radial"
        ? {
            ...candidate,
            nodes: [
              ...candidate.nodes,
              { entityId: entity.id, ...position, ...size },
            ],
          }
        : candidate
    ),
  };
}

function makeEntity(
  id: string,
  name: string,
  kind: string,
  layer: string,
  supportsNeeds: string[]
): ScimEntity {
  return {
    id,
    name,
    description: "",
    kind,
    layer,
    status: "normal",
    supportsNeeds,
    protectsAgainst: [],
    failureModes: [],
    attributes: {},
    evidence: [],
  };
}

export interface AddProtectionInput {
  needId: string;
  name: string;
  kind: string;
  layer: string;
  dependsOn?: { name: string; kind: string; layer: string };
}

export interface AddProtectionResult {
  document: ScimDocument;
  addedEntityNames: string[];
}

/**
 * Ensure the document has a person at its focus. Fresh or imported models may
 * describe systems without declaring who they protect.
 */
function ensureFocusPerson(document: ScimDocument): {
  document: ScimDocument;
  personId: string;
} {
  const focus = document.focusEntityId
    ? document.entities.find((entity) => entity.id === document.focusEntityId)
    : undefined;
  if (focus) return { document, personId: focus.id };

  const anyPerson = document.entities.find((entity) => entity.kind === "person");
  if (anyPerson) {
    return {
      document: { ...document, focusEntityId: anyPerson.id },
      personId: anyPerson.id,
    };
  }

  const ids = new Set(document.entities.map((entity) => entity.id));
  const personId = uniqueEntityId("you", ids);
  const person = makeEntity(personId, "You", "person", "individual", []);
  const view = firstRadialView(document);
  let next = withPlacedEntity(document, person, undefined, {
    width: 100,
    height: 36,
  });
  if (view) {
    // A person sits at the centre of their own map.
    next = {
      ...next,
      views: next.views.map((candidate) =>
        candidate.id === view.id && candidate.type === "radial"
          ? {
              ...candidate,
              nodes: candidate.nodes.map((node) =>
                node.entityId === personId
                  ? { ...node, x: view.centre.x, y: view.centre.y }
                  : node
              ),
            }
          : candidate
      ),
    };
  }
  return { document: { ...next, focusEntityId: personId }, personId };
}

/**
 * Add one protector for a need (and optionally the system it depends on) as a
 * complete, validated canonical change: entities, protects/supplies
 * relationships and deterministic view placement.
 */
export function addProtection(
  input: ScimDocument,
  request: AddProtectionInput
): AddProtectionResult {
  const base = ensureFocusPerson(ScimDocumentSchema.parse(input));
  let document = base.document;
  const addedEntityNames: string[] = [];

  const entityIds = () => new Set(document.entities.map((entity) => entity.id));
  const relationshipIds = new Set(
    document.relationships.map((relationship) => relationship.id)
  );

  const findByName = (name: string) =>
    document.entities.find(
      (entity) => entity.name.toLowerCase() === name.trim().toLowerCase()
    );

  // Protector entity (reused when a same-named entity already exists).
  let protector = findByName(request.name);
  if (!protector) {
    const id = uniqueEntityId(slugifyName(request.name), entityIds());
    protector = makeEntity(
      id,
      request.name.trim(),
      slugifyName(request.kind),
      slugifyName(request.layer),
      [request.needId]
    );
    document = withPlacedEntity(document, protector, request.needId);
    addedEntityNames.push(protector.name);
  } else if (!protector.supportsNeeds.includes(request.needId)) {
    document = {
      ...document,
      entities: document.entities.map((entity) =>
        entity.id === protector!.id
          ? { ...entity, supportsNeeds: [...entity.supportsNeeds, request.needId] }
          : entity
      ),
    };
  }

  const addRelationship = (from: string, to: string, kind: string) => {
    const exists = document.relationships.some(
      (relationship) => relationship.from === from && relationship.to === to
    );
    if (exists) return;
    const id = uniqueEntityId(`${from}-${to}`, relationshipIds);
    relationshipIds.add(id);
    document = {
      ...document,
      relationships: [
        ...document.relationships,
        {
          id,
          from,
          to,
          kind,
          status: "normal",
          critical: true,
          serviceEffects: [],
          attributes: {},
          evidence: [],
        },
      ],
    };
  };

  addRelationship(protector.id, base.personId, "protects");

  if (request.dependsOn) {
    let supplier = findByName(request.dependsOn.name);
    if (!supplier) {
      const id = uniqueEntityId(
        slugifyName(request.dependsOn.name),
        entityIds()
      );
      supplier = makeEntity(
        id,
        request.dependsOn.name.trim(),
        slugifyName(request.dependsOn.kind),
        slugifyName(request.dependsOn.layer),
        []
      );
      document = withPlacedEntity(document, supplier, request.needId);
      addedEntityNames.push(supplier.name);
    }
    addRelationship(supplier.id, protector.id, "supplies");
  }

  return {
    document: ScimDocumentSchema.parse(document),
    addedEntityNames,
  };
}

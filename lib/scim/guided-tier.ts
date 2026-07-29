import { placementFor, slugifyName, uniqueEntityId } from "./guided";
import {
  ScimDocumentSchema,
  type ScimDocument,
  type ScimRadialView,
} from "./schema";
import { canonicalNeed } from "./tiers";

export interface AddNeedProviderInput {
  needId: string;
  name: string;
  kind: string;
  layer: string;
}

export function addNeedProvider(
  input: ScimDocument,
  request: AddNeedProviderInput
): ScimDocument {
  const document = ScimDocumentSchema.parse(input);
  const need = canonicalNeed(request.needId);
  if (!need) throw new Error(`Unknown canonical need: ${request.needId}`);
  const name = request.name.trim();
  if (!name) throw new Error("Provider name is required.");

  const existing = document.entities.find(
    (entity) => entity.name.toLowerCase() === name.toLowerCase()
  );
  if (existing) {
    return ScimDocumentSchema.parse({
      ...document,
      entities: document.entities.map((entity) =>
        entity.id === existing.id && !entity.supportsNeeds.includes(need.id)
          ? { ...entity, supportsNeeds: [...entity.supportsNeeds, need.id] }
          : entity
      ),
    });
  }

  const id = uniqueEntityId(
    slugifyName(name),
    new Set(document.entities.map((entity) => entity.id))
  );
  const entity = {
    id,
    name,
    description: "",
    kind: slugifyName(request.kind || "service"),
    layer: slugifyName(request.layer),
    status: "normal" as const,
    supportsNeeds: [need.id],
    protectsAgainst: [],
    failureModes: [],
    attributes: {},
    evidence: [],
  };
  const radial = document.views.find(
    (view): view is ScimRadialView => view.type === "radial"
  );
  const position = radial
    ? placementFor(radial, entity.layer, need.id)
    : undefined;

  return ScimDocumentSchema.parse({
    ...document,
    entities: [...document.entities, entity],
    views: document.views.map((view) =>
      radial && view.id === radial.id && view.type === "radial" && position
        ? {
            ...view,
            nodes: [
              ...view.nodes,
              { entityId: id, ...position, width: 132, height: 40 },
            ],
          }
        : view
    ),
  });
}

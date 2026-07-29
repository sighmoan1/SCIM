import type { EntityStatus, ScimDocument, ScimEntity } from "./schema";
import { assessAllTiers, type NeedStatus } from "./needs";
import {
  CANONICAL_NEEDS,
  canonicalNeed,
  LAYERS,
  layerRank,
  normaliseLayer,
  TIERS,
  type CanonicalNeed,
  type Layer,
  type TierId,
} from "./tiers";

export type InamEntityRole = "direct" | "upstream";

export interface InamCellEntity {
  id: string;
  name: string;
  reportedStatus: EntityStatus;
  effectiveStatus: EntityStatus;
  role: InamEntityRole;
  distance: number;
}

export interface InamCell {
  needId: string;
  layerId: string;
  entities: InamCellEntity[];
}

export interface InamRow {
  need: CanonicalNeed;
  status: NeedStatus;
  cells: InamCell[];
}

export interface InamTierGroup {
  tier: TierId;
  label: string;
  rows: InamRow[];
}

export interface InamMatrix {
  layers: Layer[];
  groups: InamTierGroup[];
  usedLayerIds: string[];
}

function protectsNeed(entity: ScimEntity, needId: string): boolean {
  return entity.supportsNeeds.includes(needId) || entity.protectsAgainst.includes(needId);
}

function providersForNeed(
  document: ScimDocument,
  needId: string
): Map<string, { entity: ScimEntity; distance: number }> {
  const incoming = new Map<string, string[]>();
  for (const relationship of document.relationships) {
    const current = incoming.get(relationship.to) ?? [];
    current.push(relationship.from);
    incoming.set(relationship.to, current);
  }

  const entities = new Map(document.entities.map((entity) => [entity.id, entity]));
  const result = new Map<string, { entity: ScimEntity; distance: number }>();
  const queue = document.entities
    .filter((entity) => entity.kind !== "person" && protectsNeed(entity, needId))
    .map((entity) => ({ entity, distance: 0 }));

  while (queue.length) {
    const current = queue.shift();
    if (!current) break;
    const existing = result.get(current.entity.id);
    if (existing && existing.distance <= current.distance) continue;
    result.set(current.entity.id, current);
    for (const sourceId of incoming.get(current.entity.id) ?? []) {
      const source = entities.get(sourceId);
      if (source && source.kind !== "person") {
        queue.push({ entity: source, distance: current.distance + 1 });
      }
    }
  }

  return result;
}

export function buildInamMatrix(document: ScimDocument): InamMatrix {
  const assessment = assessAllTiers(document);
  const statusByNeed = new Map<string, NeedStatus>();
  for (const tier of assessment.tiers) {
    for (const need of tier.needs) statusByNeed.set(need.need.id, need.status);
  }

  const providersByNeed = new Map(
    CANONICAL_NEEDS.map((need) => [need.id, providersForNeed(document, need.id)])
  );
  const usedLayerIds = new Set<string>();
  for (const providers of providersByNeed.values()) {
    for (const { entity } of providers.values()) {
      usedLayerIds.add(normaliseLayer(entity.layer));
    }
  }

  const layers = LAYERS.filter((layer) => usedLayerIds.has(layer.id)).sort(
    (a, b) => layerRank(a.id) - layerRank(b.id)
  );
  const columnLayers = layers.length ? layers : LAYERS;

  const groups: InamTierGroup[] = TIERS.map((tier) => ({
    tier: tier.id,
    label: tier.label,
    rows: tier.needs.map((needId): InamRow => {
      const need = canonicalNeed(needId)!;
      const providers = providersByNeed.get(needId) ?? new Map();
      const cells = columnLayers.map((layer): InamCell => {
        const entities = [...providers.values()]
          .filter(({ entity }) => normaliseLayer(entity.layer) === layer.id)
          .map(({ entity, distance }): InamCellEntity => ({
            id: entity.id,
            name: entity.name,
            reportedStatus: entity.status,
            effectiveStatus:
              assessment.effectiveStatuses.get(entity.id) ?? entity.status,
            role: distance === 0 ? "direct" : "upstream",
            distance,
          }))
          .sort(
            (a, b) => a.distance - b.distance || a.name.localeCompare(b.name)
          );
        return { needId, layerId: layer.id, entities };
      });
      return { need, status: statusByNeed.get(needId) ?? "unmapped", cells };
    }),
  }));

  return {
    layers: columnLayers,
    groups,
    usedLayerIds: [...usedLayerIds].sort((a, b) => layerRank(a) - layerRank(b)),
  };
}

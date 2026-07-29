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

/**
 * The INAM (Integrated Needs Analysis Matrix, the "SCIM Matrix") from Dealing
 * in Security: needs as rows, the layers of provision as columns, showing where
 * every critical resource comes from and how needs interdepend. It is the
 * second canonical view over the same ScimDocument — a horizontal reading of
 * each need across levels, complementing the radial map's centre-out reading.
 *
 * Derived deterministically; never mutates accepted state.
 */

export interface InamCellEntity {
  id: string;
  name: string;
  reportedStatus: EntityStatus;
  effectiveStatus: EntityStatus;
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
  /** Layers that actually hold at least one placed entity. */
  usedLayerIds: string[];
}

function protectsNeed(entity: ScimEntity, needId: string): boolean {
  return (
    entity.supportsNeeds.includes(needId) ||
    entity.protectsAgainst.includes(needId)
  );
}

/**
 * Build the matrix. Only layers that hold at least one entity are kept as
 * columns (plus always the layers present in the document), so a small map does
 * not render seven empty columns.
 */
export function buildInamMatrix(document: ScimDocument): InamMatrix {
  const assessment = assessAllTiers(document);
  const statusByNeed = new Map<string, NeedStatus>();
  for (const tier of assessment.tiers) {
    for (const need of tier.needs) statusByNeed.set(need.need.id, need.status);
  }
  const effective = assessment.effectiveStatuses;

  const usedLayerIds = new Set<string>();
  for (const entity of document.entities) {
    if (entity.kind === "person") continue;
    if (CANONICAL_NEEDS.some((need) => protectsNeed(entity, need.id))) {
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
      const cells = columnLayers.map((layer): InamCell => {
        const entities: InamCellEntity[] = document.entities
          .filter(
            (entity) =>
              protectsNeed(entity, needId) &&
              normaliseLayer(entity.layer) === layer.id
          )
          .map((entity) => ({
            id: entity.id,
            name: entity.name,
            reportedStatus: entity.status,
            effectiveStatus: effective.get(entity.id) ?? entity.status,
          }));
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

import { propagateCriticalFailures, type SimulationResult } from "./simulation";
import type { EntityStatus, ScimDocument, ScimEntity } from "./schema";
import {
  CANONICAL_NEEDS,
  canonicalNeed,
  layerRank,
  needsForTier,
  TIERS,
  type CanonicalNeed,
  type TierId,
} from "./tiers";

export type NeedFamilyId = "shelter" | "supply" | "safety";

export interface NeedFamily {
  id: NeedFamilyId;
  label: string;
  summary: string;
}

export interface ThreatDefinition {
  id: string;
  label: string;
  family: NeedFamilyId;
  question: string;
  hint: string;
}

export const NEED_FAMILIES: NeedFamily[] = [
  { id: "shelter", label: "Shelter", summary: "Keeps your body at a safe temperature" },
  { id: "supply", label: "Supply", summary: "Keeps you fed and hydrated" },
  { id: "safety", label: "Safety", summary: "Protects you from illness and injury" },
];

export const SIX_THREATS: ThreatDefinition[] = [
  {
    id: "too-hot",
    label: "Too hot",
    family: "shelter",
    question: "What keeps you cool in dangerous heat?",
    hint: "Cooling, shade, ventilation, somewhere cooler to go.",
  },
  {
    id: "too-cold",
    label: "Too cold",
    family: "shelter",
    question: "What keeps you warm in dangerous cold?",
    hint: "Heating, warm clothing, blankets, a warm place to go.",
  },
  {
    id: "hunger",
    label: "Hunger",
    family: "supply",
    question: "Where does your food come from?",
    hint: "Shops, home food stores, community support.",
  },
  {
    id: "thirst",
    label: "Thirst",
    family: "supply",
    question: "Where does your drinking water come from?",
    hint: "Tap water, stored water, another local source.",
  },
  {
    id: "illness",
    label: "Illness",
    family: "safety",
    question: "Who treats you when you are ill?",
    hint: "GP or clinic, pharmacy, hospital, home medicines.",
  },
  {
    id: "injury",
    label: "Injury",
    family: "safety",
    question: "Who helps you when you are hurt?",
    hint: "Emergency department, ambulance, first aid kit.",
  },
];

export type NeedStatus = "protected" | "at-risk" | "unprotected" | "unmapped";

export interface ProtectorAssessment {
  entity: ScimEntity;
  reportedStatus: EntityStatus;
  effectiveStatus: EntityStatus;
  working: boolean;
  supplyNotes: string[];
}

export interface NeedAssessment {
  threat: ThreatDefinition;
  status: NeedStatus;
  protectors: ProtectorAssessment[];
  workingProtectors: ProtectorAssessment[];
}

export interface DocumentAssessment {
  needs: NeedAssessment[];
  propagation: SimulationResult;
  effectiveStatuses: Map<string, EntityStatus>;
  counts: {
    protected: number;
    atRisk: number;
    unprotected: number;
    unmapped: number;
  };
}

function protectsNeed(entity: ScimEntity, needId: string): boolean {
  return entity.supportsNeeds.includes(needId) || entity.protectsAgainst.includes(needId);
}

const STATUS_AVAILABLE: ReadonlySet<EntityStatus> = new Set([
  "normal",
  "degraded",
  "new",
]);

interface AssessmentContext {
  effectiveStatuses: Map<string, EntityStatus>;
  baselineEntities: Map<string, ScimEntity>;
}

function buildContext(document: ScimDocument): {
  propagation: SimulationResult;
  context: AssessmentContext;
} {
  const propagation = propagateCriticalFailures(document);
  const effectiveStatuses = new Map<string, EntityStatus>(
    propagation.document.entities.map((entity) => [entity.id, entity.status])
  );
  return {
    propagation,
    context: {
      effectiveStatuses,
      baselineEntities: new Map(document.entities.map((entity) => [entity.id, entity])),
    },
  };
}

function assessProtectors(
  document: ScimDocument,
  needId: string,
  { effectiveStatuses, baselineEntities }: AssessmentContext
): {
  status: NeedStatus;
  protectors: ProtectorAssessment[];
  working: ProtectorAssessment[];
} {
  const protectors = document.entities
    .filter((entity) => protectsNeed(entity, needId))
    .map((entity): ProtectorAssessment => {
      const effectiveStatus = effectiveStatuses.get(entity.id) ?? entity.status;
      const supplyNotes: string[] = [];
      for (const relationship of document.relationships) {
        if (relationship.to !== entity.id || !relationship.critical) continue;
        const source = baselineEntities.get(relationship.from);
        if (!source) continue;
        const sourceStatus = effectiveStatuses.get(source.id) ?? source.status;
        if (sourceStatus === "failed" || relationship.status === "failed") {
          supplyNotes.push(`${source.name} is down`);
        } else if (
          sourceStatus === "degraded" ||
          relationship.status === "degraded"
        ) {
          supplyNotes.push(`${source.name} is struggling`);
        }
      }
      return {
        entity,
        reportedStatus: entity.status,
        effectiveStatus,
        working: STATUS_AVAILABLE.has(effectiveStatus),
        supplyNotes,
      };
    });

  const working = protectors.filter((protector) => protector.working);
  let status: NeedStatus;
  if (!protectors.length) {
    status = "unmapped";
  } else if (!working.length) {
    status = "unprotected";
  } else if (
    protectors.some(
      (protector) =>
        !protector.working || protector.effectiveStatus === "degraded"
    ) ||
    working.some((protector) => protector.supplyNotes.length > 0)
  ) {
    status = "at-risk";
  } else {
    status = "protected";
  }

  return { status, protectors, working };
}

function tallyCounts(statuses: NeedStatus[]) {
  return {
    protected: statuses.filter((status) => status === "protected").length,
    atRisk: statuses.filter((status) => status === "at-risk").length,
    unprotected: statuses.filter((status) => status === "unprotected").length,
    unmapped: statuses.filter((status) => status === "unmapped").length,
  };
}

export function assessDocument(document: ScimDocument): DocumentAssessment {
  const { propagation, context } = buildContext(document);
  const needs = SIX_THREATS.map((threat): NeedAssessment => {
    const { status, protectors, working } = assessProtectors(
      document,
      threat.id,
      context
    );
    return { threat, status, protectors, workingProtectors: working };
  });
  return {
    needs,
    propagation,
    effectiveStatuses: context.effectiveStatuses,
    counts: tallyCounts(needs.map((need) => need.status)),
  };
}

export interface CanonicalNeedAssessment {
  need: CanonicalNeed;
  status: NeedStatus;
  protectors: ProtectorAssessment[];
  workingProtectors: ProtectorAssessment[];
}

export interface TierAssessment {
  tier: TierId;
  label: string;
  summary: string;
  needs: CanonicalNeedAssessment[];
  counts: ReturnType<typeof tallyCounts>;
  mapped: boolean;
}

export interface FullAssessment {
  tiers: TierAssessment[];
  propagation: SimulationResult;
  effectiveStatuses: Map<string, EntityStatus>;
  counts: ReturnType<typeof tallyCounts>;
}

export function assessAllTiers(document: ScimDocument): FullAssessment {
  const { propagation, context } = buildContext(document);
  const tiers = TIERS.map((tier): TierAssessment => {
    const needs = needsForTier(tier.id).map((need): CanonicalNeedAssessment => {
      const result = assessProtectors(document, need.id, context);
      return {
        need,
        status: result.status,
        protectors: result.protectors,
        workingProtectors: result.working,
      };
    });
    return {
      tier: tier.id,
      label: tier.label,
      summary: tier.summary,
      needs,
      counts: tallyCounts(needs.map((need) => need.status)),
      mapped: needs.some((need) => need.status !== "unmapped"),
    };
  });
  const statuses = tiers.flatMap((tier) => tier.needs.map((need) => need.status));
  return {
    tiers,
    propagation,
    effectiveStatuses: context.effectiveStatuses,
    counts: tallyCounts(statuses),
  };
}

export function assessCanonicalNeed(
  document: ScimDocument,
  needId: string
): CanonicalNeedAssessment | null {
  const need = canonicalNeed(needId);
  if (!need) return null;
  const { context } = buildContext(document);
  const result = assessProtectors(document, needId, context);
  return {
    need,
    status: result.status,
    protectors: result.protectors,
    workingProtectors: result.working,
  };
}

export function mappedTierIds(document: ScimDocument): Set<TierId> {
  const present = new Set<TierId>();
  for (const need of CANONICAL_NEEDS) {
    if (document.entities.some((entity) => protectsNeed(entity, need.id))) {
      present.add(need.tier);
    }
  }
  return present;
}

export function listInfrastructure(document: ScimDocument): ScimEntity[] {
  return document.entities
    .filter((entity) => entity.kind !== "person")
    .sort(
      (a, b) =>
        layerRank(a.layer) - layerRank(b.layer) || a.name.localeCompare(b.name)
    );
}

export function needsAffectedBy(
  document: ScimDocument,
  entityId: string
): string[] {
  const affected = new Set<string>();
  const visited = new Set<string>();
  const queue = [entityId];

  while (queue.length) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);
    const entity = document.entities.find((candidate) => candidate.id === currentId);
    if (entity) {
      for (const need of CANONICAL_NEEDS) {
        if (protectsNeed(entity, need.id)) affected.add(need.id);
      }
    }
    for (const relationship of document.relationships) {
      if (relationship.from === currentId) queue.push(relationship.to);
    }
  }

  return CANONICAL_NEEDS.map((need) => need.id).filter((id) => affected.has(id));
}

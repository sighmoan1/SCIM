import { ScimDocumentSchema, type ScimDocument } from "./schema";

export type ScimChangeArea =
  | "model"
  | "entity"
  | "relationship"
  | "scenario"
  | "view";
export type ScimChangeKind = "added" | "removed" | "changed";

export interface ScimDocumentChange {
  key: string;
  area: ScimChangeArea;
  kind: ScimChangeKind;
  id: string;
  summary: string;
  changedFields: string[];
  before?: unknown;
  after?: unknown;
}

export interface ScimDocumentDiff {
  baselineId: string;
  candidateId: string;
  changes: ScimDocumentChange[];
  semanticChangeCount: number;
  scenarioChangeCount: number;
  viewChangeCount: number;
  hasChanges: boolean;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)])
    );
  }
  return value;
}

function equal(left: unknown, right: unknown): boolean {
  return JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
}

function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): string[] {
  const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...fields].filter((field) => !equal(before[field], after[field]));
}

function compareById(
  area: Exclude<ScimChangeArea, "model">,
  beforeValues: Array<{ id: string; name?: string }>,
  afterValues: Array<{ id: string; name?: string }>
): ScimDocumentChange[] {
  const before = new Map(beforeValues.map((value) => [value.id, value]));
  const after = new Map(afterValues.map((value) => [value.id, value]));
  const ids = [...new Set([...before.keys(), ...after.keys()])].sort();
  const changes: ScimDocumentChange[] = [];

  for (const id of ids) {
    const previous = before.get(id);
    const next = after.get(id);
    const label = next?.name ?? previous?.name ?? id;

    if (!previous && next) {
      changes.push({
        key: `${area}:${id}:added`,
        area,
        kind: "added",
        id,
        summary: `Add ${area} ${id} (${label}).`,
        changedFields: Object.keys(next),
        after: next,
      });
      continue;
    }

    if (previous && !next) {
      changes.push({
        key: `${area}:${id}:removed`,
        area,
        kind: "removed",
        id,
        summary: `Remove ${area} ${id} (${label}).`,
        changedFields: Object.keys(previous),
        before: previous,
      });
      continue;
    }

    if (previous && next && !equal(previous, next)) {
      const fields = changedFields(
        previous as Record<string, unknown>,
        next as Record<string, unknown>
      );
      changes.push({
        key: `${area}:${id}:changed`,
        area,
        kind: "changed",
        id,
        summary: `Change ${area} ${id} (${label}): ${fields.join(", ")}.`,
        changedFields: fields,
        before: previous,
        after: next,
      });
    }
  }

  return changes;
}

export function compareScimDocuments(
  baselineInput: ScimDocument,
  candidateInput: ScimDocument
): ScimDocumentDiff {
  const baseline = ScimDocumentSchema.parse(baselineInput);
  const candidate = ScimDocumentSchema.parse(candidateInput);
  const changes: ScimDocumentChange[] = [];

  const baselineModel = {
    schemaVersion: baseline.schemaVersion,
    id: baseline.id,
    title: baseline.title,
    description: baseline.description,
    perspective: baseline.perspective,
    focusEntityId: baseline.focusEntityId,
  };
  const candidateModel = {
    schemaVersion: candidate.schemaVersion,
    id: candidate.id,
    title: candidate.title,
    description: candidate.description,
    perspective: candidate.perspective,
    focusEntityId: candidate.focusEntityId,
  };

  if (!equal(baselineModel, candidateModel)) {
    const fields = changedFields(baselineModel, candidateModel);
    changes.push({
      key: "model:metadata:changed",
      area: "model",
      kind: "changed",
      id: candidate.id,
      summary: `Change model metadata: ${fields.join(", ")}.`,
      changedFields: fields,
      before: baselineModel,
      after: candidateModel,
    });
  }

  changes.push(
    ...compareById("entity", baseline.entities, candidate.entities),
    ...compareById("relationship", baseline.relationships, candidate.relationships),
    ...compareById("scenario", baseline.scenarios, candidate.scenarios),
    ...compareById("view", baseline.views, candidate.views)
  );

  const semanticChangeCount = changes.filter((change) =>
    ["model", "entity", "relationship"].includes(change.area)
  ).length;
  const scenarioChangeCount = changes.filter(
    (change) => change.area === "scenario"
  ).length;
  const viewChangeCount = changes.filter((change) => change.area === "view").length;

  return {
    baselineId: baseline.id,
    candidateId: candidate.id,
    changes,
    semanticChangeCount,
    scenarioChangeCount,
    viewChangeCount,
    hasChanges: changes.length > 0,
  };
}

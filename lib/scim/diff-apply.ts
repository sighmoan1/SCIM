import { compareScimDocuments } from "./diff";
import { ScimDocumentSchema, type ScimDocument } from "./schema";

export interface ApplyScimChangesResult {
  document: ScimDocument | null;
  errors: string[];
}

function applyById<T extends { id: string }>(
  current: T[],
  candidate: T[],
  id: string,
  kind: "added" | "removed" | "changed"
): T[] {
  if (kind === "removed") return current.filter((item) => item.id !== id);
  const replacement = candidate.find((item) => item.id === id);
  if (!replacement) return current;

  const currentIndex = current.findIndex((item) => item.id === id);
  if (currentIndex < 0) return [...current, structuredClone(replacement)];

  return current.map((item, index) =>
    index === currentIndex ? structuredClone(replacement) : item
  );
}

export function applySelectedScimChanges(
  baselineInput: ScimDocument,
  candidateInput: ScimDocument,
  selectedKeys: Iterable<string>
): ApplyScimChangesResult {
  const baseline = ScimDocumentSchema.parse(baselineInput);
  const candidate = ScimDocumentSchema.parse(candidateInput);
  const selected = new Set(selectedKeys);
  const diff = compareScimDocuments(baseline, candidate);
  const next = structuredClone(baseline);

  for (const change of diff.changes) {
    if (!selected.has(change.key)) continue;

    if (change.area === "model") {
      next.schemaVersion = candidate.schemaVersion;
      next.id = candidate.id;
      next.title = candidate.title;
      next.description = candidate.description;
      next.perspective = candidate.perspective;
      next.focusEntityId = candidate.focusEntityId;
      continue;
    }

    if (change.area === "entity") {
      next.entities = applyById(
        next.entities,
        candidate.entities,
        change.id,
        change.kind
      );
      continue;
    }

    if (change.area === "relationship") {
      next.relationships = applyById(
        next.relationships,
        candidate.relationships,
        change.id,
        change.kind
      );
      continue;
    }

    if (change.area === "scenario") {
      next.scenarios = applyById(
        next.scenarios,
        candidate.scenarios,
        change.id,
        change.kind
      );
      continue;
    }

    next.views = applyById(next.views, candidate.views, change.id, change.kind);
  }

  const parsed = ScimDocumentSchema.safeParse(next);
  if (!parsed.success) {
    return {
      document: null,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "document"}: ${issue.message}`
      ),
    };
  }

  return { document: parsed.data, errors: [] };
}

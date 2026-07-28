import { compareScimDocuments, type ScimDocumentChange } from "./diff";
import { ScimDocumentSchema, type ScimDocument } from "./schema";

export const SCIM_WORKSPACE_DOCUMENT_KEY = "scim.workspace.document.v1";
export const SCIM_WORKSPACE_REVISIONS_KEY = "scim.workspace.revisions.v1";

export type ScimRevisionOrigin = "human" | "ai";

export interface ScimWorkspaceRevision {
  id: string;
  origin: ScimRevisionOrigin;
  label: string;
  createdAt: string;
  changes: ScimDocumentChange[];
  before: ScimDocument;
  after: ScimDocument;
}

export interface ScimWorkspaceSnapshot {
  document: ScimDocument;
  revisions: ScimWorkspaceRevision[];
}

function revisionId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `revision-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createScimWorkspaceRevision(
  beforeInput: ScimDocument,
  afterInput: ScimDocument,
  options: { origin: ScimRevisionOrigin; label: string }
): ScimWorkspaceRevision | null {
  const before = ScimDocumentSchema.parse(beforeInput);
  const after = ScimDocumentSchema.parse(afterInput);
  const diff = compareScimDocuments(before, after);
  if (!diff.hasChanges) return null;

  return {
    id: revisionId(),
    origin: options.origin,
    label: options.label,
    createdAt: new Date().toISOString(),
    changes: diff.changes,
    before,
    after,
  };
}

function parseRevision(value: unknown): ScimWorkspaceRevision | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ScimWorkspaceRevision>;
  const before = ScimDocumentSchema.safeParse(candidate.before);
  const after = ScimDocumentSchema.safeParse(candidate.after);
  if (
    !before.success ||
    !after.success ||
    !candidate.id ||
    !candidate.createdAt ||
    !candidate.label ||
    (candidate.origin !== "human" && candidate.origin !== "ai") ||
    !Array.isArray(candidate.changes)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    origin: candidate.origin,
    label: candidate.label,
    createdAt: candidate.createdAt,
    changes: candidate.changes,
    before: before.data,
    after: after.data,
  };
}

export function loadScimWorkspace(
  storage: Pick<Storage, "getItem">,
  fallback: ScimDocument
): ScimWorkspaceSnapshot {
  let document = ScimDocumentSchema.parse(fallback);
  let revisions: ScimWorkspaceRevision[] = [];

  try {
    const storedDocument = storage.getItem(SCIM_WORKSPACE_DOCUMENT_KEY);
    if (storedDocument) {
      const parsed = ScimDocumentSchema.safeParse(JSON.parse(storedDocument));
      if (parsed.success) document = parsed.data;
    }
  } catch {
    // Keep the validated fallback when local storage contains malformed data.
  }

  try {
    const storedRevisions = storage.getItem(SCIM_WORKSPACE_REVISIONS_KEY);
    if (storedRevisions) {
      const parsed = JSON.parse(storedRevisions);
      if (Array.isArray(parsed)) {
        revisions = parsed
          .map(parseRevision)
          .filter((revision): revision is ScimWorkspaceRevision => Boolean(revision));
      }
    }
  } catch {
    // Revision history is optional; malformed history must not block the map.
  }

  return { document, revisions };
}

export function saveScimWorkspace(
  storage: Pick<Storage, "setItem">,
  snapshot: ScimWorkspaceSnapshot
): void {
  const document = ScimDocumentSchema.parse(snapshot.document);
  storage.setItem(SCIM_WORKSPACE_DOCUMENT_KEY, JSON.stringify(document));
  storage.setItem(
    SCIM_WORKSPACE_REVISIONS_KEY,
    JSON.stringify(snapshot.revisions.slice(-100))
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPersonalStarterDocument } from "@/lib/scim/personal-starter";
import { ScimDocumentSchema, type ScimDocument } from "@/lib/scim/schema";
import {
  createScimWorkspaceRevision,
  loadScimWorkspace,
  saveScimWorkspace,
  type ScimRevisionOrigin,
  type ScimWorkspaceRevision,
} from "@/lib/scim/workspace";

/**
 * Browser-local accepted workspace shared by every screen: one validated
 * document plus its revision history, loaded from and saved to local storage.
 * Every accepted change goes through `commit` so it is validated and recorded
 * with provenance, exactly like edits made on the map.
 */
export function useScimWorkspace() {
  const fallback = useMemo(() => createPersonalStarterDocument(), []);
  const [document, setDocument] = useState<ScimDocument>(fallback);
  const [revisions, setRevisions] = useState<ScimWorkspaceRevision[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const documentRef = useRef(document);

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  useEffect(() => {
    const workspace = loadScimWorkspace(window.localStorage, fallback);
    documentRef.current = workspace.document;
    setDocument(workspace.document);
    setRevisions(workspace.revisions);
    setHydrated(true);
  }, [fallback]);

  useEffect(() => {
    if (!hydrated) return;
    saveScimWorkspace(window.localStorage, { document, revisions });
  }, [document, hydrated, revisions]);

  const commit = useCallback(
    (
      next: ScimDocument,
      label: string,
      origin: ScimRevisionOrigin = "human"
    ): boolean => {
      const after = ScimDocumentSchema.parse(next);
      const revision = createScimWorkspaceRevision(documentRef.current, after, {
        origin,
        label,
      });
      documentRef.current = after;
      setDocument(after);
      if (revision) {
        setRevisions((current) => [...current, revision].slice(-100));
        return true;
      }
      return false;
    },
    []
  );

  const undo = useCallback((): string | null => {
    let undone: string | null = null;
    setRevisions((current) => {
      const revision = current.at(-1);
      if (!revision) return current;
      undone = revision.label;
      documentRef.current = revision.before;
      setDocument(revision.before);
      return current.slice(0, -1);
    });
    return undone;
  }, []);

  return { document, revisions, hydrated, commit, undo, documentRef };
}

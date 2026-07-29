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

export function useScimWorkspace() {
  const fallback = useMemo(() => createPersonalStarterDocument(), []);
  const [document, setDocument] = useState<ScimDocument>(fallback);
  const [revisions, setRevisions] = useState<ScimWorkspaceRevision[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const documentRef = useRef(document);
  const revisionsRef = useRef(revisions);

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  useEffect(() => {
    revisionsRef.current = revisions;
  }, [revisions]);

  useEffect(() => {
    const workspace = loadScimWorkspace(window.localStorage, fallback);
    documentRef.current = workspace.document;
    revisionsRef.current = workspace.revisions;
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
      if (!revision) return false;
      const nextRevisions = [...revisionsRef.current, revision].slice(-100);
      revisionsRef.current = nextRevisions;
      setRevisions(nextRevisions);
      return true;
    },
    []
  );

  const undo = useCallback((): string | null => {
    const revision = revisionsRef.current.at(-1);
    if (!revision) return null;
    const nextRevisions = revisionsRef.current.slice(0, -1);
    revisionsRef.current = nextRevisions;
    documentRef.current = revision.before;
    setRevisions(nextRevisions);
    setDocument(revision.before);
    return revision.label;
  }, []);

  return { document, revisions, hydrated, commit, undo, documentRef };
}

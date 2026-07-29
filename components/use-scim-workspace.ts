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

  const commitFrom = useCallback(
    (
      beforeInput: ScimDocument,
      next: ScimDocument,
      label: string,
      origin: ScimRevisionOrigin = "human"
    ): ScimWorkspaceRevision | null => {
      const before = ScimDocumentSchema.parse(beforeInput);
      const after = ScimDocumentSchema.parse(next);
      const revision = createScimWorkspaceRevision(before, after, {
        origin,
        label,
      });
      documentRef.current = after;
      setDocument(after);
      if (!revision) return null;
      const nextRevisions = [...revisionsRef.current, revision].slice(-100);
      revisionsRef.current = nextRevisions;
      setRevisions(nextRevisions);
      return revision;
    },
    []
  );

  const commit = useCallback(
    (
      next: ScimDocument,
      label: string,
      origin: ScimRevisionOrigin = "human"
    ): boolean => Boolean(commitFrom(documentRef.current, next, label, origin)),
    [commitFrom]
  );

  /**
   * Replace the current document during a live interaction. The caller must
   * commit the completed gesture once with commitFrom to create one revision.
   */
  const replaceTransient = useCallback((next: ScimDocument): void => {
    const parsed = ScimDocumentSchema.parse(next);
    documentRef.current = parsed;
    setDocument(parsed);
  }, []);

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

  return {
    document,
    revisions,
    hydrated,
    commit,
    commitFrom,
    replaceTransient,
    undo,
    documentRef,
  };
}

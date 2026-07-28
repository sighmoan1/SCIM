"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createDefaultScimDocument } from "@/lib/scim/default-model";
import { applySelectedScimChanges } from "@/lib/scim/diff-apply";
import { compareScimDocuments } from "@/lib/scim/diff";
import { parseScimDsl, parseScimMarkdown, ScimSyntaxError } from "@/lib/scim/parser";
import { parseScimProposal, serializeScimProposalRequest } from "@/lib/scim/proposal";
import type { ScimDocument } from "@/lib/scim/schema";
import { serializeScimDsl } from "@/lib/scim/serializer";
import {
  createScimWorkspaceRevision,
  loadScimWorkspace,
  saveScimWorkspace,
  type ScimWorkspaceRevision,
} from "@/lib/scim/workspace";

function parseSource(source: string): ScimDocument {
  return source.includes("```scim") ? parseScimMarkdown(source) : parseScimDsl(source);
}

function errorsFrom(error: unknown): string[] {
  if (error instanceof ScimSyntaxError) {
    return error.errors.map((item) => `Line ${item.line}: ${item.message}`);
  }
  return [error instanceof Error ? error.message : "Unknown error"];
}

function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
  return Promise.resolve();
}

export function ScimCollaborationReview() {
  const fallback = useMemo(() => createDefaultScimDocument(), []);
  const [baselineSource, setBaselineSource] = useState(() => serializeScimDsl(fallback));
  const [proposalSource, setProposalSource] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [revisions, setRevisions] = useState<ScimWorkspaceRevision[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const workspace = loadScimWorkspace(window.localStorage, fallback);
    setBaselineSource(serializeScimDsl(workspace.document));
    setRevisions(workspace.revisions);
  }, [fallback]);

  const baselineResult = useMemo(() => {
    try {
      return { document: parseSource(baselineSource), errors: [] as string[] };
    } catch (error) {
      return { document: null, errors: errorsFrom(error) };
    }
  }, [baselineSource]);

  const proposalResult = useMemo(() => {
    if (!proposalSource.trim()) return { proposal: null, errors: [] as string[] };
    try {
      return { proposal: parseScimProposal(proposalSource), errors: [] as string[] };
    } catch (error) {
      return { proposal: null, errors: errorsFrom(error) };
    }
  }, [proposalSource]);

  const diff = useMemo(() => {
    if (!baselineResult.document || !proposalResult.proposal) return null;
    return compareScimDocuments(
      baselineResult.document,
      proposalResult.proposal.candidate
    );
  }, [baselineResult.document, proposalResult.proposal]);

  const diffIdentity = diff?.changes.map((change) => change.key).join("|") ?? "";
  useEffect(() => {
    setSelectedKeys(new Set(diff?.changes.map((change) => change.key) ?? []));
  }, [diffIdentity, diff]);

  const accepted = useMemo(() => {
    if (!baselineResult.document || !proposalResult.proposal) {
      return { document: null, errors: [] as string[] };
    }
    return applySelectedScimChanges(
      baselineResult.document,
      proposalResult.proposal.candidate,
      selectedKeys
    );
  }, [baselineResult.document, proposalResult.proposal, selectedKeys]);

  const toggle = (key: string) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const copyRequest = async () => {
    if (!baselineResult.document) return;
    await copyText(
      serializeScimProposalRequest(
        baselineResult.document,
        "Analyse this infrastructure model, challenge its assumptions, identify missing dependencies and scenarios, and return one complete reviewable proposal."
      )
    );
    setMessage("Proposal request copied. Paste it into an AI chat, then paste the response here.");
  };

  const acceptIntoWorkspace = () => {
    if (!baselineResult.document || !accepted.document || !proposalResult.proposal) return;
    const revision = createScimWorkspaceRevision(
      baselineResult.document,
      accepted.document,
      {
        origin: "ai",
        label: proposalResult.proposal.title,
      }
    );
    const nextRevisions = revision ? [...revisions, revision].slice(-100) : revisions;
    saveScimWorkspace(window.localStorage, {
      document: accepted.document,
      revisions: nextRevisions,
    });
    setRevisions(nextRevisions);
    setBaselineSource(serializeScimDsl(accepted.document));
    setProposalSource("");
    setSelectedKeys(new Set());
    setMessage(
      revision
        ? `Accepted ${revision.changes.length} reviewed AI change${revision.changes.length === 1 ? "" : "s"} into the shared workspace.`
        : "The accepted proposal did not change the model."
    );
  };

  return (
    <div className="space-y-4 p-3 pb-12 md:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Review human or AI proposals</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            The accepted map is the baseline. A proposed complete model is compared structurally, and only checked changes enter the same revision history as manual edits.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!baselineResult.document} onClick={copyRequest}>
            Copy request for AI
          </Button>
          <Button asChild><Link href="/">Return to map</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Accepted workspace baseline</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <textarea
              aria-label="Accepted workspace baseline"
              className="h-[40vh] w-full resize-y rounded-md border bg-background p-3 font-mono text-sm"
              spellCheck={false}
              value={baselineSource}
              onChange={(event) => setBaselineSource(event.target.value)}
            />
            {baselineResult.errors.map((error) => <p key={error} className="text-sm text-red-700">{error}</p>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Paste a complete proposal response</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <textarea
              aria-label="Proposed SCIM response"
              className="h-[40vh] w-full resize-y rounded-md border bg-background p-3 font-mono text-sm"
              spellCheck={false}
              placeholder="# Proposal title\n\n## Rationale\n...\n\n## Assumptions\n- ...\n\n## Open questions\n- ...\n\n## Complete candidate model\n\n```scim\n...\n```"
              value={proposalSource}
              onChange={(event) => setProposalSource(event.target.value)}
            />
            {proposalResult.errors.map((error) => <p key={error} className="text-sm text-red-700">{error}</p>)}
          </CardContent>
        </Card>
      </div>

      {proposalResult.proposal && (
        <Card>
          <CardHeader><CardTitle>{proposalResult.proposal.title}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <section><h2 className="font-medium">Rationale</h2><p className="mt-1 whitespace-pre-wrap text-sm">{proposalResult.proposal.rationale || "None supplied."}</p></section>
            <section><h2 className="font-medium">Assumptions</h2><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{proposalResult.proposal.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></section>
            <section><h2 className="font-medium">Open questions</h2><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{proposalResult.proposal.openQuestions.map((item) => <li key={item}>{item}</li>)}</ul></section>
          </CardContent>
        </Card>
      )}

      {diff && (
        <Card>
          <CardHeader><CardTitle>Reviewable canonical operations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>{diff.semanticChangeCount} semantic</span><span>·</span>
              <span>{diff.scenarioChangeCount} scenario</span><span>·</span>
              <span>{diff.viewChangeCount} view</span><span>·</span>
              <span>{selectedKeys.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => setSelectedKeys(new Set(diff.changes.map((change) => change.key)))}>Accept all</Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedKeys(new Set())}>Reject all</Button>
            </div>

            {diff.changes.map((change) => (
              <div key={change.key} className="rounded-md border p-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input className="mt-1 h-4 w-4" type="checkbox" checked={selectedKeys.has(change.key)} onChange={() => toggle(change.key)} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{change.summary}</span>
                    <span className="text-sm text-muted-foreground">{change.area} · {change.kind} · {change.changedFields.join(", ")}</span>
                  </span>
                </label>
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer">Inspect structured before and after</summary>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <pre className="overflow-auto rounded-md bg-muted p-2 text-xs">{JSON.stringify(change.before ?? null, null, 2)}</pre>
                    <pre className="overflow-auto rounded-md bg-muted p-2 text-xs">{JSON.stringify(change.after ?? null, null, 2)}</pre>
                  </div>
                </details>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Accepted result</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {accepted.errors.map((error) => <p key={error} className="text-sm text-red-700">{error}</p>)}
          <textarea
            aria-label="Accepted SCIM result"
            className="h-[32vh] w-full resize-y rounded-md border bg-background p-3 font-mono text-sm"
            readOnly
            value={accepted.document ? serializeScimDsl(accepted.document) : ""}
          />
          <div className="flex flex-wrap gap-2">
            <Button disabled={!accepted.document || accepted.errors.length > 0} onClick={acceptIntoWorkspace}>
              Accept selected changes into workspace
            </Button>
            <Button variant="outline" disabled={!accepted.document} onClick={() => accepted.document && copyText(serializeScimDsl(accepted.document)).then(() => setMessage("Accepted result copied."))}>
              Copy accepted SCIM
            </Button>
          </div>
        </CardContent>
      </Card>

      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

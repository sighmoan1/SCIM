"use client";

import { useEffect, useMemo, useState } from "react";
import { applySelectedScimChanges } from "@/lib/scim/diff-apply";
import { compareScimDocuments } from "@/lib/scim/diff";
import { parseScimDsl, parseScimMarkdown, ScimSyntaxError } from "@/lib/scim/parser";
import {
  parseScimProposal,
  serializeScimProposalRequest,
} from "@/lib/scim/proposal";
import { serializeScimDsl } from "@/lib/scim/serializer";
import type { ScimDocument } from "@/lib/scim/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BASELINE = `model clinic-resilience "Clinic resilience" {
  perspective: individual
  focus: patient

  entity patient "Patient" {
    kind: person
    layer: individual
  }

  entity clinic "Community clinic" {
    kind: healthcare
    layer: municipality
    supports: [injury, illness]
  }

  entity grid "Electricity grid" {
    kind: power
    layer: region
  }

  grid -> clinic {
    id: grid-clinic
    kind: supplies
    mode: grid
    critical: true
    requirement-group: clinic-power
    requirement-service: electricity
    requirement-policy: all
    when-unsatisfied: failed
  }

  clinic -> patient {
    id: clinic-patient
    kind: protects
    critical: true
  }
}`;

const PROPOSAL = `# Add backup power to the clinic

## Rationale

The clinic currently has one critical electricity provider. Add a backup generator and change the electricity requirement from one mandatory provider to either available provider.

## Assumptions

- The generator can supply the clinic's essential electrical load.
- Fuel availability is not yet modelled.

## Open questions

- How many hours of fuel are held on site?
- Which clinical services are included in the essential load?

## Complete candidate model

\`\`\`scim
model clinic-resilience "Clinic resilience" {
  perspective: individual
  focus: patient

  entity patient "Patient" {
    kind: person
    layer: individual
  }

  entity clinic "Community clinic" {
    kind: healthcare
    layer: municipality
    supports: [injury, illness]
  }

  entity grid "Electricity grid" {
    kind: power
    layer: region
  }

  entity generator "Clinic backup generator" {
    kind: power
    layer: municipality
    status: new
    fuel-hours: 24
  }

  grid -> clinic {
    id: grid-clinic
    kind: supplies
    mode: grid
    critical: true
    requirement-group: clinic-power
    requirement-service: electricity
    requirement-policy: any
    minimum-available: 1
    when-unsatisfied: failed
  }

  generator -> clinic {
    id: generator-clinic
    kind: backup-for
    mode: on-site
    status: new
    critical: true
    requirement-group: clinic-power
    requirement-service: electricity
    requirement-policy: any
    minimum-available: 1
    when-unsatisfied: failed
  }

  clinic -> patient {
    id: clinic-patient
    kind: protects
    critical: true
  }
}
\`\`\``;

function parseSource(source: string): ScimDocument {
  return source.includes("```scim") ? parseScimMarkdown(source) : parseScimDsl(source);
}

function errorMessages(error: unknown): string[] {
  if (error instanceof ScimSyntaxError) {
    return error.errors.map((item) => `Line ${item.line}: ${item.message}`);
  }
  return [error instanceof Error ? error.message : "Unknown error"];
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ScimProposalReview() {
  const [baselineSource, setBaselineSource] = useState(BASELINE);
  const [proposalSource, setProposalSource] = useState(PROPOSAL);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");

  const baselineResult = useMemo(() => {
    try {
      return { document: parseSource(baselineSource), errors: [] as string[] };
    } catch (error) {
      return { document: null, errors: errorMessages(error) };
    }
  }, [baselineSource]);

  const proposalResult = useMemo(() => {
    try {
      return { proposal: parseScimProposal(proposalSource), errors: [] as string[] };
    } catch (error) {
      return { proposal: null, errors: errorMessages(error) };
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
  }, [diffIdentity]);

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

  const acceptedSource = accepted.document ? serializeScimDsl(accepted.document) : "";

  const toggle = (key: string) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const copyProposalRequest = async () => {
    if (!baselineResult.document) return;
    await copyText(serializeScimProposalRequest(baselineResult.document));
    setMessage("Proposal request copied for an AI conversation.");
  };

  const copyAccepted = async () => {
    if (!acceptedSource) return;
    await copyText(acceptedSource);
    setMessage("Accepted SCIM model copied.");
  };

  return (
    <div className="space-y-4 p-3 pb-12 md:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Review a human or AI proposal</h1>
          <p className="text-sm text-muted-foreground">
            Compare a complete candidate model with the accepted baseline. Nothing is applied silently.
          </p>
        </div>
        <Button variant="outline" disabled={!baselineResult.document} onClick={copyProposalRequest}>
          Copy request for AI
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accepted baseline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <textarea
              aria-label="Accepted baseline SCIM"
              className="h-[42vh] w-full resize-y rounded-md border bg-background p-3 font-mono text-sm"
              spellCheck={false}
              value={baselineSource}
              onChange={(event) => setBaselineSource(event.target.value)}
            />
            {baselineResult.errors.map((error) => (
              <p key={error} className="text-sm text-red-700">{error}</p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proposed response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <textarea
              aria-label="Proposed SCIM response"
              className="h-[42vh] w-full resize-y rounded-md border bg-background p-3 font-mono text-sm"
              spellCheck={false}
              value={proposalSource}
              onChange={(event) => setProposalSource(event.target.value)}
            />
            {proposalResult.errors.map((error) => (
              <p key={error} className="text-sm text-red-700">{error}</p>
            ))}
          </CardContent>
        </Card>
      </div>

      {proposalResult.proposal && (
        <Card>
          <CardHeader>
            <CardTitle>{proposalResult.proposal.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <h2 className="font-medium">Rationale</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm">
                {proposalResult.proposal.rationale || "No rationale supplied."}
              </p>
            </div>
            <div>
              <h2 className="font-medium">Assumptions</h2>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {proposalResult.proposal.assumptions.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h2 className="font-medium">Open questions</h2>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {proposalResult.proposal.openQuestions.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {diff && (
        <Card>
          <CardHeader>
            <CardTitle>Reviewable changes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>{diff.semanticChangeCount} semantic</span>
              <span>·</span>
              <span>{diff.scenarioChangeCount} scenario</span>
              <span>·</span>
              <span>{diff.viewChangeCount} view</span>
              <span>·</span>
              <span>{selectedKeys.size} accepted</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedKeys(new Set(diff.changes.map((change) => change.key)))}
              >
                Accept all
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedKeys(new Set())}>
                Reject all
              </Button>
            </div>

            {diff.changes.length ? diff.changes.map((change) => (
              <div key={change.key} className="rounded-md border p-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={selectedKeys.has(change.key)}
                    onChange={() => toggle(change.key)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{change.summary}</span>
                    <span className="text-sm text-muted-foreground">
                      {change.area} · {change.kind} · {change.changedFields.join(", ")}
                    </span>
                  </span>
                </label>
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer">Inspect structured before and after</summary>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <pre className="overflow-auto rounded-md bg-muted p-2 text-xs">
                      {JSON.stringify(change.before ?? null, null, 2)}
                    </pre>
                    <pre className="overflow-auto rounded-md bg-muted p-2 text-xs">
                      {JSON.stringify(change.after ?? null, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">The candidate is identical to the baseline.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Accepted result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {accepted.errors.map((error) => (
            <p key={error} className="text-sm text-red-700">{error}</p>
          ))}
          <textarea
            aria-label="Accepted SCIM result"
            className="h-[38vh] w-full resize-y rounded-md border bg-background p-3 font-mono text-sm"
            readOnly
            value={acceptedSource}
          />
          <div className="flex flex-wrap gap-2">
            <Button disabled={!acceptedSource} onClick={copyAccepted}>Copy accepted SCIM</Button>
            <Button
              variant="outline"
              disabled={!acceptedSource || !accepted.document}
              onClick={() =>
                accepted.document &&
                download(`${accepted.document.id}.accepted.scim`, acceptedSource)
              }
            >
              Download accepted SCIM
            </Button>
          </div>
        </CardContent>
      </Card>

      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

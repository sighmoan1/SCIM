"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NEED_ICONS, NEED_STATUS_META } from "@/components/need-status";
import { useScimWorkspace } from "@/components/use-scim-workspace";
import {
  assessDocument,
  listInfrastructure,
  needsAffectedBy,
  SIX_THREATS,
} from "@/lib/scim/needs";
import type { EntityStatus, ScimDocument } from "@/lib/scim/schema";
import { cn } from "@/lib/utils";

const REPORT_OPTIONS: Array<{
  status: EntityStatus;
  label: string;
  active: string;
}> = [
  {
    status: "normal",
    label: "Working",
    active: "bg-emerald-600 text-white border-emerald-600",
  },
  {
    status: "degraded",
    label: "Struggling",
    active: "bg-amber-500 text-white border-amber-500",
  },
  {
    status: "failed",
    label: "Down",
    active: "bg-red-600 text-white border-red-600",
  },
];

function setEntityStatus(
  document: ScimDocument,
  entityId: string,
  status: EntityStatus
): ScimDocument {
  return {
    ...document,
    entities: document.entities.map((entity) =>
      entity.id === entityId ? { ...entity, status } : entity
    ),
  };
}

const THREAT_LABELS = new Map(
  SIX_THREATS.map((threat) => [threat.id, threat.label])
);

export function EmergencyMode() {
  const { document, hydrated, commit, undo, revisions } = useScimWorkspace();
  const [message, setMessage] = useState("");

  const assessment = useMemo(() => assessDocument(document), [document]);
  const infrastructure = useMemo(() => listInfrastructure(document), [document]);
  const reportedProblems = infrastructure.filter(
    (entity) => entity.status !== "normal" && entity.status !== "new"
  );

  const report = (entityId: string, status: EntityStatus) => {
    const entity = document.entities.find((candidate) => candidate.id === entityId);
    if (!entity || entity.status === status) return;
    const labels: Record<string, string> = {
      normal: "working again",
      degraded: "struggling",
      failed: "down",
    };
    commit(
      setEntityStatus(document, entityId, status),
      `Report ${entity.name} ${labels[status] ?? status}`
    );
    setMessage(`${entity.name} marked as ${labels[status] ?? status}.`);
  };

  const allClear = () => {
    let next = document;
    for (const entity of reportedProblems) {
      next = setEntityStatus(next, entity.id, "normal");
    }
    next = {
      ...next,
      relationships: next.relationships.map((relationship) =>
        relationship.status === "normal"
          ? relationship
          : { ...relationship, status: "normal" }
      ),
    };
    commit(next, "All clear — everything back to normal");
    setMessage("Everything marked as working again.");
  };

  const failingNeeds = assessment.needs.filter(
    (need) => need.status === "at-risk" || need.status === "unprotected"
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Emergency</h1>
        <p className="text-sm text-muted-foreground">
          Mark what has stopped working. The app shows which of your six needs
          that puts at risk, and which backups you still have. Everything stays
          on this phone.
        </p>
      </section>

      {/* Live needs overview */}
      <section
        aria-label="Your six needs right now"
        className="grid grid-cols-3 gap-2 sm:grid-cols-6"
      >
        {assessment.needs.map((need) => {
          const Icon = NEED_ICONS[need.threat.id];
          const meta = NEED_STATUS_META[need.status];
          return (
            <div
              key={need.threat.id}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-2 text-center",
                need.status === "protected" && "border-emerald-200 bg-emerald-50",
                need.status === "at-risk" && "border-amber-300 bg-amber-50",
                need.status === "unprotected" && "border-red-300 bg-red-50",
                need.status === "unmapped" && "border-dashed bg-muted/30"
              )}
            >
              {Icon && (
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
              <span className="text-[11px] font-semibold leading-tight">
                {need.threat.label}
              </span>
              <span
                className={cn("h-2 w-2 rounded-full", meta.dot)}
                role="img"
                aria-label={meta.label}
              />
            </div>
          );
        })}
      </section>

      {/* What that means */}
      {failingNeeds.length > 0 && (
        <section className="space-y-2" aria-label="What this means for you">
          {failingNeeds.map((need) => {
            const downProtectors = need.protectors.filter(
              (protector) => !protector.working
            );
            return (
              <div
                key={need.threat.id}
                className={cn(
                  "rounded-lg border p-3 text-sm",
                  need.status === "unprotected"
                    ? "border-red-300 bg-red-50"
                    : "border-amber-300 bg-amber-50"
                )}
              >
                <p className="font-semibold">
                  {need.threat.label}:{" "}
                  {need.status === "unprotected"
                    ? "you have no working protection."
                    : "at risk."}
                </p>
                {downProtectors.map((protector) => (
                  <p key={protector.entity.id} className="mt-1">
                    {protector.entity.name} is down
                    {protector.supplyNotes.length > 0 &&
                      ` — ${protector.supplyNotes.join("; ")}`}
                    .
                  </p>
                ))}
                {need.workingProtectors.length > 0 ? (
                  <p className="mt-1 font-medium text-emerald-900">
                    Still working:{" "}
                    {need.workingProtectors
                      .map((protector) => protector.entity.name)
                      .join(", ")}
                  </p>
                ) : (
                  need.status === "unprotected" && (
                    <p className="mt-1">
                      No backup is mapped for this. Deal with it first, or add a
                      backup from the Home tab when you can.
                    </p>
                  )
                )}
              </div>
            );
          })}
        </section>
      )}

      {hydrated && failingNeeds.length === 0 && reportedProblems.length === 0 && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Nothing is reported as down. If something just failed, find it below
          and tap “Down”.
        </p>
      )}

      {/* Report list */}
      <section className="space-y-2" aria-label="Report what is down">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your infrastructure
          </h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={!revisions.length}
              onClick={() => {
                const undone = undo();
                if (undone) setMessage(`Undid: ${undone}`);
              }}
            >
              <Undo2 className="mr-1 h-4 w-4" aria-hidden="true" /> Undo
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!reportedProblems.length}
              onClick={allClear}
            >
              <RotateCcw className="mr-1 h-4 w-4" aria-hidden="true" /> All clear
            </Button>
          </div>
        </div>

        <ul className="space-y-2">
          {infrastructure.map((entity) => {
            const affected = needsAffectedBy(document, entity.id);
            return (
              <li key={entity.id} className="rounded-lg border bg-card p-3">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{entity.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {entity.layer}
                  </span>
                  {affected.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      · matters for{" "}
                      {affected
                        .map((needId) => THREAT_LABELS.get(needId) ?? needId)
                        .join(", ")
                        .toLowerCase()}
                    </span>
                  )}
                </div>
                <div
                  role="group"
                  aria-label={`Status of ${entity.name}`}
                  className="mt-2 grid grid-cols-3 gap-1"
                >
                  {REPORT_OPTIONS.map((option) => {
                    const selected = entity.status === option.status ||
                      (option.status === "normal" && entity.status === "new");
                    return (
                      <button
                        key={option.status}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => report(entity.id, option.status)}
                        className={cn(
                          "min-h-10 rounded-md border text-sm font-medium transition-colors",
                          selected
                            ? option.active
                            : "bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
        {infrastructure.length === 0 && hydrated && (
          <p className="text-sm text-muted-foreground">
            Your map has no infrastructure yet. Start on the{" "}
            <Link href="/" className="font-medium underline">
              Home
            </Link>{" "}
            tab and add what protects you.
          </p>
        )}
      </section>

      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

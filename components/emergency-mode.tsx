"use client";

import Link from "next/link";
import { useMemo } from "react";
import { RotateCcw, ShieldCheck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NEED_ICONS, NEED_STATUS_META } from "@/components/need-status";
import { Snackbar, useSnackbar } from "@/components/snackbar";
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
    active: "bg-ok text-white shadow-sm dark:text-emerald-950",
  },
  {
    status: "degraded",
    label: "Struggling",
    active: "bg-warn text-white shadow-sm dark:text-yellow-950",
  },
  {
    status: "failed",
    label: "Down",
    active: "bg-danger text-white shadow-sm",
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

function EmergencySkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6" aria-hidden="true">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-[74px] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

export function EmergencyMode() {
  const { document, hydrated, commit, undo, revisions } = useScimWorkspace();
  const { snackbar, visible, show } = useSnackbar();

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
    show(`${entity.name} marked as ${labels[status] ?? status}`);
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
    show("Everything marked as working again");
  };

  const failingNeeds = assessment.needs.filter(
    (need) => need.status === "at-risk" || need.status === "unprotected"
  );

  if (!hydrated) return <EmergencySkeleton />;

  return (
    <div className="rise-in mx-auto max-w-3xl space-y-5 px-4 py-6">
      <section className="space-y-1">
        <h1 className="text-[1.6rem] font-bold leading-tight">Emergency</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Mark what has stopped working. The app shows which of your six needs
          that puts at risk, and which backups you still have.
        </p>
      </section>

      {/* Live needs overview — sticky so it stays visible while reporting */}
      <section
        aria-label="Your six needs right now"
        className="sticky top-2 z-30 grid grid-cols-6 gap-1.5 rounded-2xl bg-background/85 py-1 backdrop-blur-md sm:gap-2 md:top-16"
      >
        {assessment.needs.map((need) => {
          const Icon = NEED_ICONS[need.threat.id];
          const meta = NEED_STATUS_META[need.status];
          return (
            <div
              key={need.threat.id}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-0.5 py-2 ring-1 ring-inset transition-colors duration-300",
                need.status === "protected" && "bg-ok-soft ring-ok/20",
                need.status === "at-risk" && "bg-warn-soft ring-warn/30",
                need.status === "unprotected" && "bg-danger-soft ring-danger/30",
                need.status === "unmapped" && "bg-muted/60 ring-border/60"
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "h-4 w-4",
                    need.status === "protected" && "text-ok",
                    need.status === "at-risk" && "text-warn",
                    need.status === "unprotected" && "text-danger",
                    need.status === "unmapped" && "text-muted-foreground"
                  )}
                  aria-hidden="true"
                />
              )}
              <span className="text-[10px] font-semibold leading-none tracking-tight">
                {need.threat.label}
              </span>
              <span
                className={cn("h-1.5 w-1.5 rounded-full", meta.dot)}
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
            const Icon = NEED_ICONS[need.threat.id];
            return (
              <div
                key={need.threat.id}
                className={cn(
                  "rounded-2xl p-4 text-sm shadow-soft ring-1 ring-inset",
                  need.status === "unprotected"
                    ? "bg-danger-soft ring-danger/30"
                    : "bg-warn-soft ring-warn/30"
                )}
              >
                <p className="flex items-center gap-2 font-semibold">
                  {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                  {need.threat.label}:{" "}
                  {need.status === "unprotected"
                    ? "no working protection"
                    : "at risk"}
                </p>
                {downProtectors.map((protector) => (
                  <p key={protector.entity.id} className="mt-1.5 text-foreground/80">
                    {protector.entity.name} is down
                    {protector.supplyNotes.length > 0 &&
                      ` — ${protector.supplyNotes.join("; ")}`}
                    .
                  </p>
                ))}
                {need.workingProtectors.length > 0 ? (
                  <p className="mt-1.5 flex items-center gap-1.5 font-semibold text-ok">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Still working:{" "}
                    {need.workingProtectors
                      .map((protector) => protector.entity.name)
                      .join(", ")}
                  </p>
                ) : (
                  need.status === "unprotected" && (
                    <p className="mt-1.5 text-foreground/80">
                      No backup is mapped for this. Deal with it first, and add a
                      backup from Home when you can.
                    </p>
                  )
                )}
              </div>
            );
          })}
        </section>
      )}

      {failingNeeds.length === 0 && reportedProblems.length === 0 && (
        <p className="flex items-center gap-2 rounded-2xl bg-ok-soft p-4 text-sm font-medium text-ok ring-1 ring-inset ring-ok/20">
          <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
          Nothing is reported as down. If something just failed, find it below
          and tap “Down”.
        </p>
      )}

      {/* Report list */}
      <section className="space-y-2.5" aria-label="Report what is down">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
            Your infrastructure
          </h2>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="pressable rounded-full"
              disabled={!revisions.length}
              onClick={() => {
                const undone = undo();
                if (undone) show(`Undid: ${undone}`);
              }}
            >
              <Undo2 className="mr-1 h-4 w-4" aria-hidden="true" /> Undo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="pressable rounded-full"
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
              <li
                key={entity.id}
                className="rounded-2xl bg-card p-3.5 shadow-soft ring-1 ring-inset ring-border/60"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 px-0.5">
                  <span className="font-semibold">{entity.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {entity.layer}
                  </span>
                  {affected.length > 0 && (
                    <span className="text-xs text-muted-foreground/80">
                      · {affected
                        .map((needId) => THREAT_LABELS.get(needId) ?? needId)
                        .join(", ")
                        .toLowerCase()}
                    </span>
                  )}
                </div>
                <div
                  role="group"
                  aria-label={`Status of ${entity.name}`}
                  className="mt-2.5 grid grid-cols-3 gap-1 rounded-xl bg-muted/70 p-1"
                >
                  {REPORT_OPTIONS.map((option) => {
                    const selected =
                      entity.status === option.status ||
                      (option.status === "normal" && entity.status === "new");
                    return (
                      <button
                        key={option.status}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => report(entity.id, option.status)}
                        className={cn(
                          "pressable min-h-10 rounded-lg text-sm font-semibold transition-colors duration-200",
                          selected
                            ? option.active
                            : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
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
        {infrastructure.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Your map has no infrastructure yet. Start on the{" "}
            <Link href="/" className="font-medium underline">
              Home
            </Link>{" "}
            tab and add what protects you.
          </p>
        )}
      </section>

      <Snackbar message={snackbar} visible={visible} />
    </div>
  );
}

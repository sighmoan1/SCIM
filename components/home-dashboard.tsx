"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  CircleAlert,
  Grid3x3,
  Layers,
  Map as MapIcon,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ENTITY_STATUS_META,
  NEED_ICONS,
  NeedStatusPill,
} from "@/components/need-status";
import { ResilienceRing } from "@/components/resilience-ring";
import { Snackbar, useSnackbar } from "@/components/snackbar";
import { useScimWorkspace } from "@/components/use-scim-workspace";
import { addProtection, PROTECTION_SUGGESTIONS } from "@/lib/scim/guided";
import {
  assessAllTiers,
  assessDocument,
  NEED_FAMILIES,
  type NeedAssessment,
} from "@/lib/scim/needs";
import { cn } from "@/lib/utils";

function summariseProtectors(need: NeedAssessment): string {
  if (!need.protectors.length) return "Not mapped yet";
  return need.protectors.map((protector) => protector.entity.name).join(" · ");
}

function heroMessage(counts: {
  protected: number;
  atRisk: number;
  unprotected: number;
  unmapped: number;
}): string {
  if (counts.unprotected > 0)
    return "Part of your safety net is down. Open Emergency now.";
  if (counts.atRisk > 0)
    return "Something is struggling, but at least one protection still works.";
  if (counts.unmapped > 0)
    return "Map the remaining needs so failures do not surprise you.";
  return "All six immediate needs are covered and working.";
}

function NeedCard({
  need,
  open,
  onToggle,
  onAdd,
}: {
  need: NeedAssessment;
  open: boolean;
  onToggle: () => void;
  onAdd: (input: {
    name: string;
    kind: string;
    layer: string;
    dependsOn?: { name: string; kind: string; layer: string };
  }) => void;
}) {
  const [customName, setCustomName] = useState("");
  const Icon = NEED_ICONS[need.threat.id] ?? CircleAlert;
  const suggestions = PROTECTION_SUGGESTIONS[need.threat.id] ?? [];
  const existingNames = new Set(
    need.protectors.map((protector) => protector.entity.name.toLowerCase())
  );

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[1.4rem] bg-card shadow-soft ring-1 ring-inset ring-border/60",
        need.status === "unprotected" && "ring-danger/45",
        need.status === "at-risk" && "ring-warn/45"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="pressable flex min-h-[4.75rem] w-full items-center gap-3 p-4 text-left"
      >
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            need.status === "unprotected"
              ? "bg-danger-soft text-danger"
              : need.status === "at-risk"
                ? "bg-warn-soft text-warn"
                : "bg-secondary text-primary"
          )}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-base font-bold">{need.threat.label}</span>
            <NeedStatusPill status={need.status} />
          </span>
          <span className="mt-1 block truncate text-sm text-muted-foreground">
            {summariseProtectors(need)}
          </span>
        </span>

        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-border/60 px-4 pb-4 pt-4">
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">
                {need.threat.question}
              </strong>{" "}
              {need.threat.hint}
            </p>

            {need.protectors.length > 0 && (
              <ul className="space-y-2">
                {need.protectors.map((protector) => {
                  const meta =
                    ENTITY_STATUS_META[protector.effectiveStatus] ??
                    ENTITY_STATUS_META.normal;
                  return (
                    <li
                      key={protector.entity.id}
                      className="rounded-2xl bg-muted/55 px-3.5 py-3"
                    >
                      <div className="flex items-center gap-2.5 text-sm">
                        <span
                          className={cn("h-2.5 w-2.5 rounded-full", meta.dot)}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 font-semibold">
                          {protector.entity.name}
                        </span>
                        <span className={cn("text-xs font-semibold", meta.text)}>
                          {meta.label}
                        </span>
                      </div>
                      {protector.supplyNotes.length > 0 && (
                        <p className="mt-1.5 pl-5 text-xs leading-relaxed text-warn">
                          {protector.supplyNotes.join("; ")}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {need.status === "unprotected" && (
              <p className="rounded-2xl bg-danger-soft px-3.5 py-3 text-sm leading-relaxed text-danger">
                Everything currently protecting this need is down. Add a backup or
                open Emergency to trace the cause.
              </p>
            )}

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Add protection
              </p>
              <div className="grid gap-2 min-[420px]:grid-cols-2">
                {suggestions
                  .filter(
                    (suggestion) => !existingNames.has(suggestion.name.toLowerCase())
                  )
                  .map((suggestion) => (
                    <button
                      key={suggestion.name}
                      type="button"
                      onClick={() =>
                        onAdd({ ...suggestion, dependsOn: suggestion.dependsOn })
                      }
                      className="pressable flex min-h-11 items-center justify-start gap-2 rounded-xl bg-accent px-3.5 text-left text-sm font-semibold text-accent-foreground"
                    >
                      <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {suggestion.name}
                    </button>
                  ))}
              </div>

              <form
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!customName.trim()) return;
                  onAdd({
                    name: customName.trim(),
                    kind: "service",
                    layer: "household",
                  });
                  setCustomName("");
                }}
              >
                <Input
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder="Something else…"
                  className="h-12 rounded-xl text-base"
                  aria-label={`Add protection against ${need.threat.label}`}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  className="h-12 rounded-xl px-5 font-semibold"
                  disabled={!customName.trim()}
                >
                  Add
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function HomeSkeleton() {
  return (
    <div className="mobile-home-shell space-y-5" aria-hidden="true">
      <div className="mobile-hero-layout rounded-[1.75rem] bg-card p-4 shadow-soft">
        <div className="h-28 w-28 animate-pulse rounded-full bg-muted" />
        <div className="space-y-3">
          <div className="h-6 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="h-[76px] animate-pulse rounded-[1.4rem] bg-muted" />
      ))}
    </div>
  );
}

export function HomeDashboard() {
  const { document, hydrated, commit } = useScimWorkspace();
  const [openNeedId, setOpenNeedId] = useState("");
  const [showIntro, setShowIntro] = useState(false);
  const { snackbar, visible, show } = useSnackbar();

  const assessment = useMemo(() => assessDocument(document), [document]);
  const tierAssessment = useMemo(() => assessAllTiers(document), [document]);
  const { counts } = assessment;
  const anyFailure = counts.atRisk + counts.unprotected > 0;
  const higherTierTotals = tierAssessment.tiers
    .filter((tier) => tier.tier !== "individual")
    .reduce(
      (totals, tier) => ({
        mapped: totals.mapped + tier.needs.length - tier.counts.unmapped,
        total: totals.total + tier.needs.length,
      }),
      { mapped: 0, total: 0 }
    );

  const handleAdd = (
    needId: string,
    input: {
      name: string;
      kind: string;
      layer: string;
      dependsOn?: { name: string; kind: string; layer: string };
    }
  ) => {
    try {
      const result = addProtection(document, { needId, ...input });
      commit(result.document, `Add ${input.name}`);
      show(
        result.addedEntityNames.length
          ? `Added ${result.addedEntityNames.join(" and ")}`
          : `${input.name} now also protects this need`
      );
    } catch (error) {
      show(error instanceof Error ? error.message : "Could not add that.");
    }
  };

  if (!hydrated) return <HomeSkeleton />;

  return (
    <div className="mobile-home-shell rise-in space-y-5">
      <section className="rounded-[1.75rem] bg-card p-4 shadow-soft ring-1 ring-inset ring-border/60">
        <div className="mobile-hero-layout">
          <ResilienceRing needs={assessment.needs} size={112} />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Your resilience
            </p>
            <h1 className="mt-1 text-[1.35rem] font-bold leading-tight">
              What is keeping you alive?
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {heroMessage(counts)}
            </p>
            {anyFailure ? (
              <Link
                href="/emergency"
                className="mt-2 inline-flex min-h-10 items-center gap-1 text-sm font-bold text-danger"
              >
                Open Emergency <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <button
                type="button"
                className="mt-2 inline-flex min-h-10 items-center gap-1 text-sm font-bold text-primary"
                onClick={() => setShowIntro((current) => !current)}
              >
                How it works
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showIntro && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        </div>

        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-out",
            showIntro ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <div className="mt-4 space-y-2 rounded-2xl bg-muted/55 p-4 text-sm leading-relaxed text-muted-foreground">
              <p>1. Open a need below and add what protects it.</p>
              <p>2. When something fails, report it in Emergency.</p>
              <p>3. SCIM traces what else becomes vulnerable and which backups remain.</p>
            </div>
          </div>
        </div>
      </section>

      {NEED_FAMILIES.map((family) => {
        const familyNeeds = assessment.needs.filter(
          (need) => need.threat.family === family.id
        );
        return (
          <section key={family.id} className="space-y-2.5">
            <div className="flex items-baseline justify-between gap-3 px-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {family.label}
              </h2>
              <span className="text-xs text-muted-foreground/75">
                {family.summary}
              </span>
            </div>
            <div className="grid desktop-grid-2 items-start gap-3">
              {familyNeeds.map((need) => (
                <NeedCard
                  key={need.threat.id}
                  need={need}
                  open={openNeedId === need.threat.id}
                  onToggle={() =>
                    setOpenNeedId((current) =>
                      current === need.threat.id ? "" : need.threat.id
                    )
                  }
                  onAdd={(input) => handleAdd(need.threat.id, input)}
                />
              ))}
            </div>
          </section>
        );
      })}

      <section className="rounded-[1.5rem] bg-card p-4 shadow-soft ring-1 ring-inset ring-border/60">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Layers className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-bold">Build the wider system</h2>
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                {higherTierTotals.mapped}/{higherTierTotals.total}
              </span>
            </div>
            <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
              Add the groups, organisations and public systems that keep a community functioning.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Button asChild className="min-h-12 rounded-xl px-3 font-semibold">
            <Link href="/build">
              <Layers className="mr-2 h-4 w-4" aria-hidden="true" />
              Add systems
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="min-h-12 rounded-xl px-3 font-semibold"
          >
            <Link href="/matrix">
              <Grid3x3 className="mr-2 h-4 w-4" aria-hidden="true" />
              Matrix
            </Link>
          </Button>
        </div>
      </section>

      <section className="mobile-sticky-actions grid grid-cols-2 gap-2.5">
        <Button
          asChild
          size="lg"
          className="pressable min-h-14 rounded-2xl bg-danger px-3 text-sm font-bold text-white shadow-soft hover:bg-danger/90"
        >
          <Link href="/emergency">
            <CircleAlert className="mr-2 h-5 w-5" aria-hidden="true" />
            Report failure
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="pressable min-h-14 rounded-2xl bg-card px-3 text-sm font-bold shadow-soft"
        >
          <Link href="/map">
            <MapIcon className="mr-2 h-5 w-5" aria-hidden="true" />
            Open map
          </Link>
        </Button>
      </section>

      <Snackbar message={snackbar} visible={visible} />
    </div>
  );
}

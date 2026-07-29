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
  if (!need.protectors.length) return "Tap to add what protects you";
  return need.protectors.map((protector) => protector.entity.name).join(" · ");
}

function heroMessage(counts: {
  protected: number;
  atRisk: number;
  unprotected: number;
  unmapped: number;
}): string {
  if (counts.unprotected > 0)
    return "Part of your safety net is down. Check Emergency for what to do.";
  if (counts.atRisk > 0)
    return "Something you rely on is struggling. Your backups are holding.";
  if (counts.unmapped > 0)
    return "Good start. Map the rest so nothing surprises you.";
  return "All six needs are covered and everything is working.";
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
    <div
      className={cn(
        "rounded-2xl bg-card shadow-soft ring-1 ring-inset ring-border/60 transition-shadow",
        open && "shadow-md",
        need.status === "unprotected" && "ring-danger/40",
        need.status === "at-risk" && "ring-warn/40"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="pressable flex w-full items-center gap-3.5 rounded-2xl p-4 text-left"
      >
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            need.status === "unprotected"
              ? "bg-danger-soft text-danger"
              : need.status === "at-risk"
                ? "bg-warn-soft text-warn"
                : "bg-secondary text-primary"
          )}
        >
          <Icon className="h-[1.4rem] w-[1.4rem]" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-semibold">{need.threat.label}</span>
            <NeedStatusPill status={need.status} />
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
            {summariseProtectors(need)}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground/70 transition-transform duration-300",
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
          <div className="space-y-4 px-4 pb-4 pt-1">
            <p className="text-sm text-muted-foreground">
              {need.threat.question}{" "}
              <span className="text-muted-foreground/70">{need.threat.hint}</span>
            </p>

            {need.protectors.length > 0 && (
              <ul className="space-y-1.5">
                {need.protectors.map((protector) => {
                  const meta =
                    ENTITY_STATUS_META[protector.effectiveStatus] ??
                    ENTITY_STATUS_META.normal;
                  return (
                    <li
                      key={protector.entity.id}
                      className="rounded-xl bg-muted/50 px-3 py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn("h-2 w-2 rounded-full", meta.dot)}
                          aria-hidden="true"
                        />
                        <span className="font-medium">{protector.entity.name}</span>
                        <span className={cn("text-xs font-medium", meta.text)}>
                          {meta.label}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground/80">
                          {protector.entity.layer}
                        </span>
                      </div>
                      {protector.supplyNotes.length > 0 && (
                        <p className="mt-1 pl-[1.15rem] text-xs text-warn">
                          {protector.supplyNotes.join("; ")}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {need.status === "at-risk" && need.workingProtectors.length > 0 && (
              <p className="rounded-xl bg-ok-soft px-3 py-2.5 text-sm font-medium text-ok">
                Still working:{" "}
                {need.workingProtectors
                  .map((protector) => protector.entity.name)
                  .join(", ")}
              </p>
            )}
            {need.status === "unprotected" && (
              <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-sm text-danger">
                Everything protecting you from this is down. Add a backup below,
                or open Emergency to see what caused it.
              </p>
            )}

            <div className="space-y-2.5">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Add protection
              </p>
              <div className="flex flex-wrap gap-2">
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
                      className="pressable inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-sm font-medium text-accent-foreground hover:bg-accent/80"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      {suggestion.name}
                    </button>
                  ))}
              </div>
              <form
                className="flex gap-2"
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
                  className="h-10 rounded-xl"
                  aria-label={`Add your own protection against ${need.threat.label}`}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  className="h-10 rounded-xl"
                  disabled={!customName.trim()}
                >
                  Add
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6" aria-hidden="true">
      <div className="flex items-center gap-6 rounded-3xl bg-card p-6 shadow-soft ring-1 ring-inset ring-border/60">
        <div className="h-[168px] w-[168px] shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-3/4 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
      {[0, 1, 2].map((group) => (
        <div key={group} className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="h-[76px] animate-pulse rounded-2xl bg-muted" />
            <div className="h-[76px] animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeDashboard() {
  const { document, hydrated, commit } = useScimWorkspace();
  const [openNeedId, setOpenNeedId] = useState<string>("");
  const [showIntro, setShowIntro] = useState(false);
  const { snackbar, visible, show } = useSnackbar();

  const assessment = useMemo(() => assessDocument(document), [document]);
  const tierAssessment = useMemo(() => assessAllTiers(document), [document]);
  const { counts } = assessment;
  const anyFailure = counts.atRisk + counts.unprotected > 0;

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
          : `${input.name} now also protects you here`
      );
    } catch (error) {
      show(error instanceof Error ? error.message : "Could not add that.");
    }
  };

  if (!hydrated) return <HomeSkeleton />;

  return (
    <div className="rise-in mx-auto max-w-3xl space-y-7 px-4 py-6">
      {/* Hero */}
      <section className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-inset ring-border/60">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:gap-7 sm:text-left">
          <ResilienceRing needs={assessment.needs} />
          <div className="min-w-0 space-y-2">
            <h1 className="text-[1.6rem] font-bold leading-tight">
              What is keeping you alive?
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {heroMessage(counts)}
            </p>
            {anyFailure ? (
              <Link
                href="/emergency"
                className="inline-flex items-center gap-1 text-sm font-semibold text-danger"
              >
                Open Emergency <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                onClick={() => setShowIntro((current) => !current)}
              >
                How does this work?
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
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
            <ol className="mt-4 list-decimal space-y-1.5 rounded-2xl bg-muted/50 p-4 pl-9 text-left text-sm text-muted-foreground">
              <li>
                In a crisis, six things kill people: heat, cold, hunger, thirst,
                illness and injury. Each card below is one of them — tap it and
                add the things you actually rely on.
              </li>
              <li>
                When something breaks in real life, open{" "}
                <Link href="/emergency" className="font-medium text-foreground underline">
                  Emergency
                </Link>{" "}
                and mark it down. The app works out what else is at risk and
                which backups still work.
              </li>
              <li>
                The{" "}
                <Link href="/map" className="font-medium text-foreground underline">
                  Map
                </Link>{" "}
                shows the classic SCIM picture — you at the centre, your
                infrastructure in rings. Everything stays on this device.
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Needs by family */}
      {NEED_FAMILIES.map((family) => {
        const familyNeeds = assessment.needs.filter(
          (need) => need.threat.family === family.id
        );
        return (
          <section key={family.id} className="space-y-2.5">
            <div className="flex items-baseline gap-2 px-1">
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                {family.label}
              </h2>
              <span className="text-xs text-muted-foreground/70">
                {family.summary}
              </span>
            </div>
            <div className="grid items-start gap-2.5 sm:grid-cols-2">
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

      {/* The four tiers of cooperation */}
      <section className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-2 px-1">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
              The four tiers
            </h2>
            <span className="text-xs text-muted-foreground/70">
              SCIM maps more than one person
            </span>
          </div>
          <Link
            href="/matrix"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            <Grid3x3 className="h-3.5 w-3.5" aria-hidden="true" />
            Matrix
          </Link>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {tierAssessment.tiers.map((tier) => {
            const total = tier.needs.length;
            const covered = total - tier.counts.unmapped;
            const alert = tier.counts.atRisk + tier.counts.unprotected;
            return (
              <Link
                key={tier.tier}
                href="/matrix"
                className="pressable flex items-start gap-3 rounded-2xl bg-card p-4 shadow-soft ring-1 ring-inset ring-border/60"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Layers className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">{tier.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {covered}/{total} mapped
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted-foreground">
                    {tier.summary}
                  </span>
                  {alert > 0 && (
                    <span className="mt-1 inline-block text-xs font-medium text-warn">
                      {alert} need{alert === 1 ? "" : "s"} need attention
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Primary actions */}
      <section className="grid gap-2.5 sm:grid-cols-2">
        <Button
          asChild
          size="lg"
          className="pressable h-13 min-h-[3.25rem] rounded-2xl bg-danger text-base font-semibold text-white shadow-soft hover:bg-danger/90"
        >
          <Link href="/emergency">
            <CircleAlert className="mr-2 h-5 w-5" aria-hidden="true" />
            Something just failed
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="pressable h-13 min-h-[3.25rem] rounded-2xl bg-card text-base font-semibold shadow-soft"
        >
          <Link href="/map">
            <MapIcon className="mr-2 h-5 w-5" aria-hidden="true" />
            See the full map
          </Link>
        </Button>
      </section>

      <Snackbar message={snackbar} visible={visible} />
    </div>
  );
}

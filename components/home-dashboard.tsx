"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, CircleAlert, Map as MapIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ENTITY_STATUS_META,
  NEED_ICONS,
  NeedStatusPill,
} from "@/components/need-status";
import { useScimWorkspace } from "@/components/use-scim-workspace";
import { addProtection, PROTECTION_SUGGESTIONS } from "@/lib/scim/guided";
import {
  assessDocument,
  NEED_FAMILIES,
  type NeedAssessment,
} from "@/lib/scim/needs";
import { cn } from "@/lib/utils";

function summariseProtectors(need: NeedAssessment): string {
  if (!need.protectors.length) return "Nothing mapped for this yet.";
  return need.protectors.map((protector) => protector.entity.name).join(", ");
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
        "rounded-xl border bg-card shadow-sm transition-colors",
        need.status === "unprotected" && "border-red-300",
        need.status === "at-risk" && "border-amber-300"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <Icon className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-semibold">{need.threat.label}</span>
            <NeedStatusPill status={need.status} />
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted-foreground">
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

      {open && (
        <div className="space-y-4 border-t px-4 py-4">
          <p className="text-sm text-muted-foreground">
            {need.threat.question}{" "}
            <span className="text-muted-foreground/80">{need.threat.hint}</span>
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
                    className="rounded-lg border bg-background p-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn("h-2.5 w-2.5 rounded-full", meta.dot)}
                        aria-hidden="true"
                      />
                      <span className="font-medium">{protector.entity.name}</span>
                      <span className={cn("text-xs", meta.text)}>{meta.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {protector.entity.layer}
                      </span>
                    </div>
                    {protector.supplyNotes.length > 0 && (
                      <p className="mt-1 pl-4 text-xs text-amber-800">
                        Depends on: {protector.supplyNotes.join("; ")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {need.status === "at-risk" && need.workingProtectors.length > 0 && (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              Still working:{" "}
              {need.workingProtectors
                .map((protector) => protector.entity.name)
                .join(", ")}
            </p>
          )}
          {need.status === "unprotected" && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-900">
              Everything protecting you from this is down. Add a backup below, or
              check the Emergency tab for what caused it.
            </p>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Add something that protects you</p>
            <div className="flex flex-wrap gap-2">
              {suggestions
                .filter((suggestion) => !existingNames.has(suggestion.name.toLowerCase()))
                .map((suggestion) => (
                  <Button
                    key={suggestion.name}
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-full"
                    onClick={() =>
                      onAdd({ ...suggestion, dependsOn: suggestion.dependsOn })
                    }
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                    {suggestion.name}
                  </Button>
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
                aria-label={`Add your own protection against ${need.threat.label}`}
              />
              <Button type="submit" variant="secondary" disabled={!customName.trim()}>
                Add
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function HomeDashboard() {
  const { document, hydrated, commit } = useScimWorkspace();
  const [openNeedId, setOpenNeedId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [showIntro, setShowIntro] = useState(false);

  const assessment = useMemo(() => assessDocument(document), [document]);
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
      setMessage(
        result.addedEntityNames.length
          ? `Added ${result.addedEntityNames.join(" and ")} to your map.`
          : `${input.name} now also protects you here.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add that.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          What is keeping you alive?
        </h1>
        <p className="text-sm text-muted-foreground">
          In a crisis, six things kill people: heat, cold, hunger, thirst,
          illness and injury. This map shows what protects you from each one —
          and what happens when something fails.
        </p>
        <button
          type="button"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          onClick={() => setShowIntro((current) => !current)}
        >
          {showIntro ? "Hide how this works" : "How does this work?"}
        </button>
        {showIntro && (
          <ol className="list-decimal space-y-1 rounded-lg border bg-muted/30 p-4 pl-8 text-sm">
            <li>
              Below are your six needs. Tap one to see what protects it and add
              the things you actually rely on.
            </li>
            <li>
              When something breaks in real life, open{" "}
              <Link href="/emergency" className="font-medium underline">
                Emergency
              </Link>{" "}
              and mark it as down. The app works out what else that puts at
              risk, and which of your backups still work.
            </li>
            <li>
              The{" "}
              <Link href="/map" className="font-medium underline">
                Map
              </Link>{" "}
              tab shows the classic SCIM picture: you in the centre, your
              infrastructure in rings, the six dangers around the edge.
              Everything is saved on this device only.
            </li>
          </ol>
        )}
      </section>

      {hydrated && (
        <section
          className={cn(
            "rounded-xl border p-4",
            anyFailure ? "border-amber-300 bg-amber-50" : "bg-muted/30"
          )}
        >
          <p className="text-sm font-medium">
            {counts.protected} of 6 needs protected
            {counts.atRisk > 0 && ` · ${counts.atRisk} at risk`}
            {counts.unprotected > 0 && ` · ${counts.unprotected} unprotected`}
            {counts.unmapped > 0 && ` · ${counts.unmapped} not mapped yet`}
          </p>
          {anyFailure && (
            <p className="mt-1 text-sm text-amber-900">
              Something in your map is down or struggling. Open{" "}
              <Link href="/emergency" className="font-semibold underline">
                Emergency
              </Link>{" "}
              to see the details.
            </p>
          )}
        </section>
      )}

      {NEED_FAMILIES.map((family) => {
        const familyNeeds = assessment.needs.filter(
          (need) => need.threat.family === family.id
        );
        return (
          <section key={family.id} className="space-y-2">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {family.label}
              </h2>
              <span className="text-xs text-muted-foreground/80">
                {family.summary}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
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

      <section className="grid gap-2 sm:grid-cols-2">
        <Button asChild size="lg" variant="destructive" className="h-12">
          <Link href="/emergency">
            <CircleAlert className="mr-2 h-5 w-5" aria-hidden="true" />
            Something just failed
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12">
          <Link href="/map">
            <MapIcon className="mr-2 h-5 w-5" aria-hidden="true" />
            See the full map
          </Link>
        </Button>
      </section>

      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Snackbar, useSnackbar } from "@/components/snackbar";
import { useScimWorkspace } from "@/components/use-scim-workspace";
import { addNeedProvider } from "@/lib/scim/guided-tier";
import { LAYERS, needsForTier, TIERS, type TierId } from "@/lib/scim/tiers";

const HIGHER_TIERS = TIERS.filter((tier) => tier.id !== "individual");

export function GuidedTierBuilder() {
  const params = useSearchParams();
  const requestedTier = params.get("tier");
  const initialTier: TierId = HIGHER_TIERS.some(
    (tier) => tier.id === requestedTier
  )
    ? (requestedTier as TierId)
    : "group";
  const { document, hydrated, commit } = useScimWorkspace();
  const [tierId, setTierId] = useState<TierId>(initialTier);
  const needs = useMemo(() => needsForTier(tierId), [tierId]);
  const [needId, setNeedId] = useState(needs[0]?.id ?? "communications");
  const [name, setName] = useState("");
  const [kind, setKind] = useState("service");
  const [layer, setLayer] = useState("municipality");
  const { snackbar, visible, show } = useSnackbar();
  const selectedNeed = needs.find((need) => need.id === needId) ?? needs[0];

  if (!hydrated) {
    return <div className="mx-auto max-w-2xl px-4 py-6">Loading workspace…</div>;
  }

  return (
    <div className="rise-in mx-auto max-w-2xl space-y-5 px-4 py-6">
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-full">
          <Link href="/matrix">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Matrix
          </Link>
        </Button>
        <h1 className="text-[1.6rem] font-bold">Build the wider system</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Add what enables a group, organisation or state to function. Each
          addition becomes canonical SCIM structure and appears in Matrix and Map.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl bg-card p-5 shadow-soft ring-1 ring-inset ring-border/60">
        <label className="block space-y-1.5 text-sm font-medium">
          Tier
          <select
            value={tierId}
            onChange={(event) => {
              const next = event.target.value as TierId;
              setTierId(next);
              setNeedId(needsForTier(next)[0]?.id ?? "");
            }}
            className="h-11 w-full rounded-xl border bg-background px-3"
          >
            {HIGHER_TIERS.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5 text-sm font-medium">
          Need
          <select
            value={selectedNeed?.id}
            onChange={(event) => setNeedId(event.target.value)}
            className="h-11 w-full rounded-xl border bg-background px-3"
          >
            {needs.map((need) => (
              <option key={need.id} value={need.id}>
                {need.label}
              </option>
            ))}
          </select>
        </label>

        {selectedNeed && (
          <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
            <strong className="text-foreground">{selectedNeed.question}</strong>
            <br />
            {selectedNeed.hint}
          </p>
        )}

        <label className="block space-y-1.5 text-sm font-medium">
          What meets this need?
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. neighbourhood radio network"
            className="h-11 rounded-xl"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm font-medium">
            Kind
            <Input
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              className="h-11 rounded-xl"
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Layer of provision
            <select
              value={layer}
              onChange={(event) => setLayer(event.target.value)}
              className="h-11 w-full rounded-xl border bg-background px-3"
            >
              {LAYERS.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Button
          className="min-h-11 w-full rounded-xl"
          disabled={!name.trim() || !selectedNeed}
          onClick={() => {
            if (!selectedNeed) return;
            try {
              const next = addNeedProvider(document, {
                needId: selectedNeed.id,
                name,
                kind,
                layer,
              });
              commit(next, `Add ${name.trim()} for ${selectedNeed.label}`);
              show(`Added ${name.trim()} to ${selectedNeed.label}`);
              setName("");
            } catch (error) {
              show(
                error instanceof Error
                  ? error.message
                  : "Could not add that provider."
              );
            }
          }}
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add to the shared model
        </Button>
      </section>

      <div className="flex gap-2">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/matrix">See Matrix</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/map">See Map</Link>
        </Button>
      </div>
      <Snackbar message={snackbar} visible={visible} />
    </div>
  );
}

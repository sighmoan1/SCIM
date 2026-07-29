"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Map as MapIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InamMatrix } from "@/components/inam-matrix";
import { useScimWorkspace } from "@/components/use-scim-workspace";
import { mappedTierIds } from "@/lib/scim/needs";

function MatrixSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6" aria-hidden="true">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="h-[60vh] animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

export function MatrixWorkspace() {
  const { document, hydrated } = useScimWorkspace();
  const tiersPresent = useMemo(() => mappedTierIds(document), [document]);

  if (!hydrated) return <MatrixSkeleton />;

  return (
    <div className="rise-in mx-auto max-w-6xl space-y-4 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-[1.6rem] font-bold leading-tight">Needs matrix</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The INAM matrix from <em>Dealing in Security</em>: every vital need as a
          row and layers of provision as columns. Solid entries meet the need
          directly; faded entries are traced upstream dependencies.
        </p>
      </header>

      {tiersPresent.size <= 1 && (
        <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          This map currently describes mostly the individual tier. Use the{" "}
          <Link href="/build" className="font-medium underline">
            guided builder
          </Link>{" "}
          to add group, organisation and nation-state providers.
        </p>
      )}

      <InamMatrix document={document} />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="pressable rounded-xl">
          <Link href="/build">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Build the wider system
          </Link>
        </Button>
        <Button asChild variant="outline" className="pressable rounded-xl">
          <Link href="/map">
            <MapIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            See the radial map
          </Link>
        </Button>
      </div>
    </div>
  );
}

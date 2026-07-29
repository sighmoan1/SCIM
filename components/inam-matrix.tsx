"use client";

import { useMemo } from "react";
import { buildInamMatrix, type InamCellEntity } from "@/lib/scim/inam";
import { layerLabel } from "@/lib/scim/tiers";
import type { ScimDocument } from "@/lib/scim/schema";
import { NEED_STATUS_META } from "@/components/need-status";
import { cn } from "@/lib/utils";

function statusDot(status: InamCellEntity["effectiveStatus"]): string {
  switch (status) {
    case "failed":
      return "bg-danger";
    case "degraded":
      return "bg-warn";
    default:
      return "bg-ok";
  }
}

/**
 * The canonical INAM matrix: needs (rows, grouped by tier) x layers of
 * provision (columns). Reads horizontally — where does each vital need come
 * from, and at what level — complementing the radial map's centre-out reading.
 */
export function InamMatrix({ document }: { document: ScimDocument }) {
  const matrix = useMemo(() => buildInamMatrix(document), [document]);
  const columnCount = matrix.layers.length;

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-10 border-b bg-card p-3 text-left align-bottom"
            >
              <span className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                Need
              </span>
            </th>
            {matrix.layers.map((layer) => (
              <th
                key={layer.id}
                scope="col"
                className="border-b border-l bg-card p-3 text-left align-bottom"
              >
                <span className="text-xs font-semibold text-muted-foreground">
                  {layer.label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.groups.map((group) => (
            <FragmentGroup
              key={group.tier}
              label={group.label}
              columnCount={columnCount}
              rows={group.rows}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FragmentGroup({
  label,
  columnCount,
  rows,
}: {
  label: string;
  columnCount: number;
  rows: ReturnType<typeof buildInamMatrix>["groups"][number]["rows"];
}) {
  return (
    <>
      <tr>
        <th
          scope="colgroup"
          colSpan={columnCount + 1}
          className="sticky left-0 bg-muted/60 px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
        >
          {label}
        </th>
      </tr>
      {rows.map((row) => {
        const meta = NEED_STATUS_META[row.status];
        return (
          <tr key={row.need.id} className="align-top">
            <th
              scope="row"
              className="sticky left-0 z-10 border-b bg-card p-3 text-left"
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)}
                  aria-hidden="true"
                />
                <span className="font-medium">{row.need.label}</span>
              </span>
            </th>
            {row.cells.map((cell) => (
              <td
                key={cell.layerId}
                className="border-b border-l p-2 align-top"
              >
                <div className="flex flex-col gap-1">
                  {cell.entities.map((entity) => (
                    <span
                      key={entity.id}
                      title={`${entity.name} — ${layerLabel(cell.layerId)} (${entity.effectiveStatus})`}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs",
                        entity.effectiveStatus === "failed"
                          ? "bg-danger-soft text-danger"
                          : entity.effectiveStatus === "degraded"
                            ? "bg-warn-soft text-warn"
                            : "bg-muted/60 text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          statusDot(entity.effectiveStatus)
                        )}
                        aria-hidden="true"
                      />
                      {entity.name}
                    </span>
                  ))}
                </div>
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}

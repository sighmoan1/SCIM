"use client";

import { useMemo } from "react";
import { buildInamMatrix, type InamCellEntity } from "@/lib/scim/inam";
import { layerLabel } from "@/lib/scim/tiers";
import type { ScimDocument } from "@/lib/scim/schema";
import { NEED_STATUS_META } from "@/components/need-status";
import { cn } from "@/lib/utils";

function statusDot(status: InamCellEntity["effectiveStatus"]): string {
  if (status === "failed") return "bg-danger";
  if (status === "degraded") return "bg-warn";
  return "bg-ok";
}

export function InamMatrix({ document }: { document: ScimDocument }) {
  const matrix = useMemo(() => buildInamMatrix(document), [document]);
  return (
    <div className="space-y-2">
      <p className="px-1 text-xs text-muted-foreground">
        Solid labels directly meet a need. <span className="opacity-70">↳ Faded labels are upstream dependencies.</span>
      </p>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-20 border-b bg-card p-3 text-left align-bottom">
                <span className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">Need</span>
              </th>
              {matrix.layers.map((layer) => (
                <th key={layer.id} scope="col" className="border-b border-l bg-card p-3 text-left align-bottom">
                  <span className="text-xs font-semibold text-muted-foreground">{layer.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.groups.map((group) => (
              <>
                <tr key={`${group.tier}-header`}>
                  <th scope="colgroup" colSpan={matrix.layers.length + 1} className="sticky left-0 bg-muted/60 px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {group.label}
                  </th>
                </tr>
                {group.rows.map((row) => {
                  const meta = NEED_STATUS_META[row.status];
                  return (
                    <tr key={row.need.id} className="align-top">
                      <th scope="row" className="sticky left-0 z-10 border-b bg-card p-3 text-left">
                        <span className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)} aria-hidden="true" />
                          <span className="font-medium">{row.need.label}</span>
                        </span>
                      </th>
                      {row.cells.map((cell) => (
                        <td key={cell.layerId} className="border-b border-l p-2 align-top">
                          <div className="flex flex-col gap-1">
                            {cell.entities.map((entity) => (
                              <span
                                key={entity.id}
                                title={`${entity.name} — ${layerLabel(cell.layerId)} (${entity.effectiveStatus}; ${entity.role === "direct" ? "direct provider" : `upstream dependency, ${entity.distance} step${entity.distance === 1 ? "" : "s"}`})`}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs",
                                  entity.role === "upstream" && "opacity-70",
                                  entity.effectiveStatus === "failed"
                                    ? "bg-danger-soft text-danger"
                                    : entity.effectiveStatus === "degraded"
                                      ? "bg-warn-soft text-warn"
                                      : "bg-muted/60 text-foreground"
                                )}
                              >
                                {entity.role === "upstream" && <span aria-hidden="true">↳</span>}
                                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDot(entity.effectiveStatus))} aria-hidden="true" />
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { NEED_STATUS_META } from "@/components/need-status";
import type { NeedAssessment } from "@/lib/scim/needs";

const SIZE = 168;
const STROKE = 13;
const RADIUS = (SIZE - STROKE) / 2;
const GAP_DEGREES = 7;
const SEGMENT_DEGREES = 60 - GAP_DEGREES;

function arcPath(startAngle: number, sweep: number): string {
  const start = ((startAngle - 90) * Math.PI) / 180;
  const end = ((startAngle + sweep - 90) * Math.PI) / 180;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const x1 = cx + RADIUS * Math.cos(start);
  const y1 = cy + RADIUS * Math.sin(start);
  const x2 = cx + RADIUS * Math.cos(end);
  const y2 = cy + RADIUS * Math.sin(end);
  return `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${sweep > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

/**
 * Six-segment status ring: one arc per need, mirroring the six sectors of the
 * SCIM radial map. Draws in on mount unless the user prefers reduced motion.
 */
export function ResilienceRing({ needs }: { needs: NeedAssessment[] }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const okCount = needs.filter((need) => need.status === "protected").length;
  const worst = needs.some((need) => need.status === "unprotected")
    ? "unprotected"
    : needs.some((need) => need.status === "at-risk")
      ? "at-risk"
      : needs.some((need) => need.status === "unmapped")
        ? "unmapped"
        : "protected";

  const arcLength = (SEGMENT_DEGREES / 360) * 2 * Math.PI * RADIUS;

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`${okCount} of 6 needs protected`}
      >
        {needs.map((need, index) => {
          const startAngle = index * 60 + GAP_DEGREES / 2;
          const meta = NEED_STATUS_META[need.status];
          return (
            <g key={need.threat.id}>
              <path
                d={arcPath(startAngle, SEGMENT_DEGREES)}
                fill="none"
                strokeWidth={STROKE}
                strokeLinecap="round"
                className="stroke-muted"
              />
              <path
                d={arcPath(startAngle, SEGMENT_DEGREES)}
                fill="none"
                strokeWidth={STROKE}
                strokeLinecap="round"
                stroke={meta.ring[0]}
                strokeDasharray={arcLength}
                strokeDashoffset={drawn ? 0 : arcLength}
                className="transition-[stroke-dashoffset] duration-700 ease-out [transition-delay:var(--delay)] dark:hidden"
                style={{ "--delay": `${index * 70}ms` } as React.CSSProperties}
              />
              <path
                d={arcPath(startAngle, SEGMENT_DEGREES)}
                fill="none"
                strokeWidth={STROKE}
                strokeLinecap="round"
                stroke={meta.ring[1]}
                strokeDasharray={arcLength}
                strokeDashoffset={drawn ? 0 : arcLength}
                className="hidden transition-[stroke-dashoffset] duration-700 ease-out [transition-delay:var(--delay)] dark:block"
                style={{ "--delay": `${index * 70}ms` } as React.CSSProperties}
              />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums tracking-tight">
          {okCount}
          <span className="text-xl font-semibold text-muted-foreground">/6</span>
        </span>
        <span
          className={`text-xs font-semibold ${
            worst === "protected"
              ? "text-ok"
              : worst === "at-risk"
                ? "text-warn"
                : worst === "unprotected"
                  ? "text-danger"
                  : "text-muted-foreground"
          }`}
        >
          {worst === "protected"
            ? "protected"
            : worst === "at-risk"
              ? "needs attention"
              : worst === "unprotected"
                ? "act now"
                : "keep mapping"}
        </span>
      </div>
    </div>
  );
}

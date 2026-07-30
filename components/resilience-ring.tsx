"use client";

import { useEffect, useState } from "react";
import { NEED_STATUS_META } from "@/components/need-status";
import type { NeedAssessment } from "@/lib/scim/needs";

const GAP_DEGREES = 7;
const SEGMENT_DEGREES = 60 - GAP_DEGREES;

function arcPath(
  startAngle: number,
  sweep: number,
  size: number,
  radius: number
): string {
  const start = ((startAngle - 90) * Math.PI) / 180;
  const end = ((startAngle + sweep - 90) * Math.PI) / 180;
  const cx = size / 2;
  const cy = size / 2;
  const x1 = cx + radius * Math.cos(start);
  const y1 = cy + radius * Math.sin(start);
  const x2 = cx + radius * Math.cos(end);
  const y2 = cy + radius * Math.sin(end);
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${sweep > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

export function ResilienceRing({
  needs,
  size = 168,
}: {
  needs: NeedAssessment[];
  size?: number;
}) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const stroke = Math.max(9, Math.round(size * 0.078));
  const radius = (size - stroke) / 2;
  const okCount = needs.filter((need) => need.status === "protected").length;
  const worst = needs.some((need) => need.status === "unprotected")
    ? "unprotected"
    : needs.some((need) => need.status === "at-risk")
      ? "at-risk"
      : needs.some((need) => need.status === "unmapped")
        ? "unmapped"
        : "protected";

  const arcLength = (SEGMENT_DEGREES / 360) * 2 * Math.PI * radius;
  const countClass = size <= 128 ? "text-3xl" : "text-4xl";
  const denominatorClass = size <= 128 ? "text-base" : "text-xl";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${okCount} of 6 needs protected`}
      >
        {needs.map((need, index) => {
          const startAngle = index * 60 + GAP_DEGREES / 2;
          const meta = NEED_STATUS_META[need.status];
          const path = arcPath(startAngle, SEGMENT_DEGREES, size, radius);
          return (
            <g key={need.threat.id}>
              <path
                d={path}
                fill="none"
                strokeWidth={stroke}
                strokeLinecap="round"
                className="stroke-muted"
              />
              <path
                d={path}
                fill="none"
                strokeWidth={stroke}
                strokeLinecap="round"
                stroke={meta.ring[0]}
                strokeDasharray={arcLength}
                strokeDashoffset={drawn ? 0 : arcLength}
                className="transition-[stroke-dashoffset] duration-700 ease-out [transition-delay:var(--delay)] dark:hidden"
                style={{ "--delay": `${index * 70}ms` } as React.CSSProperties}
              />
              <path
                d={path}
                fill="none"
                strokeWidth={stroke}
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
        <span className={`${countClass} font-bold tabular-nums tracking-tight`}>
          {okCount}
          <span className={`${denominatorClass} font-semibold text-muted-foreground`}>
            /6
          </span>
        </span>
        <span
          className={`text-[11px] font-semibold ${
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

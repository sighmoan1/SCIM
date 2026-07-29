import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleX,
  Droplets,
  HeartPulse,
  Snowflake,
  Soup,
  Sun,
  type LucideIcon,
  Bandage,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NeedStatus } from "@/lib/scim/needs";

export const NEED_ICONS: Record<string, LucideIcon> = {
  "too-hot": Sun,
  "too-cold": Snowflake,
  hunger: Soup,
  thirst: Droplets,
  illness: HeartPulse,
  injury: Bandage,
};

export const NEED_STATUS_META: Record<
  NeedStatus,
  { label: string; icon: LucideIcon; pill: string; dot: string }
> = {
  protected: {
    label: "Protected",
    icon: CircleCheck,
    pill: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  "at-risk": {
    label: "At risk",
    icon: CircleAlert,
    pill: "bg-amber-100 text-amber-900 border-amber-200",
    dot: "bg-amber-500",
  },
  unprotected: {
    label: "Unprotected",
    icon: CircleX,
    pill: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
  unmapped: {
    label: "Not mapped yet",
    icon: CircleHelp,
    pill: "bg-slate-100 text-slate-600 border-dashed border-slate-300",
    dot: "bg-slate-400",
  },
};

export function NeedStatusPill({
  status,
  className,
}: {
  status: NeedStatus;
  className?: string;
}) {
  const meta = NEED_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        meta.pill,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export const ENTITY_STATUS_META: Record<
  string,
  { label: string; dot: string; text: string }
> = {
  normal: { label: "working", dot: "bg-emerald-500", text: "text-emerald-700" },
  new: { label: "working", dot: "bg-emerald-500", text: "text-emerald-700" },
  degraded: { label: "struggling", dot: "bg-amber-500", text: "text-amber-700" },
  failed: { label: "down", dot: "bg-red-500", text: "text-red-700" },
};

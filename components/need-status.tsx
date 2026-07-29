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
  {
    label: string;
    icon: LucideIcon;
    pill: string;
    dot: string;
    /** Hex stroke for the resilience ring, [light, dark]. */
    ring: [string, string];
  }
> = {
  protected: {
    label: "Protected",
    icon: CircleCheck,
    pill: "bg-ok-soft text-ok",
    dot: "bg-ok",
    ring: ["#188a5b", "#4cc38a"],
  },
  "at-risk": {
    label: "At risk",
    icon: CircleAlert,
    pill: "bg-warn-soft text-warn",
    dot: "bg-warn",
    ring: ["#ba7b0b", "#f0b429"],
  },
  unprotected: {
    label: "Unprotected",
    icon: CircleX,
    pill: "bg-danger-soft text-danger",
    dot: "bg-danger",
    ring: ["#d3271c", "#ef6a60"],
  },
  unmapped: {
    label: "Not mapped",
    icon: CircleHelp,
    pill: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/40",
    ring: ["#c5cfcc", "#3a4442"],
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
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
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
  normal: { label: "working", dot: "bg-ok", text: "text-ok" },
  new: { label: "working", dot: "bg-ok", text: "text-ok" },
  degraded: { label: "struggling", dot: "bg-warn", text: "text-warn" },
  failed: { label: "down", dot: "bg-danger", text: "text-danger" },
};

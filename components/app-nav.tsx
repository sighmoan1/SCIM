"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleAlert,
  Grid3x3,
  House,
  Map as MapIcon,
  Menu,
} from "lucide-react";
import { ScimLogo } from "@/components/scim-logo";
import { cn } from "@/lib/utils";

const DESKTOP_NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/emergency", label: "Emergency" },
  { href: "/map", label: "Map" },
  { href: "/matrix", label: "Matrix" },
  { href: "/more", label: "More" },
];

const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/emergency", label: "Emergency", icon: CircleAlert },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/more", label: "More", icon: Menu },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <header className="desktop-only-nav sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <ScimLogo className="h-7 w-7 text-primary" />
            <span className="text-[17px] font-bold tracking-tight">SCIM</span>
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1">
            {DESKTOP_NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const emergency = item.href === "/emergency";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "pressable rounded-full px-4 py-2 text-sm font-medium",
                    active
                      ? emergency
                        ? "bg-danger-soft text-danger"
                        : "bg-secondary text-secondary-foreground"
                      : emergency
                        ? "text-danger hover:bg-danger-soft"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/matrix"
            className="ml-auto inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <Grid3x3 className="h-4 w-4" aria-hidden="true" />
            Analyse the system
          </Link>
        </div>
      </header>

      <nav
        aria-label="Primary navigation"
        className="mobile-only-nav fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-18px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      >
        <div className="mx-auto grid h-[4.5rem] max-w-lg grid-cols-4 px-2">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            const emergency = item.href === "/emergency";
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable group relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-xs font-semibold",
                  active
                    ? emergency
                      ? "text-danger"
                      : "text-primary"
                    : emergency
                      ? "text-danger/80"
                      : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 min-w-14 items-center justify-center rounded-full px-4 transition-colors duration-200",
                    active && (emergency ? "bg-danger-soft" : "bg-accent")
                  )}
                >
                  <Icon
                    className="h-6 w-6"
                    strokeWidth={active ? 2.5 : 2.1}
                    aria-hidden="true"
                  />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

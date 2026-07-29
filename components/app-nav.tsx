"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleAlert, House, Map as MapIcon, Menu } from "lucide-react";
import { ScimLogo } from "@/components/scim-logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/emergency", label: "Emergency", icon: CircleAlert },
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
      {/* Desktop and tablet: top bar */}
      <header className="sticky top-0 z-40 hidden border-b bg-background/85 backdrop-blur-md md:block">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <ScimLogo className="h-7 w-7 text-primary" />
            <span className="text-[17px] font-bold tracking-tight">SCIM</span>
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "pressable rounded-full px-4 py-2 text-sm font-medium",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    item.href === "/emergency" && !active && "text-danger hover:text-danger"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Phones: bottom tab bar, one thumb, always visible */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            const emergency = item.href === "/emergency";
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable group relative flex min-h-[3.75rem] flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  active
                    ? emergency
                      ? "text-danger"
                      : "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200",
                    active && (emergency ? "bg-danger-soft" : "bg-accent")
                  )}
                >
                  <Icon
                    className="h-[1.35rem] w-[1.35rem]"
                    strokeWidth={active ? 2.4 : 2}
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

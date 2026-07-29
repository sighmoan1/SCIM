"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Bot,
  ChevronRight,
  FileText,
  FlaskConical,
  History,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScimLogo } from "@/components/scim-logo";
import { Snackbar, useSnackbar } from "@/components/snackbar";
import { useScimWorkspace } from "@/components/use-scim-workspace";
import { createDefaultScimDocument } from "@/lib/scim/default-model";
import { serializeScimAiHandoff } from "@/lib/scim/handoff";
import { createPersonalStarterDocument } from "@/lib/scim/personal-starter";
import { serializeScimDsl } from "@/lib/scim/serializer";
import { SCIM_SCHEMA_VERSION } from "@/lib/scim/version";
import packageJson from "@/package.json";
import { cn } from "@/lib/utils";

function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
  return Promise.resolve();
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-inset ring-border/60">
      <h2 className="mb-3 text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-11 animate-pulse rounded-xl bg-muted" />;

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "Auto", icon: Monitor },
    { value: "dark", label: "Dark", icon: Moon },
  ];
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/70 p-1">
      {options.map((option) => {
        const Icon = option.icon;
        const selected = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => setTheme(option.value)}
            className={cn(
              "pressable flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const ADVANCED_TOOLS = [
  {
    href: "/editor",
    icon: FileText,
    title: "Model editor",
    description: "Author the whole map as text, validate and export it",
  },
  {
    href: "/review",
    icon: Bot,
    title: "Review proposals",
    description: "Accept or reject changes suggested by an AI or collaborator",
  },
  {
    href: "/legacy",
    icon: History,
    title: "Legacy mapper",
    description: "The original mapper, kept while its tools are migrated",
  },
];

export function MorePage() {
  const { document: scimDocument, commit } = useScimWorkspace();
  const { snackbar, visible, show } = useSnackbar();

  return (
    <div className="rise-in mx-auto max-w-3xl space-y-4 px-4 py-6">
      <section className="flex items-center gap-4 py-2">
        <ScimLogo className="h-12 w-12 text-primary" />
        <div>
          <h1 className="text-[1.6rem] font-bold leading-tight">SCIM</h1>
          <p className="text-sm text-muted-foreground">
            Simple Critical Infrastructure Mapper
          </p>
        </div>
      </section>

      <SectionCard title="Appearance">
        <ThemeSwitcher />
      </SectionCard>

      <SectionCard title="What is SCIM?">
        <div className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
          <p>
            SCIM is a way of understanding how infrastructure keeps you alive,
            developed by Vinay Gupta and Mike Bennett (
            <em>Dealing in Security</em>, 2010). There are six ways to die — too
            hot, too cold, hunger, thirst, illness and injury — and layers of
            infrastructure, from your household out to the whole world, that
            protect you from them.
          </p>
          <p>
            Mapping those protections and what they depend on shows you where
            you are vulnerable before a crisis, and what to prioritise during
            one. Your map is stored only in this browser, on this device.
            Nothing is uploaded unless you deliberately copy or download it.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Work with an AI">
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Copy a complete, text-only version of your map into any capable AI
          chat. Ask it to find missing dependencies or propose scenarios. When
          it returns an updated model, review it change by change — nothing is
          accepted without you.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            className="pressable rounded-xl"
            onClick={async () => {
              await copyText(serializeScimAiHandoff(scimDocument));
              show("Map copied for an AI conversation");
            }}
          >
            Copy map for AI
          </Button>
          <Button asChild variant="outline" className="pressable rounded-xl">
            <Link href="/review">Review a proposal</Link>
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Save and share">
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Your map is plain text in the portable SCIM format — save a backup or
          move it to another device or tool.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="pressable rounded-xl"
            onClick={async () => {
              await copyText(serializeScimDsl(scimDocument));
              show("SCIM source copied to the clipboard");
            }}
          >
            Copy SCIM source
          </Button>
          <Button
            variant="outline"
            className="pressable rounded-xl"
            onClick={() =>
              download(`${scimDocument.id}.scim`, serializeScimDsl(scimDocument))
            }
          >
            Download .scim file
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Advanced tools">
        <ul className="-mx-2 divide-y divide-border/60">
          {ADVANCED_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="pressable flex items-center gap-3.5 rounded-xl px-2 py-3 hover:bg-muted/60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{tool.title}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">
                      {tool.description}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-muted-foreground/60"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard title="Start over">
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Replace your current map with an example. Undo on the Emergency tab
          can reverse this.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="pressable rounded-xl"
            onClick={() => {
              commit(createPersonalStarterDocument(), "Reset to personal starter map");
              show("Reset to the personal starter map");
            }}
          >
            <FlaskConical className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Personal starter map
          </Button>
          <Button
            variant="outline"
            className="pressable rounded-xl"
            onClick={() => {
              commit(createDefaultScimDocument(), "Load hospital resilience example");
              show("Loaded the hospital resilience example");
            }}
          >
            <FlaskConical className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Hospital example
          </Button>
        </div>
      </SectionCard>

      <p className="px-1 pb-2 font-mono text-[11px] text-muted-foreground/80">
        SCIM Mapper v{packageJson.version} · Schema v{SCIM_SCHEMA_VERSION}
      </p>

      <Snackbar message={snackbar} visible={visible} />
    </div>
  );
}

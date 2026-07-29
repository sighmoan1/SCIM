"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScimWorkspace } from "@/components/use-scim-workspace";
import { createDefaultScimDocument } from "@/lib/scim/default-model";
import { serializeScimAiHandoff } from "@/lib/scim/handoff";
import { createPersonalStarterDocument } from "@/lib/scim/personal-starter";
import { serializeScimDsl } from "@/lib/scim/serializer";
import { SCIM_SCHEMA_VERSION } from "@/lib/scim/version";
import packageJson from "@/package.json";

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

export function MorePage() {
  const { document: scimDocument, commit } = useScimWorkspace();
  const [message, setMessage] = useState("");

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">About SCIM</h1>
        <p className="text-sm text-muted-foreground">
          SCIM — Simple Critical Infrastructure Maps — is a way of understanding
          how infrastructure keeps you alive, developed by Vinay Gupta and Mike
          Bennett (<em>Dealing in Security</em>, 2010). The idea: there are six
          ways to die — too hot, too cold, hunger, thirst, illness and injury —
          and layers of infrastructure, from your household out to the whole
          world, that protect you from them. Mapping those protections and what
          they depend on shows you where you are vulnerable before a crisis, and
          what to prioritise during one.
        </p>
        <p className="text-sm text-muted-foreground">
          Your map is stored only in this browser, on this device. Nothing is
          uploaded unless you deliberately copy or download it.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Work with an AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Copy a complete, text-only version of your map and paste it into any
            capable AI chat (Claude, ChatGPT, a local model…). Ask it to find
            missing dependencies, challenge your assumptions or propose a
            scenario. When it answers with a complete updated model, paste that
            into <Link className="font-medium underline" href="/review">Review</Link>{" "}
            — you approve or reject each change before anything is accepted.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                await copyText(serializeScimAiHandoff(scimDocument));
                setMessage("Map copied for an AI conversation.");
              }}
            >
              Copy map for AI
            </Button>
            <Button asChild variant="outline">
              <Link href="/review">Review a proposal</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Save and share</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Your map is plain text in the portable SCIM format. Save a copy as a
            backup, or move it to another device or tool.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await copyText(serializeScimDsl(scimDocument));
                setMessage("SCIM source copied to the clipboard.");
              }}
            >
              Copy SCIM source
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                download(`${scimDocument.id}.scim`, serializeScimDsl(scimDocument))
              }
            >
              Download .scim file
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Advanced tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <Link className="font-medium underline" href="/editor">
              Model editor
            </Link>
            <span className="text-muted-foreground">
              {" "}
              — author the whole map as text, validate it and export it.
            </span>
          </p>
          <p>
            <Link className="font-medium underline" href="/review">
              Review proposals
            </Link>
            <span className="text-muted-foreground">
              {" "}
              — compare and selectively accept a candidate model from an AI or a
              collaborator.
            </span>
          </p>
          <p>
            <Link className="font-medium underline" href="/legacy">
              Legacy mapper
            </Link>
            <span className="text-muted-foreground">
              {" "}
              — the original mapper, kept while its remaining tools are migrated.
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Start over</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Replace your current map with an example. Your current map stays in
            the revision history until you clear your browser data, and Undo on
            the Emergency tab can reverse this.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                commit(createPersonalStarterDocument(), "Reset to personal starter map");
                setMessage("Reset to the personal starter map.");
              }}
            >
              Personal starter map
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                commit(createDefaultScimDocument(), "Load hospital resilience example");
                setMessage("Loaded the hospital resilience example.");
              }}
            >
              Hospital example
            </Button>
          </div>
        </CardContent>
      </Card>

      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {message}
      </p>

      <p className="font-mono text-[11px] text-muted-foreground">
        SCIM Mapper v{packageJson.version} · Schema v{SCIM_SCHEMA_VERSION}
      </p>
    </div>
  );
}

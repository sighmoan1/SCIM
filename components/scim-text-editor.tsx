"use client";

import { useMemo, useState } from "react";
import {
  parseScimDsl,
  parseScimMarkdown,
  ScimSyntaxError,
} from "@/lib/scim/parser";
import {
  serializeDot,
  serializeMermaid,
  serializeScimDsl,
} from "@/lib/scim/serializer";
import { serializeScimAiHandoff } from "@/lib/scim/handoff";
import { serializeScimRadialSvg } from "@/lib/scim/radial-svg";
import type { ScimDocument, ScimRadialView } from "@/lib/scim/schema";
import { applyScenario, propagateCriticalFailures } from "@/lib/scim/simulation";
import { ScimRadialPreview } from "@/components/scim-radial-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EXAMPLE = `model hospital-resilience "Hospital resilience" {
  perspective: individual
  focus: patient
  description: "How a patient remains protected during a regional electricity failure."

  entity patient "Patient" {
    kind: person
    layer: individual
  }

  entity hospital "Hospital" {
    kind: healthcare
    layer: municipality
    supports: [injury, illness]
    failure-modes: [operators, system-externalities]
  }

  entity grid "Electricity grid" {
    kind: power
    layer: region
    failure-modes: [time-and-wear, system-externalities, violence-or-disaster]
  }

  entity generator "Backup generator" {
    kind: power
    layer: municipality
    failure-modes: [neglect, operators]
    fuel-hours: 36
  }

  entity fuel-depot "Fuel depot" {
    kind: fuel
    layer: region
    failure-modes: [system-externalities, economics]
  }

  grid -> hospital {
    id: grid-hospital
    kind: supplies
    mode: grid
    critical: true
    service-effects: [provision, quality]
  }

  generator -> hospital {
    id: generator-hospital
    kind: backup-for
    mode: on-site
    critical: true
    service-effects: [provision]
  }

  fuel-depot -> generator {
    id: fuel-generator
    kind: supplies
    mode: delivery
    critical: true
    service-effects: [provision, cost]
  }

  hospital -> patient {
    id: hospital-patient
    kind: protects
    critical: true
    service-effects: [provision, quality]
  }

  scenario grid-failure "Regional grid failure" {
    set grid status failed
    set relationship grid-hospital status failed
    set hospital status degraded
    set generator status normal
  }

  view main radial "Hospital resilience radial SCIM" {
    renderer: scim-radial-1
    layout: frozen
    canvas: 1000 1000
    centre: 500 500
    segments: true

    ring individual radius 70
    ring household radius 130
    ring neighbourhood radius 190
    ring municipality radius 250
    ring region radius 310
    ring country radius 370
    ring world radius 430

    sector injury angle 210
    sector illness angle 270
    sector thirst angle 330
    sector hunger angle 30
    sector too-hot angle 90
    sector too-cold angle 150

    place patient at 500 500 size 100 36
    place hospital at 370 420 size 120 40
    place generator at 615 430 size 120 40
    place grid at 720 290 size 120 40
    place fuel-depot at 780 520 size 110 40

    route grid-hospital via 720 290, 560 340, 370 420
    route generator-hospital via 615 430, 500 425, 370 420
    route fuel-generator via 780 520, 700 475, 615 430
    route hospital-patient via 370 420, 440 460, 500 500
  }
}`;

function download(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function ScimTextEditor() {
  const [source, setSource] = useState(EXAMPLE);
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [selectedView, setSelectedView] = useState<string>("");
  const [copyMessage, setCopyMessage] = useState("");

  const result = useMemo(() => {
    try {
      const document = source.includes("```scim")
        ? parseScimMarkdown(source)
        : parseScimDsl(source);
      return { document, errors: [] as string[] };
    } catch (error) {
      const errors =
        error instanceof ScimSyntaxError
          ? error.errors.map((item) => `Line ${item.line}: ${item.message}`)
          : [error instanceof Error ? error.message : "Unknown parse error"];
      return { document: null, errors };
    }
  }, [source]);

  const activeDocument = useMemo<ScimDocument | null>(() => {
    if (!result.document) return null;
    if (!selectedScenario) return result.document;
    const applied = applyScenario(result.document, selectedScenario);
    return propagateCriticalFailures(applied.document).document;
  }, [result.document, selectedScenario]);

  const radialViews = useMemo(
    () =>
      (activeDocument?.views.filter(
        (view): view is ScimRadialView => view.type === "radial"
      ) ?? []),
    [activeDocument]
  );
  const activeViewId = radialViews.some((view) => view.id === selectedView)
    ? selectedView
    : radialViews[0]?.id;
  const exportDocument = activeDocument ?? result.document;

  const copyForAi = async () => {
    if (!exportDocument) return;
    try {
      await copyText(serializeScimAiHandoff(exportDocument));
      setCopyMessage("Portable SCIM handoff copied.");
    } catch (error) {
      setCopyMessage(
        error instanceof Error ? `Copy failed: ${error.message}` : "Copy failed."
      );
    }
  };

  return (
    <div className="grid min-h-screen gap-4 p-3 md:p-4 lg:grid-cols-2">
      <Card className="md:min-h-[75vh]">
        <CardHeader>
          <CardTitle>SCIM source</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            aria-label="SCIM source"
            className="h-[55vh] w-full resize-y rounded-md border bg-background p-3 font-mono text-sm md:h-[70vh]"
            spellCheck={false}
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Validation</CardTitle>
          </CardHeader>
          <CardContent>
            {result.errors.length ? (
              <ul className="space-y-1 text-sm text-red-700">
                {result.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-green-700">
                Valid SCIM {result.document?.schemaVersion} model with{" "}
                {result.document?.entities.length} entities, {result.document?.relationships.length}{" "}
                relationships and {result.document?.views.length} views.
              </p>
            )}
          </CardContent>
        </Card>

        {result.document && result.document.scenarios.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Scenario</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                className="w-full rounded-md border bg-background p-2 text-base"
                value={selectedScenario}
                onChange={(event) => setSelectedScenario(event.target.value)}
              >
                <option value="">Baseline</option>
                {result.document.scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
        )}

        {activeDocument && radialViews.length > 0 && activeViewId && (
          <Card>
            <CardHeader>
              <CardTitle>Portable radial view</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {radialViews.length > 1 && (
                <select
                  aria-label="Radial view"
                  className="w-full rounded-md border bg-background p-2 text-base"
                  value={activeViewId}
                  onChange={(event) => setSelectedView(event.target.value)}
                >
                  {radialViews.map((view) => (
                    <option key={view.id} value={view.id}>
                      {view.name}
                    </option>
                  ))}
                </select>
              )}
              <ScimRadialPreview document={activeDocument} viewId={activeViewId} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Dependency view</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeDocument?.relationships.map((relationship) => {
              const from = activeDocument.entities.find(
                (entity) => entity.id === relationship.from
              );
              const to = activeDocument.entities.find(
                (entity) => entity.id === relationship.to
              );
              return (
                <div key={relationship.id} className="rounded-md border p-3 text-sm">
                  <strong>{from?.name ?? relationship.from}</strong> →{" "}
                  <strong>{to?.name ?? relationship.to}</strong>
                  <div className="text-muted-foreground">
                    {relationship.kind}
                    {relationship.deliveryMode ? ` · ${relationship.deliveryMode}` : ""}
                    {relationship.status !== "normal" ? ` · ${relationship.status}` : ""}
                  </div>
                </div>
              );
            }) ?? (
              <p className="text-sm text-muted-foreground">
                Fix validation errors to render the model.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2 pb-10">
          <Button
            disabled={!exportDocument}
            onClick={() => exportDocument && setSource(serializeScimDsl(exportDocument))}
          >
            Format source
          </Button>
          <Button variant="outline" disabled={!exportDocument} onClick={copyForAi}>
            Copy for AI
          </Button>
          <Button
            variant="outline"
            disabled={!exportDocument}
            onClick={() =>
              exportDocument &&
              download(
                `${exportDocument.id}.ai-handoff.scim.md`,
                serializeScimAiHandoff(exportDocument),
                "text/markdown"
              )
            }
          >
            Export AI handoff
          </Button>
          <Button
            variant="outline"
            disabled={!exportDocument || !activeViewId}
            onClick={() =>
              exportDocument &&
              activeViewId &&
              download(
                `${exportDocument.id}.${activeViewId}.svg`,
                serializeScimRadialSvg(exportDocument, activeViewId),
                "image/svg+xml"
              )
            }
          >
            Export SVG
          </Button>
          <Button
            variant="outline"
            disabled={!exportDocument}
            onClick={() =>
              exportDocument &&
              download(
                "scim-model.json",
                JSON.stringify(exportDocument, null, 2),
                "application/json"
              )
            }
          >
            Export JSON
          </Button>
          <Button
            variant="outline"
            disabled={!exportDocument}
            onClick={() =>
              exportDocument &&
              download("scim-model.mmd", serializeMermaid(exportDocument))
            }
          >
            Export Mermaid
          </Button>
          <Button
            variant="outline"
            disabled={!exportDocument}
            onClick={() =>
              exportDocument &&
              download("scim-model.dot", serializeDot(exportDocument))
            }
          >
            Export DOT
          </Button>
        </div>
        <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
          {copyMessage}
        </p>
      </div>
    </div>
  );
}

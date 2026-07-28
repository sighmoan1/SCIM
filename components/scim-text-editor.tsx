"use client";

import { useMemo, useState } from "react";
import { parseScimDsl, ScimSyntaxError } from "@/lib/scim/parser";
import {
  serializeDot,
  serializeMermaid,
  serializeScimDsl,
} from "@/lib/scim/serializer";
import type { ScimDocument } from "@/lib/scim/schema";
import { applyScenario, propagateCriticalFailures } from "@/lib/scim/simulation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EXAMPLE = `model hospital-resilience "Hospital resilience" {
  entity patient "Patient" {
    kind: person
    layer: individual
  }

  entity hospital "Hospital" {
    kind: healthcare
    layer: municipality
    protects-against: [injury, illness]
  }

  entity grid "Electricity grid" {
    kind: power
    layer: region
  }

  entity generator "Backup generator" {
    kind: power
    layer: municipality
    fuel-hours: 36
  }

  entity fuel-depot "Fuel depot" {
    kind: fuel
    layer: region
  }

  grid -> hospital {
    id: grid-hospital
    kind: supplies
    mode: grid
    critical: true
  }

  generator -> hospital {
    id: generator-hospital
    kind: backup-for
    mode: on-site
    critical: true
  }

  fuel-depot -> generator {
    id: fuel-generator
    kind: supplies
    mode: delivery
    critical: true
  }

  hospital -> patient {
    id: hospital-patient
    kind: protects
    critical: true
  }

  scenario grid-failure "Regional grid failure" {
    set grid status failed
    set generator status normal
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

export function ScimTextEditor() {
  const [source, setSource] = useState(EXAMPLE);
  const [selectedScenario, setSelectedScenario] = useState<string>("");

  const result = useMemo(() => {
    try {
      return { document: parseScimDsl(source), errors: [] as string[] };
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

  const exportDocument = activeDocument ?? result.document;

  return (
    <div className="grid min-h-screen gap-4 p-4 lg:grid-cols-2">
      <Card className="min-h-[75vh]">
        <CardHeader>
          <CardTitle>SCIM source</CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-5rem)]">
          <textarea
            aria-label="SCIM source"
            className="h-[70vh] w-full resize-none rounded-md border bg-background p-3 font-mono text-sm"
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
                Valid SCIM 0.1 model with {result.document?.entities.length} entities and{" "}
                {result.document?.relationships.length} relationships.
              </p>
            )}
          </CardContent>
        </Card>

        {result.document && (
          <Card>
            <CardHeader>
              <CardTitle>Scenario</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                className="w-full rounded-md border bg-background p-2"
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

        <Card>
          <CardHeader>
            <CardTitle>Dependency view</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeDocument?.relationships.map((relationship) => {
              const from = activeDocument.entities.find((entity) => entity.id === relationship.from);
              const to = activeDocument.entities.find((entity) => entity.id === relationship.to);
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
            }) ?? <p className="text-sm text-muted-foreground">Fix validation errors to render the model.</p>}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!exportDocument}
            onClick={() => exportDocument && setSource(serializeScimDsl(exportDocument))}
          >
            Format source
          </Button>
          <Button
            variant="outline"
            disabled={!exportDocument}
            onClick={() =>
              exportDocument &&
              download("scim-model.json", JSON.stringify(exportDocument, null, 2), "application/json")
            }
          >
            Export JSON
          </Button>
          <Button
            variant="outline"
            disabled={!exportDocument}
            onClick={() => exportDocument && download("scim-model.mmd", serializeMermaid(exportDocument))}
          >
            Export Mermaid
          </Button>
          <Button
            variant="outline"
            disabled={!exportDocument}
            onClick={() => exportDocument && download("scim-model.dot", serializeDot(exportDocument))}
          >
            Export DOT
          </Button>
        </div>
      </div>
    </div>
  );
}

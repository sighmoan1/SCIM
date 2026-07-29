"use client";

import Link from "next/link";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPersonalStarterDocument } from "@/lib/scim/personal-starter";
import { serializeScimRadialSvg } from "@/lib/scim/radial-svg";
import { ScimDocumentSchema, type ScimDocument, type ScimRadialView } from "@/lib/scim/schema";
import { applyScenario, propagateCriticalFailures } from "@/lib/scim/simulation";
import {
  createScimWorkspaceRevision,
  loadScimWorkspace,
  saveScimWorkspace,
  type ScimWorkspaceRevision,
} from "@/lib/scim/workspace";

const ENTITY_KINDS = [
  "person",
  "household",
  "healthcare",
  "power",
  "water",
  "food",
  "communications",
  "transport",
  "security",
  "shelter",
  "fuel",
  "service",
  "other",
];

const RELATIONSHIP_KINDS = [
  "depends-on",
  "supplies",
  "backup-for",
  "protects",
  "communicates-with",
  "transports",
  "staffs",
  "other",
];

type InteractionMode = "navigate" | "edit";

type EntityDraft = {
  name: string;
  kind: string;
  layer: string;
  status: "normal" | "degraded" | "failed" | "new";
  supports: string;
};

interface DragState {
  pointerId: number;
  entityId: string;
  viewId: string;
  offsetX: number;
  offsetY: number;
  before: ScimDocument;
  capture: SVGRectElement;
}

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "entity"
  );
}

function uniqueId(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function commaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean);
}

function replaceRadialView(
  document: ScimDocument,
  viewId: string,
  update: (view: ScimRadialView) => ScimRadialView
): ScimDocument {
  return {
    ...document,
    views: document.views.map((view) =>
      view.id === viewId && view.type === "radial" ? update(view) : view
    ),
  };
}

function revisionSummary(revision: ScimWorkspaceRevision): string {
  const semantic = revision.changes.filter((change) =>
    ["model", "entity", "relationship"].includes(change.area)
  ).length;
  const scenario = revision.changes.filter((change) => change.area === "scenario").length;
  const view = revision.changes.filter((change) => change.area === "view").length;
  return `${semantic} semantic · ${scenario} scenario · ${view} view`;
}

export function ScimCanonicalMapWorkspace() {
  const initialDocument = useMemo(() => createPersonalStarterDocument(), []);
  const [document, setDocument] = useState<ScimDocument>(initialDocument);
  const [revisions, setRevisions] = useState<ScimWorkspaceRevision[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<InteractionMode>("navigate");
  const [zoom, setZoom] = useState(1);
  const fittedRef = useRef(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>(
    initialDocument.focusEntityId ?? initialDocument.entities[0]?.id ?? ""
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [message, setMessage] = useState("Navigate mode. Pan around the complete map.");
  const [entityDraft, setEntityDraft] = useState<EntityDraft>({
    name: "",
    kind: "service",
    layer: "individual",
    status: "normal",
    supports: "",
  });
  const [newEntityName, setNewEntityName] = useState("");
  const [newEntityKind, setNewEntityKind] = useState("service");
  const [newEntityLayer, setNewEntityLayer] = useState("municipality");
  const [relationshipFrom, setRelationshipFrom] = useState("");
  const [relationshipTo, setRelationshipTo] = useState("");
  const [relationshipKind, setRelationshipKind] = useState("depends-on");
  const [relationshipCritical, setRelationshipCritical] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const documentRef = useRef(document);

  const setDocumentImmediate = useCallback(
    (update: ScimDocument | ((current: ScimDocument) => ScimDocument)) => {
      setDocument((current) => {
        const next = typeof update === "function" ? update(current) : update;
        documentRef.current = next;
        return next;
      });
    },
    []
  );

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  useEffect(() => {
    const workspace = loadScimWorkspace(window.localStorage, initialDocument);
    setDocumentImmediate(workspace.document);
    setRevisions(workspace.revisions);
    setSelectedEntityId(
      workspace.document.focusEntityId ?? workspace.document.entities[0]?.id ?? ""
    );
    setHydrated(true);
  }, [initialDocument, setDocumentImmediate]);

  useEffect(() => {
    if (!hydrated) return;
    saveScimWorkspace(window.localStorage, { document, revisions });
  }, [document, hydrated, revisions]);

  const radialView = useMemo(
    () => document.views.find((view): view is ScimRadialView => view.type === "radial"),
    [document.views]
  );

  const scenarioResult = useMemo(() => {
    if (!selectedScenarioId) return null;
    try {
      const applied = applyScenario(document, selectedScenarioId);
      return propagateCriticalFailures(applied.document);
    } catch (error) {
      return {
        document,
        changedEntityIds: [],
        changedRelationshipIds: [],
        warnings: [error instanceof Error ? error.message : "Unable to apply scenario"],
        explanations: [],
      };
    }
  }, [document, selectedScenarioId]);

  const displayDocument = scenarioResult?.document ?? document;

  const renderedSvg = useMemo(() => {
    if (!radialView) return "";
    try {
      return serializeScimRadialSvg(displayDocument, radialView.id);
    } catch (error) {
      setTimeout(() =>
        setMessage(error instanceof Error ? error.message : "Unable to render radial view")
      );
      return "";
    }
  }, [displayDocument, radialView]);

  const selectedEntity = document.entities.find((entity) => entity.id === selectedEntityId);

  useEffect(() => {
    if (!selectedEntity) return;
    setEntityDraft({
      name: selectedEntity.name,
      kind: selectedEntity.kind,
      layer: selectedEntity.layer,
      status: selectedEntity.status,
      supports: [...new Set([...selectedEntity.supportsNeeds, ...selectedEntity.protectsAgainst])].join(", "),
    });
  }, [selectedEntity]);

  useEffect(() => {
    if (!relationshipFrom && document.entities[0]) setRelationshipFrom(document.entities[0].id);
    if (!relationshipTo && document.entities[1]) setRelationshipTo(document.entities[1].id);
  }, [document.entities, relationshipFrom, relationshipTo]);

  const recordAcceptedChange = useCallback(
    (
      before: ScimDocument,
      afterInput: ScimDocument,
      label: string,
      origin: "human" | "ai" = "human"
    ) => {
      const after = ScimDocumentSchema.parse(afterInput);
      const revision = createScimWorkspaceRevision(before, after, { origin, label });
      setDocumentImmediate(after);
      if (revision) {
        setRevisions((current) => [...current, revision].slice(-100));
        setMessage(`${label} recorded as ${revision.changes.length} canonical change${revision.changes.length === 1 ? "" : "s"}.`);
      }
    },
    [setDocumentImmediate]
  );

  const commit = useCallback(
    (next: ScimDocument, label: string) => {
      recordAcceptedChange(documentRef.current, next, label, "human");
    },
    [recordAcceptedChange]
  );

  const pointFromEvent = (
    event: ReactPointerEvent<SVGElement>,
    view: ScimRadialView
  ) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * view.canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * view.canvas.height,
    };
  };

  const startNodeDrag = (
    event: ReactPointerEvent<SVGRectElement>,
    entityId: string,
    view: ScimRadialView
  ) => {
    if (mode !== "edit" || selectedScenarioId) return;
    const node = view.nodes.find((candidate) => candidate.entityId === entityId);
    const point = pointFromEvent(event, view);
    if (!node || !point) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedEntityId(entityId);
    dragRef.current = {
      pointerId: event.pointerId,
      entityId,
      viewId: view.id,
      offsetX: point.x - node.x,
      offsetY: point.y - node.y,
      before: structuredClone(documentRef.current),
      capture: event.currentTarget,
    };
  };

  const moveNode = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !radialView) return;
    const point = pointFromEvent(event, radialView);
    if (!point) return;
    event.preventDefault();

    setDocumentImmediate((current) =>
      replaceRadialView(current, drag.viewId, (view) => ({
        ...view,
        nodes: view.nodes.map((node) =>
          node.entityId === drag.entityId
            ? {
                ...node,
                x: Math.max(0, Math.min(view.canvas.width, point.x - drag.offsetX)),
                y: Math.max(0, Math.min(view.canvas.height, point.y - drag.offsetY)),
              }
            : node
        ),
      }))
    );
  };

  const finishNodeDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    if (drag.capture.hasPointerCapture(event.pointerId)) {
      drag.capture.releasePointerCapture(event.pointerId);
    }
    const after = ScimDocumentSchema.parse(documentRef.current);
    const revision = createScimWorkspaceRevision(drag.before, after, {
      origin: "human",
      label: `Move ${after.entities.find((entity) => entity.id === drag.entityId)?.name ?? drag.entityId}`,
    });
    if (revision) setRevisions((current) => [...current, revision].slice(-100));
    dragRef.current = null;
    setMessage("Node position recorded as a canonical view change.");
  };

  const saveSelectedEntity = () => {
    if (!selectedEntity) return;
    const supports = commaList(entityDraft.supports);
    const next: ScimDocument = {
      ...document,
      entities: document.entities.map((entity) =>
        entity.id === selectedEntity.id
          ? {
              ...entity,
              name: entityDraft.name.trim() || entity.name,
              kind: slugify(entityDraft.kind),
              layer: slugify(entityDraft.layer),
              status: entityDraft.status,
              supportsNeeds: supports,
              protectsAgainst: [],
            }
          : entity
      ),
    };
    commit(next, `Edit ${selectedEntity.name}`);
  };

  const addEntity = () => {
    if (!newEntityName.trim() || !radialView) return;
    const ids = new Set(document.entities.map((entity) => entity.id));
    const id = uniqueId(slugify(newEntityName), ids);
    const offset = document.entities.length * 17;
    const next = replaceRadialView(
      {
        ...document,
        entities: [
          ...document.entities,
          {
            id,
            name: newEntityName.trim(),
            description: "",
            kind: slugify(newEntityKind),
            layer: slugify(newEntityLayer),
            status: "normal",
            supportsNeeds: [],
            protectsAgainst: [],
            failureModes: [],
            attributes: {},
            evidence: [],
          },
        ],
      },
      radialView.id,
      (view) => ({
        ...view,
        nodes: [
          ...view.nodes,
          {
            entityId: id,
            x: view.centre.x + 120 + (offset % 130),
            y: view.centre.y + 80 + (offset % 170),
            width: 120,
            height: 40,
          },
        ],
      })
    );
    commit(next, `Add ${newEntityName.trim()}`);
    setSelectedEntityId(id);
    setNewEntityName("");
  };

  const deleteSelectedEntity = () => {
    if (!selectedEntity || !radialView) return;
    const relationshipIds = new Set(
      document.relationships
        .filter(
          (relationship) =>
            relationship.from === selectedEntity.id || relationship.to === selectedEntity.id
        )
        .map((relationship) => relationship.id)
    );
    const next = replaceRadialView(
      {
        ...document,
        focusEntityId:
          document.focusEntityId === selectedEntity.id ? undefined : document.focusEntityId,
        entities: document.entities.filter((entity) => entity.id !== selectedEntity.id),
        relationships: document.relationships.filter(
          (relationship) => !relationshipIds.has(relationship.id)
        ),
      },
      radialView.id,
      (view) => ({
        ...view,
        nodes: view.nodes.filter((node) => node.entityId !== selectedEntity.id),
        routes: view.routes.filter((route) => !relationshipIds.has(route.relationshipId)),
      })
    );
    commit(next, `Delete ${selectedEntity.name}`);
    setSelectedEntityId(next.entities[0]?.id ?? "");
  };

  const addRelationship = () => {
    if (!relationshipFrom || !relationshipTo || relationshipFrom === relationshipTo) return;
    const existing = new Set(document.relationships.map((relationship) => relationship.id));
    const id = uniqueId(`${relationshipFrom}-${relationshipTo}`, existing);
    const next: ScimDocument = {
      ...document,
      relationships: [
        ...document.relationships,
        {
          id,
          from: relationshipFrom,
          to: relationshipTo,
          kind: slugify(relationshipKind),
          status: "normal",
          critical: relationshipCritical,
          serviceEffects: [],
          attributes: {},
          evidence: [],
        },
      ],
    };
    commit(next, `Add relationship ${id}`);
  };

  const deleteRelationship = (id: string) => {
    const relationship = document.relationships.find((candidate) => candidate.id === id);
    if (!relationship) return;
    const next: ScimDocument = {
      ...document,
      relationships: document.relationships.filter((candidate) => candidate.id !== id),
      views: document.views.map((view) =>
        view.type === "radial"
          ? { ...view, routes: view.routes.filter((route) => route.relationshipId !== id) }
          : view
      ),
    };
    commit(next, `Delete relationship ${id}`);
  };

  const undoLastRevision = () => {
    const revision = revisions.at(-1);
    if (!revision) return;
    setDocumentImmediate(revision.before);
    setRevisions((current) => current.slice(0, -1));
    setMessage(`Undid: ${revision.label}`);
  };

  const resetWorkspace = () => {
    const next = createPersonalStarterDocument();
    recordAcceptedChange(documentRef.current, next, "Reset to starter map", "human");
    setSelectedEntityId(next.focusEntityId ?? next.entities[0]?.id ?? "");
    setSelectedScenarioId("");
  };

  const centreMap = useCallback((behavior: ScrollBehavior = "smooth") => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({
      left: Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2),
      top: Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2),
      behavior,
    });
  }, []);

  const fitMap = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const viewport = viewportRef.current;
      const view = documentRef.current.views.find(
        (candidate): candidate is ScimRadialView => candidate.type === "radial"
      );
      if (!viewport || !view) return;
      const fitted = Math.min(
        (viewport.clientWidth - 16) / view.canvas.width,
        (viewport.clientHeight - 16) / view.canvas.height
      );
      setZoom(Math.min(2, Math.max(0.25, fitted)));
      requestAnimationFrame(() => centreMap(behavior));
    },
    [centreMap]
  );

  // Open with the whole map visible instead of a corner of the canvas.
  useEffect(() => {
    if (!hydrated || fittedRef.current) return;
    fittedRef.current = true;
    fitMap("auto");
  }, [hydrated, fitMap]);

  const zoomBy = (factor: number) => {
    setZoom((current) => Math.min(2, Math.max(0.25, current * factor)));
  };

  if (!radialView) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader><CardTitle>No radial view</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add a radial view in the Model workspace before using the interactive map.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const editingDisabled = Boolean(selectedScenarioId);

  return (
    <div className="space-y-3 p-3 pb-12 md:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Your map</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            You are at the centre. Each ring is a layer of the world around you — household,
            neighbourhood, town and beyond — and the six dangers sit around the edge. Arrows show
            what supplies what.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="min-w-0 space-y-3">
          <Card>
            <CardContent className="space-y-3 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={mode === "navigate" ? "default" : "outline"}
                    aria-pressed={mode === "navigate"}
                    onClick={() => {
                      setMode("navigate");
                      setMessage("Navigate mode. Pan or pinch around the complete map.");
                    }}
                  >
                    Navigate
                  </Button>
                  <Button
                    size="sm"
                    variant={mode === "edit" ? "default" : "outline"}
                    aria-pressed={mode === "edit"}
                    disabled={editingDisabled}
                    onClick={() => {
                      setMode("edit");
                      setMessage("Edit mode. Drag nodes with mouse, touch or pen; tap a node to inspect it.");
                    }}
                  >
                    Edit map
                  </Button>
                  <Button size="sm" variant="outline" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.25)}>−</Button>
                  <Button size="sm" variant="outline" aria-label="Zoom in" onClick={() => zoomBy(1.25)}>+</Button>
                  <Button size="sm" variant="outline" onClick={() => fitMap()}>Fit</Button>
                  <Button size="sm" variant="outline" disabled={!revisions.length} onClick={undoLastRevision}>
                    Undo
                  </Button>
                </div>
                <select
                  aria-label="Scenario preview"
                  className="min-h-9 rounded-md border bg-background px-2 text-sm"
                  value={selectedScenarioId}
                  onChange={(event) => {
                    setSelectedScenarioId(event.target.value);
                    if (event.target.value) setMode("navigate");
                  }}
                >
                  <option value="">Baseline</option>
                  {document.scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
                  ))}
                </select>
              </div>

              {selectedScenarioId && (
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  <strong>Scenario preview is read-only.</strong> Return to Baseline to edit the accepted model.
                  {scenarioResult?.explanations?.map((explanation) => (
                    <p key={explanation} className="mt-1 text-muted-foreground">{explanation}</p>
                  ))}
                  {scenarioResult?.warnings.map((warning) => (
                    <p key={warning} className="mt-1 text-amber-700">{warning}</p>
                  ))}
                </div>
              )}

              <div
                ref={viewportRef}
                className="h-[62vh] min-h-[440px] overflow-auto rounded-md border bg-slate-100 overscroll-contain"
                style={{ touchAction: mode === "navigate" ? "pan-x pan-y pinch-zoom" : "none" }}
              >
                <div
                  className="relative mx-auto bg-white shadow-sm"
                  style={{
                    width: radialView.canvas.width * zoom,
                    height: radialView.canvas.height * zoom,
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: renderedSvg }}
                  />
                  <svg
                    ref={overlayRef}
                    aria-label="Interactive SCIM radial map"
                    className="absolute inset-0 h-full w-full"
                    viewBox={`0 0 ${radialView.canvas.width} ${radialView.canvas.height}`}
                    onPointerMove={moveNode}
                    onPointerUp={finishNodeDrag}
                    onPointerCancel={finishNodeDrag}
                    onPointerDown={(event) => {
                      if (event.target === event.currentTarget) setSelectedEntityId("");
                    }}
                    style={{
                      pointerEvents: mode === "edit" && !editingDisabled ? "auto" : "none",
                      touchAction: "none",
                    }}
                  >
                    {radialView.nodes.map((node) => {
                      const selected = node.entityId === selectedEntityId;
                      const hitWidth = Math.max(48, node.width);
                      const hitHeight = Math.max(48, node.height);
                      return (
                        <rect
                          key={node.entityId}
                          x={node.x - hitWidth / 2}
                          y={node.y - hitHeight / 2}
                          width={hitWidth}
                          height={hitHeight}
                          rx={8}
                          fill="transparent"
                          stroke={selected ? "#2563eb" : "transparent"}
                          strokeWidth={selected ? 3 : 0}
                          strokeDasharray={selected ? "7 4" : undefined}
                          className="cursor-move"
                          onPointerDown={(event) => startNodeDrag(event, node.entityId, radialView)}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Canonical revision history</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {revisions.length ? [...revisions].reverse().slice(0, 12).map((revision) => (
                <details key={revision.id} className="rounded-md border p-3">
                  <summary className="cursor-pointer list-none">
                    <span className="font-medium">{revision.label}</span>
                    <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs uppercase">
                      {revision.origin}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">{revisionSummary(revision)}</span>
                  </summary>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {revision.changes.map((change) => <li key={change.key}>{change.summary}</li>)}
                  </ul>
                </details>
              )) : (
                <p className="text-sm text-muted-foreground">No accepted changes yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-3">
          <Card>
            <CardHeader><CardTitle className="text-base">Entity inspector</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <select
                aria-label="Selected entity"
                className="min-h-10 w-full rounded-md border bg-background px-2"
                value={selectedEntityId}
                onChange={(event) => setSelectedEntityId(event.target.value)}
              >
                <option value="">Select an entity</option>
                {document.entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>{entity.name}</option>
                ))}
              </select>

              {selectedEntity ? (
                <>
                  <div><Label>Name</Label><Input value={entityDraft.name} onChange={(event) => setEntityDraft((draft) => ({ ...draft, name: event.target.value }))} /></div>
                  <div>
                    <Label>Kind</Label>
                    <Input list="scim-entity-kinds" value={entityDraft.kind} onChange={(event) => setEntityDraft((draft) => ({ ...draft, kind: event.target.value }))} />
                    <datalist id="scim-entity-kinds">{ENTITY_KINDS.map((kind) => <option key={kind} value={kind} />)}</datalist>
                  </div>
                  <div>
                    <Label>Layer</Label>
                    <select className="min-h-10 w-full rounded-md border bg-background px-2" value={entityDraft.layer} onChange={(event) => setEntityDraft((draft) => ({ ...draft, layer: event.target.value }))}>
                      {[...new Set(radialView.rings.map((ring) => ring.layer))].map((layer) => <option key={layer} value={layer}>{layer}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select className="min-h-10 w-full rounded-md border bg-background px-2" value={entityDraft.status} onChange={(event) => setEntityDraft((draft) => ({ ...draft, status: event.target.value as EntityDraft["status"] }))}>
                      <option value="normal">normal</option><option value="degraded">degraded</option><option value="failed">failed</option><option value="new">new</option>
                    </select>
                  </div>
                  <div><Label>Supports needs</Label><Input placeholder="injury, illness" value={entityDraft.supports} onChange={(event) => setEntityDraft((draft) => ({ ...draft, supports: event.target.value }))} /></div>
                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={editingDisabled} onClick={saveSelectedEntity}>Save entity</Button>
                    <Button variant="destructive" disabled={editingDisabled} onClick={deleteSelectedEntity}>Delete</Button>
                  </div>
                </>
              ) : <p className="text-sm text-muted-foreground">Tap a node in Edit map mode or choose one above.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Add infrastructure</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Name</Label><Input value={newEntityName} onChange={(event) => setNewEntityName(event.target.value)} placeholder="Water treatment works" /></div>
              <div><Label>Kind</Label><Input list="scim-entity-kinds" value={newEntityKind} onChange={(event) => setNewEntityKind(event.target.value)} /></div>
              <div>
                <Label>Layer</Label>
                <select className="min-h-10 w-full rounded-md border bg-background px-2" value={newEntityLayer} onChange={(event) => setNewEntityLayer(event.target.value)}>
                  {radialView.rings.map((ring) => <option key={ring.layer} value={ring.layer}>{ring.layer}</option>)}
                </select>
              </div>
              <Button className="w-full" disabled={editingDisabled || !newEntityName.trim()} onClick={addEntity}>Add entity</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Add dependency or service</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Provider / enabler</Label><select className="min-h-10 w-full rounded-md border bg-background px-2" value={relationshipFrom} onChange={(event) => setRelationshipFrom(event.target.value)}>{document.entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select></div>
              <div><Label>Receiver</Label><select className="min-h-10 w-full rounded-md border bg-background px-2" value={relationshipTo} onChange={(event) => setRelationshipTo(event.target.value)}>{document.entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select></div>
              <div><Label>Relationship kind</Label><Input list="scim-relationship-kinds" value={relationshipKind} onChange={(event) => setRelationshipKind(event.target.value)} /><datalist id="scim-relationship-kinds">{RELATIONSHIP_KINDS.map((kind) => <option key={kind} value={kind} />)}</datalist></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={relationshipCritical} onChange={(event) => setRelationshipCritical(event.target.checked)} /> Critical dependency</label>
              <Button className="w-full" disabled={editingDisabled || relationshipFrom === relationshipTo} onClick={addRelationship}>Add relationship</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Relationships</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {document.relationships.map((relationship) => (
                <div key={relationship.id} className="flex items-start justify-between gap-2 rounded-md border p-2 text-sm">
                  <div>
                    <div className="font-medium">{document.entities.find((entity) => entity.id === relationship.from)?.name ?? relationship.from} → {document.entities.find((entity) => entity.id === relationship.to)?.name ?? relationship.to}</div>
                    <div className="text-muted-foreground">{relationship.kind}{relationship.critical ? " · critical" : ""}</div>
                  </div>
                  <Button size="sm" variant="ghost" disabled={editingDisabled} onClick={() => deleteRelationship(relationship.id)}>Delete</Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-3 text-sm text-muted-foreground">
              <p>
                Exports, AI collaboration and the legacy mapper live under{" "}
                <Link className="font-medium underline" href="/more">More</Link>.
              </p>
              <Button variant="outline" onClick={resetWorkspace}>Reset to starter map</Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

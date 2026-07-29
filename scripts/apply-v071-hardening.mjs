import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const write = (file, content) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};

function replace(file, pattern, replacement, label = String(pattern)) {
  const source = read(file);
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`Could not apply ${label} in ${file}`);
  write(file, next);
}

function replaceAllChecked(file, pattern, replacement, minimum, label) {
  const source = read(file);
  const matches = source.match(pattern) ?? [];
  if (matches.length < minimum) {
    throw new Error(`Expected at least ${minimum} matches for ${label} in ${file}, found ${matches.length}`);
  }
  write(file, source.replace(pattern, replacement));
}

// Release and verification metadata.
replace("package.json", '"version": "0.7.0"', '"version": "0.7.1"', "package version");
replace(
  "package.json",
  '"typecheck": "tsc --noEmit",\n    "verify": "pnpm typecheck && pnpm build"',
  '"typecheck": "tsc --noEmit",\n    "test": "vitest run",\n    "verify": "pnpm test && pnpm typecheck && pnpm build"',
  "test scripts"
);
replace(
  "package.json",
  '"typescript": "^5"',
  '"typescript": "^5",\n    "vitest": "^3.2.4"',
  "vitest dependency"
);
replace(
  ".github/workflows/verify.yml",
  "      - run: pnpm typecheck\n      - run: pnpm build\n",
  "      - run: pnpm test\n      - run: pnpm typecheck\n      - run: pnpm build\n",
  "CI test step"
);

// One shared workspace implementation for Home, Emergency, Map, Matrix and More.
write(
  "components/use-scim-workspace.ts",
  `"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPersonalStarterDocument } from "@/lib/scim/personal-starter";
import { ScimDocumentSchema, type ScimDocument } from "@/lib/scim/schema";
import {
  createScimWorkspaceRevision,
  loadScimWorkspace,
  saveScimWorkspace,
  type ScimRevisionOrigin,
  type ScimWorkspaceRevision,
} from "@/lib/scim/workspace";

/**
 * Browser-local accepted workspace shared by every screen: one validated
 * document plus its revision history, loaded from and saved to local storage.
 * Every accepted change goes through commit/commitFrom so provenance and undo
 * semantics do not diverge between screens.
 */
export function useScimWorkspace() {
  const fallback = useMemo(() => createPersonalStarterDocument(), []);
  const [document, setDocument] = useState<ScimDocument>(fallback);
  const [revisions, setRevisions] = useState<ScimWorkspaceRevision[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const documentRef = useRef(document);
  const revisionsRef = useRef(revisions);

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  useEffect(() => {
    revisionsRef.current = revisions;
  }, [revisions]);

  useEffect(() => {
    const workspace = loadScimWorkspace(window.localStorage, fallback);
    documentRef.current = workspace.document;
    revisionsRef.current = workspace.revisions;
    setDocument(workspace.document);
    setRevisions(workspace.revisions);
    setHydrated(true);
  }, [fallback]);

  useEffect(() => {
    if (!hydrated) return;
    saveScimWorkspace(window.localStorage, { document, revisions });
  }, [document, hydrated, revisions]);

  const commitFrom = useCallback(
    (
      beforeInput: ScimDocument,
      next: ScimDocument,
      label: string,
      origin: ScimRevisionOrigin = "human"
    ): ScimWorkspaceRevision | null => {
      const before = ScimDocumentSchema.parse(beforeInput);
      const after = ScimDocumentSchema.parse(next);
      const revision = createScimWorkspaceRevision(before, after, { origin, label });
      documentRef.current = after;
      setDocument(after);
      if (!revision) return null;
      const nextRevisions = [...revisionsRef.current, revision].slice(-100);
      revisionsRef.current = nextRevisions;
      setRevisions(nextRevisions);
      return revision;
    },
    []
  );

  const commit = useCallback(
    (
      next: ScimDocument,
      label: string,
      origin: ScimRevisionOrigin = "human"
    ): boolean => Boolean(commitFrom(documentRef.current, next, label, origin)),
    [commitFrom]
  );

  /** Used for live pointer previews. The completed gesture is committed once. */
  const replaceTransient = useCallback((next: ScimDocument): void => {
    const parsed = ScimDocumentSchema.parse(next);
    documentRef.current = parsed;
    setDocument(parsed);
  }, []);

  const undo = useCallback((): string | null => {
    const revision = revisionsRef.current.at(-1);
    if (!revision) return null;
    const nextRevisions = revisionsRef.current.slice(0, -1);
    revisionsRef.current = nextRevisions;
    documentRef.current = revision.before;
    setRevisions(nextRevisions);
    setDocument(revision.before);
    return revision.label;
  }, []);

  return {
    document,
    revisions,
    hydrated,
    commit,
    commitFrom,
    replaceTransient,
    undo,
    documentRef,
  };
}
`
);

// Degraded infrastructure is impaired but still available.
replace(
  "lib/scim/needs.ts",
  'const STATUS_AVAILABLE: ReadonlySet<EntityStatus> = new Set(["normal", "new"]);',
  'const STATUS_AVAILABLE: ReadonlySet<EntityStatus> = new Set(["normal", "degraded", "new"]);',
  "degraded availability"
);
replace(
  "lib/scim/needs.ts",
  `  } else if (
    protectors.some((protector) => !protector.working) ||
    working.some((protector) => protector.supplyNotes.length)
  ) {`,
  `  } else if (
    protectors.some(
      (protector) =>
        !protector.working || protector.effectiveStatus === "degraded"
    ) ||
    working.some((protector) => protector.supplyNotes.length)
  ) {`,
  "at-risk degraded rule"
);

// Referentially safe canonical mutation helpers.
write(
  "lib/scim/mutations.ts",
  `import {
  ScimDocumentSchema,
  type ScenarioChange,
  type ScimDocument,
} from "./schema";

function scenarioChangeReferencesRelationship(
  change: ScenarioChange,
  relationshipIds: ReadonlySet<string>
): boolean {
  if (change.operation === "set-relationship-status") {
    return relationshipIds.has(change.relationshipId);
  }
  if (change.operation === "add-relationship") {
    return relationshipIds.has(change.relationship.id);
  }
  return false;
}

/** Remove an entity and every canonical reference that would otherwise dangle. */
export function removeEntityFromDocument(
  input: ScimDocument,
  entityId: string
): ScimDocument {
  const document = ScimDocumentSchema.parse(input);
  const relationshipIds = new Set(
    document.relationships
      .filter(
        (relationship) =>
          relationship.from === entityId || relationship.to === entityId
      )
      .map((relationship) => relationship.id)
  );

  const next: ScimDocument = {
    ...document,
    focusEntityId:
      document.focusEntityId === entityId ? undefined : document.focusEntityId,
    entities: document.entities.filter((entity) => entity.id !== entityId),
    relationships: document.relationships.filter(
      (relationship) => !relationshipIds.has(relationship.id)
    ),
    scenarios: document.scenarios.map((scenario) => ({
      ...scenario,
      changes: scenario.changes.filter((change) => {
        if (change.operation === "set-entity-status") {
          return change.entityId !== entityId;
        }
        if (change.operation === "add-entity") {
          return change.entity.id !== entityId;
        }
        if (change.operation === "add-relationship") {
          return (
            change.relationship.from !== entityId &&
            change.relationship.to !== entityId &&
            !relationshipIds.has(change.relationship.id)
          );
        }
        return !scenarioChangeReferencesRelationship(change, relationshipIds);
      }),
    })),
    views: document.views.map((view) =>
      view.type === "radial"
        ? {
            ...view,
            nodes: view.nodes.filter((node) => node.entityId !== entityId),
            routes: view.routes.filter(
              (route) => !relationshipIds.has(route.relationshipId)
            ),
          }
        : {
            ...view,
            cells: view.cells.map((cell) => ({
              ...cell,
              entityIds: cell.entityIds.filter((id) => id !== entityId),
            })),
          }
    ),
  };

  return ScimDocumentSchema.parse(next);
}

/** Remove a relationship and every scenario/view reference to it. */
export function removeRelationshipFromDocument(
  input: ScimDocument,
  relationshipId: string
): ScimDocument {
  const document = ScimDocumentSchema.parse(input);
  const relationshipIds = new Set([relationshipId]);
  const next: ScimDocument = {
    ...document,
    relationships: document.relationships.filter(
      (relationship) => relationship.id !== relationshipId
    ),
    scenarios: document.scenarios.map((scenario) => ({
      ...scenario,
      changes: scenario.changes.filter(
        (change) => !scenarioChangeReferencesRelationship(change, relationshipIds)
      ),
    })),
    views: document.views.map((view) =>
      view.type === "radial"
        ? {
            ...view,
            routes: view.routes.filter(
              (route) => route.relationshipId !== relationshipId
            ),
          }
        : view
    ),
  };
  return ScimDocumentSchema.parse(next);
}
`
);

// Make the Map consume the shared workspace and safe mutation helpers.
replace(
  "components/scim-canonical-map-workspace.tsx",
  'import { createPersonalStarterDocument } from "@/lib/scim/personal-starter";\n',
  'import { useScimWorkspace } from "@/components/use-scim-workspace";\n',
  "map workspace hook import"
);
replace(
  "components/scim-canonical-map-workspace.tsx",
  'import { ScimDocumentSchema, type ScimDocument, type ScimRadialView } from "@/lib/scim/schema";\n',
  'import { ScimDocumentSchema, type ScimDocument, type ScimRadialView } from "@/lib/scim/schema";\nimport { removeEntityFromDocument, removeRelationshipFromDocument } from "@/lib/scim/mutations";\n',
  "safe mutation import"
);
replace(
  "components/scim-canonical-map-workspace.tsx",
  /import \{\n  createScimWorkspaceRevision,\n  loadScimWorkspace,\n  saveScimWorkspace,\n  type ScimWorkspaceRevision,\n\} from "@\/lib\/scim\/workspace";/,
  'import type { ScimWorkspaceRevision } from "@/lib/scim/workspace";',
  "remove duplicate workspace implementation imports"
);
replace(
  "components/scim-canonical-map-workspace.tsx",
  /  const initialDocument = useMemo\([\s\S]*?  const \[hydrated, setHydrated\] = useState\(false\);\n/,
  `  const {
    document,
    revisions,
    hydrated,
    commit: commitWorkspace,
    commitFrom,
    replaceTransient,
    undo,
    documentRef,
  } = useScimWorkspace();
`,
  "map shared workspace state"
);
replace(
  "components/scim-canonical-map-workspace.tsx",
  /  const \[selectedEntityId, setSelectedEntityId\] = useState<string>\([\s\S]*?\n  \);/,
  '  const [selectedEntityId, setSelectedEntityId] = useState<string>("");',
  "selected entity initial state"
);
replace(
  "components/scim-canonical-map-workspace.tsx",
  "  const documentRef = useRef(document);\n",
  "",
  "remove local document ref"
);
replace(
  "components/scim-canonical-map-workspace.tsx",
  /  const setDocumentImmediate = useCallback\([\s\S]*?  \}, \[document, hydrated, revisions\]\);\n/,
  `  useEffect(() => {
    if (!hydrated || selectedEntityId) return;
    setSelectedEntityId(
      document.focusEntityId ?? document.entities[0]?.id ?? ""
    );
  }, [document.entities, document.focusEntityId, hydrated, selectedEntityId]);
`,
  "remove map-local hydration and persistence"
);
replaceAllChecked(
  "components/scim-canonical-map-workspace.tsx",
  /setDocumentImmediate/g,
  "replaceTransient",
  1,
  "transient map updates"
);
replace(
  "components/scim-canonical-map-workspace.tsx",
  /  const recordAcceptedChange = useCallback\([\s\S]*?  const pointFromEvent =/,
  `  const recordAcceptedChange = useCallback(
    (
      before: ScimDocument,
      after: ScimDocument,
      label: string,
      origin: "human" | "ai" = "human"
    ) => {
      const revision = commitFrom(before, after, label, origin);
      if (revision) {
        setMessage(
          \`${label} recorded as \${revision.changes.length} canonical change\${
            revision.changes.length === 1 ? "" : "s"
          }.\`
        );
      }
    },
    [commitFrom]
  );

  const commit = useCallback(
    (next: ScimDocument, label: string) => {
      const changed = commitWorkspace(next, label, "human");
      setMessage(
        changed ? \`${label} recorded as an accepted revision.\` : "No canonical change to record."
      );
    },
    [commitWorkspace]
  );

  const pointFromEvent =`,
  "map shared commit functions"
);
replace(
  "components/scim-canonical-map-workspace.tsx",
  /    const after = ScimDocumentSchema\.parse\(documentRef\.current\);\n    const revision = createScimWorkspaceRevision\([\s\S]*?    setMessage\("Node position recorded as a canonical view change\."\);/,
  `    const after = ScimDocumentSchema.parse(documentRef.current);
    const label = \`Move \${
      after.entities.find((entity) => entity.id === drag.entityId)?.name ??
      drag.entityId
    }\`;
    const revision = commitFrom(drag.before, after, label, "human");
    dragRef.current = null;
    setMessage(
      revision
        ? "Node position recorded as a canonical view change."
        : "Node position did not change."
    );`,
  "map drag revision"
);
replace(
  "components/scim-canonical-map-workspace.tsx",
  /  const deleteSelectedEntity = \(\) => \{[\s\S]*?\n  \};\n\n  const addRelationship =/,
  `  const deleteSelectedEntity = () => {
    if (!selectedEntity) return;
    const next = removeEntityFromDocument(document, selectedEntity.id);
    commit(next, \`Delete \${selectedEntity.name} and its references\`);
    setSelectedEntityId(next.entities[0]?.id ?? "");
  };

  const addRelationship =`,
  "safe entity deletion"
);
replace(
  "components/scim-canonical-map-workspace.tsx",
  /  const deleteRelationship = \(id: string\) => \{[\s\S]*?\n  \};\n\n  const undoLastRevision =/,
  `  const deleteRelationship = (id: string) => {
    const relationship = document.relationships.find((candidate) => candidate.id === id);
    if (!relationship) return;
    commit(
      removeRelationshipFromDocument(document, id),
      \`Delete relationship \${id} and its references\`
    );
  };

  const undoLastRevision =`,
  "safe relationship deletion"
);
replace(
  "components/scim-canonical-map-workspace.tsx",
  /  const undoLastRevision = \(\) => \{[\s\S]*?\n  \};/,
  `  const undoLastRevision = () => {
    const label = undo();
    if (label) setMessage(\`Undid: \${label}\`);
  };`,
  "shared map undo"
);

// Define INAM as a deterministic dependency projection, not only direct tags.
write(
  "lib/scim/inam.ts",
  `import type { EntityStatus, ScimDocument, ScimEntity } from "./schema";
import { assessAllTiers, type NeedStatus } from "./needs";
import {
  CANONICAL_NEEDS,
  canonicalNeed,
  LAYERS,
  layerRank,
  normaliseLayer,
  TIERS,
  type CanonicalNeed,
  type Layer,
  type TierId,
} from "./tiers";

export type InamEntityRole = "direct" | "upstream";

export interface InamCellEntity {
  id: string;
  name: string;
  reportedStatus: EntityStatus;
  effectiveStatus: EntityStatus;
  role: InamEntityRole;
  distance: number;
}

export interface InamCell {
  needId: string;
  layerId: string;
  entities: InamCellEntity[];
}

export interface InamRow {
  need: CanonicalNeed;
  status: NeedStatus;
  cells: InamCell[];
}

export interface InamTierGroup {
  tier: TierId;
  label: string;
  rows: InamRow[];
}

export interface InamMatrix {
  layers: Layer[];
  groups: InamTierGroup[];
  usedLayerIds: string[];
}

function protectsNeed(entity: ScimEntity, needId: string): boolean {
  return (
    entity.supportsNeeds.includes(needId) ||
    entity.protectsAgainst.includes(needId)
  );
}

/**
 * Trace direct need providers and every upstream provider reachable through
 * provider -> receiver relationships. Layout never creates membership.
 */
function providersForNeed(
  document: ScimDocument,
  needId: string
): Map<string, { entity: ScimEntity; distance: number }> {
  const incoming = new Map<string, string[]>();
  for (const relationship of document.relationships) {
    const current = incoming.get(relationship.to) ?? [];
    current.push(relationship.from);
    incoming.set(relationship.to, current);
  }

  const result = new Map<string, { entity: ScimEntity; distance: number }>();
  const entities = new Map(document.entities.map((entity) => [entity.id, entity]));
  const queue = document.entities
    .filter((entity) => entity.kind !== "person" && protectsNeed(entity, needId))
    .map((entity) => ({ entity, distance: 0 }));

  while (queue.length) {
    const current = queue.shift();
    if (!current) break;
    const existing = result.get(current.entity.id);
    if (existing && existing.distance <= current.distance) continue;
    result.set(current.entity.id, current);
    for (const sourceId of incoming.get(current.entity.id) ?? []) {
      const source = entities.get(sourceId);
      if (source && source.kind !== "person") {
        queue.push({ entity: source, distance: current.distance + 1 });
      }
    }
  }

  return result;
}

export function buildInamMatrix(document: ScimDocument): InamMatrix {
  const assessment = assessAllTiers(document);
  const statusByNeed = new Map<string, NeedStatus>();
  for (const tier of assessment.tiers) {
    for (const need of tier.needs) statusByNeed.set(need.need.id, need.status);
  }
  const effective = assessment.effectiveStatuses;
  const providersByNeed = new Map(
    CANONICAL_NEEDS.map((need) => [need.id, providersForNeed(document, need.id)])
  );

  const usedLayerIds = new Set<string>();
  for (const providers of providersByNeed.values()) {
    for (const { entity } of providers.values()) {
      usedLayerIds.add(normaliseLayer(entity.layer));
    }
  }

  const layers = LAYERS.filter((layer) => usedLayerIds.has(layer.id)).sort(
    (a, b) => layerRank(a.id) - layerRank(b.id)
  );
  const columnLayers = layers.length ? layers : LAYERS;

  const groups: InamTierGroup[] = TIERS.map((tier) => ({
    tier: tier.id,
    label: tier.label,
    rows: tier.needs.map((needId): InamRow => {
      const need = canonicalNeed(needId)!;
      const providers = providersByNeed.get(needId) ?? new Map();
      const cells = columnLayers.map((layer): InamCell => {
        const entities = [...providers.values()]
          .filter(({ entity }) => normaliseLayer(entity.layer) === layer.id)
          .map(({ entity, distance }): InamCellEntity => ({
            id: entity.id,
            name: entity.name,
            reportedStatus: entity.status,
            effectiveStatus: effective.get(entity.id) ?? entity.status,
            role: distance === 0 ? "direct" : "upstream",
            distance,
          }))
          .sort(
            (a, b) =>
              a.distance - b.distance || a.name.localeCompare(b.name)
          );
        return { needId, layerId: layer.id, entities };
      });
      return { need, status: statusByNeed.get(needId) ?? "unmapped", cells };
    }),
  }));

  return {
    layers: columnLayers,
    groups,
    usedLayerIds: [...usedLayerIds].sort((a, b) => layerRank(a) - layerRank(b)),
  };
}
`
);

write(
  "components/inam-matrix.tsx",
  `"use client";

import { useMemo } from "react";
import { buildInamMatrix, type InamCellEntity } from "@/lib/scim/inam";
import { layerLabel } from "@/lib/scim/tiers";
import type { ScimDocument } from "@/lib/scim/schema";
import { NEED_STATUS_META } from "@/components/need-status";
import { cn } from "@/lib/utils";

function statusDot(status: InamCellEntity["effectiveStatus"]): string {
  switch (status) {
    case "failed":
      return "bg-danger";
    case "degraded":
      return "bg-warn";
    default:
      return "bg-ok";
  }
}

export function InamMatrix({ document }: { document: ScimDocument }) {
  const matrix = useMemo(() => buildInamMatrix(document), [document]);
  const columnCount = matrix.layers.length;

  return (
    <div className="space-y-2">
      <p className="px-1 text-xs text-muted-foreground">
        Solid labels directly meet the need. <span className="opacity-70">↳ Faded labels are upstream dependencies.</span>
      </p>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-20 border-b bg-card p-3 text-left align-bottom">
                <span className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">Need</span>
              </th>
              {matrix.layers.map((layer) => (
                <th key={layer.id} scope="col" className="border-b border-l bg-card p-3 text-left align-bottom">
                  <span className="text-xs font-semibold text-muted-foreground">{layer.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.groups.map((group) => (
              <FragmentGroup key={group.tier} label={group.label} columnCount={columnCount} rows={group.rows} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentGroup({ label, columnCount, rows }: {
  label: string;
  columnCount: number;
  rows: ReturnType<typeof buildInamMatrix>["groups"][number]["rows"];
}) {
  return (
    <>
      <tr>
        <th scope="colgroup" colSpan={columnCount + 1} className="sticky left-0 bg-muted/60 px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </th>
      </tr>
      {rows.map((row) => {
        const meta = NEED_STATUS_META[row.status];
        return (
          <tr key={row.need.id} className="align-top">
            <th scope="row" className="sticky left-0 z-10 border-b bg-card p-3 text-left">
              <span className="flex items-center gap-2">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)} aria-hidden="true" />
                <span className="font-medium">{row.need.label}</span>
              </span>
            </th>
            {row.cells.map((cell) => (
              <td key={cell.layerId} className="border-b border-l p-2 align-top">
                <div className="flex flex-col gap-1">
                  {cell.entities.map((entity) => (
                    <span
                      key={entity.id}
                      title={\`${entity.name} — \${layerLabel(cell.layerId)} (\${entity.effectiveStatus}; \${entity.role === "direct" ? "direct provider" : `upstream dependency, ${entity.distance} step${entity.distance === 1 ? "" : "s"}`})\`}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs",
                        entity.role === "upstream" && "opacity-70",
                        entity.effectiveStatus === "failed"
                          ? "bg-danger-soft text-danger"
                          : entity.effectiveStatus === "degraded"
                            ? "bg-warn-soft text-warn"
                            : "bg-muted/60 text-foreground"
                      )}
                    >
                      {entity.role === "upstream" && <span aria-hidden="true">↳</span>}
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDot(entity.effectiveStatus))} aria-hidden="true" />
                      {entity.name}
                    </span>
                  ))}
                </div>
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}
`
);

// Guided authoring for group, organisation and nation-state needs.
write(
  "lib/scim/guided-tier.ts",
  `import { placementFor, slugifyName, uniqueEntityId } from "./guided";
import { ScimDocumentSchema, type ScimDocument, type ScimRadialView } from "./schema";
import { canonicalNeed } from "./tiers";

export interface AddNeedProviderInput {
  needId: string;
  name: string;
  kind: string;
  layer: string;
}

export function addNeedProvider(
  input: ScimDocument,
  request: AddNeedProviderInput
): ScimDocument {
  const document = ScimDocumentSchema.parse(input);
  const need = canonicalNeed(request.needId);
  if (!need) throw new Error(`Unknown canonical need: ${request.needId}`);
  const name = request.name.trim();
  if (!name) throw new Error("Provider name is required.");

  const existing = document.entities.find(
    (entity) => entity.name.toLowerCase() === name.toLowerCase()
  );
  if (existing) {
    return ScimDocumentSchema.parse({
      ...document,
      entities: document.entities.map((entity) =>
        entity.id === existing.id && !entity.supportsNeeds.includes(need.id)
          ? { ...entity, supportsNeeds: [...entity.supportsNeeds, need.id] }
          : entity
      ),
    });
  }

  const id = uniqueEntityId(
    slugifyName(name),
    new Set(document.entities.map((entity) => entity.id))
  );
  const entity = {
    id,
    name,
    description: "",
    kind: slugifyName(request.kind || "service"),
    layer: slugifyName(request.layer),
    status: "normal" as const,
    supportsNeeds: [need.id],
    protectsAgainst: [],
    failureModes: [],
    attributes: {},
    evidence: [],
  };
  const radial = document.views.find(
    (view): view is ScimRadialView => view.type === "radial"
  );
  const position = radial
    ? placementFor(radial, entity.layer, need.id)
    : undefined;

  return ScimDocumentSchema.parse({
    ...document,
    entities: [...document.entities, entity],
    views: document.views.map((view) =>
      radial && view.id === radial.id && view.type === "radial" && position
        ? {
            ...view,
            nodes: [
              ...view.nodes,
              { entityId: id, ...position, width: 132, height: 40 },
            ],
          }
        : view
    ),
  });
}
`
);

write(
  "components/guided-tier-builder.tsx",
  `"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Snackbar, useSnackbar } from "@/components/snackbar";
import { useScimWorkspace } from "@/components/use-scim-workspace";
import { addNeedProvider } from "@/lib/scim/guided-tier";
import { LAYERS, needsForTier, TIERS, type TierId } from "@/lib/scim/tiers";

const HIGHER_TIERS = TIERS.filter((tier) => tier.id !== "individual");

export function GuidedTierBuilder() {
  const params = useSearchParams();
  const initialTier = HIGHER_TIERS.some((tier) => tier.id === params.get("tier"))
    ? (params.get("tier") as TierId)
    : "group";
  const { document, hydrated, commit } = useScimWorkspace();
  const [tierId, setTierId] = useState<TierId>(initialTier);
  const needs = useMemo(() => needsForTier(tierId), [tierId]);
  const [needId, setNeedId] = useState(needs[0]?.id ?? "communications");
  const [name, setName] = useState("");
  const [kind, setKind] = useState("service");
  const [layer, setLayer] = useState("municipality");
  const { snackbar, visible, show } = useSnackbar();

  const selectedNeed = needs.find((need) => need.id === needId) ?? needs[0];
  if (!hydrated) return <div className="mx-auto max-w-2xl px-4 py-6">Loading workspace…</div>;

  return (
    <div className="rise-in mx-auto max-w-2xl space-y-5 px-4 py-6">
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-full">
          <Link href="/matrix"><ArrowLeft className="mr-1 h-4 w-4" /> Matrix</Link>
        </Button>
        <h1 className="text-[1.6rem] font-bold">Build the wider system</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Add what enables a group, organisation or state to function. Each addition becomes canonical SCIM structure and appears in both Matrix and Map.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl bg-card p-5 shadow-soft ring-1 ring-inset ring-border/60">
        <label className="block space-y-1.5 text-sm font-medium">
          Tier
          <select
            value={tierId}
            onChange={(event) => {
              const next = event.target.value as TierId;
              setTierId(next);
              setNeedId(needsForTier(next)[0]?.id ?? "");
            }}
            className="h-11 w-full rounded-xl border bg-background px-3"
          >
            {HIGHER_TIERS.map((tier) => <option key={tier.id} value={tier.id}>{tier.label}</option>)}
          </select>
        </label>

        <label className="block space-y-1.5 text-sm font-medium">
          Need
          <select value={selectedNeed?.id} onChange={(event) => setNeedId(event.target.value)} className="h-11 w-full rounded-xl border bg-background px-3">
            {needs.map((need) => <option key={need.id} value={need.id}>{need.label}</option>)}
          </select>
        </label>
        {selectedNeed && (
          <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
            <strong className="text-foreground">{selectedNeed.question}</strong><br />{selectedNeed.hint}
          </p>
        )}

        <label className="block space-y-1.5 text-sm font-medium">
          What meets this need?
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. neighbourhood radio network" className="h-11 rounded-xl" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm font-medium">
            Kind
            <Input value={kind} onChange={(event) => setKind(event.target.value)} className="h-11 rounded-xl" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Layer of provision
            <select value={layer} onChange={(event) => setLayer(event.target.value)} className="h-11 w-full rounded-xl border bg-background px-3">
              {LAYERS.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}
            </select>
          </label>
        </div>
        <Button
          className="min-h-11 w-full rounded-xl"
          disabled={!name.trim() || !selectedNeed}
          onClick={() => {
            if (!selectedNeed) return;
            try {
              const next = addNeedProvider(document, { needId: selectedNeed.id, name, kind, layer });
              commit(next, `Add ${name.trim()} for ${selectedNeed.label}`);
              show(`Added ${name.trim()} to ${selectedNeed.label}`);
              setName("");
            } catch (error) {
              show(error instanceof Error ? error.message : "Could not add that provider.");
            }
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add to the shared model
        </Button>
      </section>

      <div className="flex gap-2">
        <Button asChild variant="outline" className="rounded-xl"><Link href="/matrix">See Matrix</Link></Button>
        <Button asChild variant="outline" className="rounded-xl"><Link href="/map">See Map</Link></Button>
      </div>
      <Snackbar message={snackbar} visible={visible} />
    </div>
  );
}
`
);

write(
  "app/build/page.tsx",
  `import type { Metadata } from "next";
import { Suspense } from "react";
import { GuidedTierBuilder } from "@/components/guided-tier-builder";

export const metadata: Metadata = { title: "Build wider system · SCIM" };

export default function Page() {
  return <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-6">Loading builder…</div>}><GuidedTierBuilder /></Suspense>;
}
`
);

replace(
  "components/home-dashboard.tsx",
  '                key={tier.tier}\n                href="/matrix"',
  '                key={tier.tier}\n                href={`/build?tier=${tier.tier}`}',
  "higher-tier Home links"
);
replace(
  "components/matrix-workspace.tsx",
  '          <Link href="/" className="font-medium underline">\n            Home\n          </Link>{" "}\n          tab to fill more of the matrix.',
  '          <Link href="/build" className="font-medium underline">\n            guided builder\n          </Link>{" "}\n          to fill more of the matrix.',
  "matrix guided builder link"
);
replace(
  "components/more-page.tsx",
  'const ADVANCED_TOOLS = [\n',
  'const ADVANCED_TOOLS = [\n  {\n    href: "/build",\n    icon: FlaskConical,\n    title: "Build wider system",\n    description: "Add group, organisation and nation-state needs",\n  },\n',
  "builder advanced tool"
);

// Offline application shell and visible connection state.
write(
  "components/service-worker-registration.tsx",
  `"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // The app remains usable online when registration is unavailable.
    });
  }, []);
  return null;
}
`
);
write(
  "components/offline-status.tsx",
  `"use client";

import { useEffect, useState } from "react";

export function OfflineStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (online) return null;
  return (
    <div role="status" className="sticky top-0 z-50 bg-warn px-3 py-2 text-center text-sm font-semibold text-black">
      Offline — using the copy stored on this device. Changes remain local.
    </div>
  );
}
`
);
write(
  "public/sw.js",
  `const CACHE = "scim-shell-v0.7.1";
const SHELL = ["/", "/map", "/matrix", "/emergency", "/more", "/build", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        SHELL.map((url) =>
          fetch(url)
            .then((response) => response.ok && cache.put(url, response.clone()))
            .catch(() => undefined)
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
`
);
replace(
  "app/layout.tsx",
  'import { ThemeProvider } from "@/components/theme-provider";\n',
  'import { ThemeProvider } from "@/components/theme-provider";\nimport { OfflineStatus } from "@/components/offline-status";\nimport { ServiceWorkerRegistration } from "@/components/service-worker-registration";\n',
  "offline layout imports"
);
replace(
  "app/layout.tsx",
  '        >\n          <AppNav />\n          <main className="pb-24 md:pb-6">{children}</main>',
  '        >\n          <ServiceWorkerRegistration />\n          <OfflineStatus />\n          <AppNav />\n          <main className="pb-24 md:pb-6">{children}</main>',
  "offline layout components"
);
replace(
  "public/manifest.webmanifest",
  '"description": "Map the infrastructure that protects you from the six ways to die, see what it depends on, and know what to do when it fails."',
  '"description": "Map the infrastructure and social systems that meet vital needs, test failures, and plan resilient responses."',
  "manifest description"
);

// Automated semantic regression tests.
write(
  "tests/needs.test.ts",
  `import { describe, expect, it } from "vitest";
import { createPersonalStarterDocument } from "../lib/scim/personal-starter";
import { assessDocument } from "../lib/scim/needs";

function withStatus(id: string, status: "normal" | "degraded" | "failed") {
  const document = createPersonalStarterDocument();
  return {
    ...document,
    entities: document.entities.map((entity) =>
      entity.id === id ? { ...entity, status } : entity
    ),
  };
}

describe("need availability", () => {
  it("treats a degraded sole protector as at risk rather than absent", () => {
    const result = assessDocument(withStatus("heating", "degraded"));
    expect(result.needs.find((need) => need.threat.id === "too-cold")?.status).toBe("at-risk");
  });

  it("treats a failed sole protector as unprotected", () => {
    const result = assessDocument(withStatus("heating", "failed"));
    expect(result.needs.find((need) => need.threat.id === "too-cold")?.status).toBe("unprotected");
  });
});
`
);
write(
  "tests/mutations.test.ts",
  `import { describe, expect, it } from "vitest";
import { createPersonalStarterDocument } from "../lib/scim/personal-starter";
import { removeEntityFromDocument, removeRelationshipFromDocument } from "../lib/scim/mutations";
import { ScimDocumentSchema } from "../lib/scim/schema";

function referencesEntity(change: ReturnType<typeof createPersonalStarterDocument>["scenarios"][number]["changes"][number], id: string) {
  if (change.operation === "set-entity-status") return change.entityId === id;
  if (change.operation === "add-entity") return change.entity.id === id;
  if (change.operation === "add-relationship") return change.relationship.from === id || change.relationship.to === id;
  return false;
}

describe("referentially safe mutations", () => {
  it("removes an entity from semantics, scenarios and views", () => {
    const next = removeEntityFromDocument(createPersonalStarterDocument(), "grid");
    expect(() => ScimDocumentSchema.parse(next)).not.toThrow();
    expect(next.entities.some((entity) => entity.id === "grid")).toBe(false);
    expect(next.relationships.some((relationship) => relationship.from === "grid" || relationship.to === "grid")).toBe(false);
    expect(next.scenarios.flatMap((scenario) => scenario.changes).some((change) => referencesEntity(change, "grid"))).toBe(false);
    expect(next.views.some((view) => view.type === "radial" && view.nodes.some((node) => node.entityId === "grid"))).toBe(false);
  });

  it("removes relationship routes and scenario status changes", () => {
    const next = removeRelationshipFromDocument(createPersonalStarterDocument(), "grid-hospital");
    expect(() => ScimDocumentSchema.parse(next)).not.toThrow();
    expect(next.relationships.some((relationship) => relationship.id === "grid-hospital")).toBe(false);
    expect(next.views.some((view) => view.type === "radial" && view.routes.some((route) => route.relationshipId === "grid-hospital"))).toBe(false);
  });
});
`
);
write(
  "tests/inam.test.ts",
  `import { describe, expect, it } from "vitest";
import { createPersonalStarterDocument } from "../lib/scim/personal-starter";
import { buildInamMatrix } from "../lib/scim/inam";

it("projects upstream dependencies into the INAM row", () => {
  const matrix = buildInamMatrix(createPersonalStarterDocument());
  const thirst = matrix.groups.flatMap((group) => group.rows).find((row) => row.need.id === "thirst");
  const entities = thirst?.cells.flatMap((cell) => cell.entities) ?? [];
  expect(entities.find((entity) => entity.id === "tap-water")?.role).toBe("direct");
  expect(entities.find((entity) => entity.id === "water-works")?.role).toBe("upstream");
  expect(entities.find((entity) => entity.id === "grid")?.distance).toBe(2);
});
`
);
write(
  "tests/roundtrip.test.ts",
  `import { expect, it } from "vitest";
import { createPersonalStarterDocument } from "../lib/scim/personal-starter";
import { parseScimDsl } from "../lib/scim/parser";
import { serializeScimDsl } from "../lib/scim/serializer";

it("round-trips the shipped starter model", () => {
  const original = createPersonalStarterDocument();
  expect(parseScimDsl(serializeScimDsl(original))).toEqual(original);
});
`
);

// Documentation and release record.
replaceAllChecked("README.md", /0\.7\.0/g, "0.7.1", 1, "README version");
replace(
  "README.md",
  '| `/matrix` | The canonical INAM needs matrix — the eighteen needs across the four tiers, read against the layers of provision |',
  '| `/matrix` | Derived INAM dependency projection — the eighteen needs across the four tiers and every direct/upstream provider by layer |\n| `/build` | Guided authoring for group, organisation and nation-state needs |',
  "README build route"
);
replace(
  "README.md",
  'The production application should deploy from `main`. The interface displays application, schema and build information so a deployed build can be checked against the repository commit.',
  'The production application should deploy from `main`. The interface displays application and schema versions. The application shell and visited same-origin resources are cached by a service worker so an installed or previously opened copy can start without connectivity; browser-local models and revisions remain on the device.',
  "README offline statement"
);
replace(
  "docs/architecture.md",
  "Status: current application architecture for SCIM Mapper v0.5.0 and SCIM schema 0.2.",
  "Status: current application architecture for SCIM Mapper v0.7.1 and SCIM schema 0.2.",
  "architecture version"
);
replace(
  "docs/architecture.md",
  "All accepted work converges on one validated `ScimDocument`.\n",
  `All accepted work converges on one validated \`ScimDocument\`.

The current product surfaces are Home (plain-language individual needs), Emergency (reported operating state and propagated impact), Map (canonical radial authoring), Matrix (a deterministic direct-and-upstream dependency projection), Build (guided higher-tier authoring), Model (text authoring) and Review (selective proposal acceptance). They use the same browser-local document/revision contract. A service worker caches the application shell for offline start-up; this does not turn local storage into an encrypted or durable backup.
`,
  "architecture current surfaces"
);
replace(
  "docs/implementation-status.md",
  "Status: current as of application 0.5.0 and SCIM schema 0.2.",
  "Status: current as of application 0.7.1 and SCIM schema 0.2.",
  "implementation version"
);
replace(
  "docs/implementation-status.md",
  "| INAM rows, columns and cells | yes | yes | yes | not exposed | source only |",
  "| explicit INAM rows, columns and cells | yes | yes | yes | source-only authored view; Matrix uses deterministic projection | source only |\n| derived INAM dependency projection | derived | n/a | n/a | direct and upstream providers by need/layer | n/a |",
  "implementation INAM status"
);
replace(
  "docs/implementation-status.md",
  "| human/AI revisions | workspace model | n/a | n/a | yes | Review integration; Model not transactionally synced |",
  "| human/AI revisions | workspace model | n/a | n/a | shared Home/Emergency/Map/Matrix/More contract | Review integration; Model not transactionally synced |\n| offline application shell | n/a | n/a | n/a | service worker caches shell and visited resources | n/a |\n| automated semantic tests | n/a | n/a | n/a | need status, safe deletion, INAM projection, starter round-trip | n/a |",
  "implementation hardening status"
);
replace(
  "CHANGELOG.md",
  "## 0.7.0 — 2026-07-29",
  `## 0.7.1 — 2026-07-29

Hardening release. Schema remains 0.2 and renderer remains \`scim-radial-1\`.

- Corrected degraded/“Struggling” semantics: impaired protection is now available but at risk, rather than treated as completely absent.
- Added referentially safe entity and relationship deletion across scenarios, radial routes and explicit INAM cells.
- Moved the Map onto the same workspace commit/undo implementation used by the other primary screens.
- Defined the displayed INAM matrix as a deterministic dependency projection containing direct providers and traced upstream dependencies.
- Added guided authoring for group, organisation and nation-state needs at \`/build\`.
- Added service-worker application-shell caching and a visible offline-state banner.
- Added Vitest regression coverage and made tests part of CI and \`pnpm verify\`.
- Updated architecture and implementation-status documentation for the current product.

## 0.7.0 — 2026-07-29`,
  "changelog entry"
);
write(
  "docs/decisions/0008-derived-inam-projection.md",
  `# ADR 0008: Display INAM as a deterministic dependency projection

Status: accepted in application 0.7.1. Schema remains 0.2.

## Context

The canonical schema can store an authored INAM view with explicit cells and notes. The user-facing Matrix introduced in 0.7.0 instead derived cells from entities that directly declared a supported need. That omitted the upstream infrastructure chain and left the relationship between authored and derived INAM data ambiguous.

## Decision

The primary Matrix route is a deterministic projection from the accepted semantic model. For each canonical need it includes:

1. entities that directly declare that they meet or protect the need;
2. every upstream provider reachable by following incoming provider-to-receiver relationships;
3. the canonical layer, effective status, direct/upstream role and graph distance of each entity.

View geometry does not create membership. Explicit `ScimInamView` objects remain portable authored views for specialised layouts and notes, but they do not override the primary dependency projection silently.

## Consequences

- The Matrix exposes supply chains rather than only need tags.
- Direct providers and upstream dependencies are visually distinguishable.
- Cycles are handled by shortest-distance de-duplication.
- Relationship direction becomes operationally important to Matrix correctness.
- Future authored annotations must be overlaid explicitly and retain provenance rather than replacing the derived projection.
`
);

console.log("Applied SCIM v0.7.1 hardening changes.");

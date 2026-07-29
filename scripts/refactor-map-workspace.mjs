import fs from "node:fs";

const file = "components/scim-canonical-map-workspace.tsx";
let source = fs.readFileSync(file, "utf8");

function replace(pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`Missing map refactor pattern: ${label}`);
  source = next;
}

replace(
  'import { Label } from "@/components/ui/label";\n',
  'import { Label } from "@/components/ui/label";\nimport { useScimWorkspace } from "@/components/use-scim-workspace";\n',
  "workspace hook import"
);
replace(
  /import \{\n  createScimWorkspaceRevision,\n  loadScimWorkspace,\n  saveScimWorkspace,\n  type ScimWorkspaceRevision,\n\} from "@\/lib\/scim\/workspace";/,
  'import type { ScimWorkspaceRevision } from "@/lib/scim/workspace";',
  "remove local workspace imports"
);
replace(
  /  const initialDocument = useMemo\(\(\) => createPersonalStarterDocument\(\), \[\]\);\n  const \[document, setDocument\] = useState<ScimDocument>\(initialDocument\);\n  const \[revisions, setRevisions\] = useState<ScimWorkspaceRevision\[]>\(\[]\);\n  const \[hydrated, setHydrated\] = useState\(false\);\n/,
  `  const {
    document,
    revisions,
    hydrated,
    commitFrom,
    replaceTransient,
    undo,
    documentRef,
  } = useScimWorkspace();
`,
  "shared workspace state"
);
replace(
  /  const \[selectedEntityId, setSelectedEntityId\] = useState<string>\(\n    initialDocument\.focusEntityId \?\? initialDocument\.entities\[0\]\?\.id \?\? ""\n  \);/,
  '  const [selectedEntityId, setSelectedEntityId] = useState<string>("");',
  "selected entity initial state"
);
replace(
  "  const documentRef = useRef(document);\n",
  "",
  "remove local document ref"
);
replace(
  /  const setDocumentImmediate = useCallback\([\s\S]*?  \}, \[document, hydrated, revisions\]\);\n/,
  `  useEffect(() => {
    if (!hydrated) return;
    if (
      selectedEntityId &&
      document.entities.some((entity) => entity.id === selectedEntityId)
    ) {
      return;
    }
    setSelectedEntityId(
      document.focusEntityId ?? document.entities[0]?.id ?? ""
    );
  }, [document.entities, document.focusEntityId, hydrated, selectedEntityId]);
`,
  "remove local hydration and persistence"
);
replace(
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
      recordAcceptedChange(documentRef.current, next, label, "human");
    },
    [documentRef, recordAcceptedChange]
  );

  const pointFromEvent =`,
  "shared commit functions"
);
replace(
  /    setDocumentImmediate\(\(current\) =>\n      replaceRadialView\(current, drag\.viewId, \(view\) => \(\{[\s\S]*?      \}\)\)\n    \);/,
  `    replaceTransient(
      replaceRadialView(documentRef.current, drag.viewId, (view) => ({
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
    );`,
  "transient node movement"
);
replace(
  /    const after = ScimDocumentSchema\.parse\(documentRef\.current\);\n    const revision = createScimWorkspaceRevision\(drag\.before, after, \{[\s\S]*?    setMessage\("Node position recorded as a canonical view change\."\);/,
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
  "single drag revision"
);
replace(
  /  const undoLastRevision = \(\) => \{\n    const revision = revisions\.at\(-1\);\n    if \(!revision\) return;\n    setDocumentImmediate\(revision\.before\);\n    setRevisions\(\(current\) => current\.slice\(0, -1\)\);\n    setMessage\(`Undid: \$\{revision\.label\}`\);\n  \};/,
  `  const undoLastRevision = () => {
    const label = undo();
    if (label) setMessage(\`Undid: \${label}\`);
  };`,
  "shared undo"
);

fs.writeFileSync(file, source);
console.log("Refactored Map onto useScimWorkspace.");

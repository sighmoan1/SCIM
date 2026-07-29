import fs from "node:fs";

function update(file, transform) {
  const source = fs.readFileSync(file, "utf8");
  const next = transform(source);
  if (next === source) throw new Error(`No change made to ${file}`);
  fs.writeFileSync(file, next);
}

function replace(source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`Missing pattern: ${label}`);
  return next;
}

update("components/scim-canonical-map-workspace.tsx", (source) => {
  let next = replace(
    source,
    'import { ScimDocumentSchema, type ScimDocument, type ScimRadialView } from "@/lib/scim/schema";',
    'import { ScimDocumentSchema, type ScimDocument, type ScimRadialView } from "@/lib/scim/schema";\nimport { removeEntityFromDocument, removeRelationshipFromDocument } from "@/lib/scim/mutations";',
    "map mutation import"
  );
  next = replace(
    next,
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
  next = replace(
    next,
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
  return next;
});

update("components/home-dashboard.tsx", (source) =>
  replace(
    source,
    '                key={tier.tier}\n                href="/matrix"',
    '                key={tier.tier}\n                href={`/build?tier=${tier.tier}`}',
    "higher tier builder links"
  )
);

update("components/more-page.tsx", (source) =>
  replace(
    source,
    "const ADVANCED_TOOLS = [\n",
    `const ADVANCED_TOOLS = [
  {
    href: "/build",
    icon: FlaskConical,
    title: "Build wider system",
    description: "Add group, organisation and nation-state needs",
  },
`,
    "More builder link"
  )
);

update("README.md", (source) => {
  let next = replace(
    source,
    "- Application: **0.7.0**",
    "- Application: **0.7.1**",
    "README version"
  );
  next = replace(
    next,
    "| `/matrix` | The canonical INAM needs matrix — the eighteen needs across the four tiers, read against the layers of provision |",
    "| `/matrix` | Derived INAM dependency projection — eighteen needs across four tiers with direct and upstream providers by layer |\n| `/build` | Guided authoring for group, organisation and nation-state needs |",
    "README routes"
  );
  next = replace(
    next,
    "Navigation is a bottom tab bar on phones (Home, Map, Emergency, More) and a top bar on larger screens. The application ships light and dark themes (following the system by default), an installable web app manifest, and an animated six-segment resilience ring summarising need status on Home.",
    "Navigation is a five-item bottom tab bar on phones and a top bar on larger screens. The application ships light and dark themes, an installable web app manifest, an animated six-segment resilience ring, and a service worker that caches the application shell and visited same-origin resources for offline startup.",
    "README mobile/offline description"
  );
  return next;
});

update("docs/architecture.md", (source) => {
  let next = replace(
    source,
    "Status: current application architecture for SCIM Mapper v0.5.0 and SCIM schema 0.2.",
    "Status: current application architecture for SCIM Mapper v0.7.1 and SCIM schema 0.2.",
    "architecture version"
  );
  next = replace(
    next,
    "All accepted work converges on one validated `ScimDocument`.\n",
    "All accepted work converges on one validated `ScimDocument`.\n\nThe current product surfaces are Home (plain-language individual needs), Emergency (reported operating state and propagated impact), Map (canonical radial authoring), Matrix (a deterministic direct-and-upstream dependency projection), Build (guided higher-tier authoring), Model (portable text authoring) and Review (selective proposal acceptance). A service worker caches the application shell for offline startup; browser-local storage remains neither encrypted nor a durable backup.\n",
    "architecture surfaces"
  );
  return next;
});

update("docs/implementation-status.md", (source) => {
  let next = replace(
    source,
    "Status: current as of application 0.5.0 and SCIM schema 0.2.",
    "Status: current as of application 0.7.1 and SCIM schema 0.2.",
    "implementation version"
  );
  next = replace(
    next,
    "| INAM rows, columns and cells | yes | yes | yes | not exposed | source only |",
    "| explicit INAM rows, columns and cells | yes | yes | yes | source-only authored view; Matrix uses a deterministic projection | source only |\n| derived INAM dependency projection | derived | n/a | n/a | direct and upstream providers by need and layer | n/a |",
    "implementation INAM rows"
  );
  next = replace(
    next,
    "| human/AI revisions | workspace model | n/a | n/a | yes | Review integration; Model not transactionally synced |",
    "| human/AI revisions | workspace model | n/a | n/a | yes; shared hook still being adopted by Map | Review integration; Model not transactionally synced |\n| offline application shell | n/a | n/a | n/a | service worker caches shell and visited resources | n/a |\n| automated semantic tests | n/a | n/a | n/a | need status, safe deletion, INAM projection and starter round-trip | n/a |",
    "implementation hardening rows"
  );
  return next;
});

fs.writeFileSync(
  ".github/workflows/verify.yml",
  `name: Verify

on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --no-frozen-lockfile
      - run: pnpm test
      - run: pnpm typecheck
      - run: pnpm build
`
);
fs.unlinkSync("scripts/apply-v071-followup.mjs");
console.log("Applied v0.7.1 follow-up changes.");

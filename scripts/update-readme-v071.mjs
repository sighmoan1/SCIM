import fs from "node:fs";

const file = "README.md";
let source = fs.readFileSync(file, "utf8");

function replace(pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`Missing README pattern: ${label}`);
  source = next;
}

replace(
  "The production application should deploy from `main`. The interface displays application, schema and build information so a deployed build can be checked against the repository commit.",
  "The production application should deploy from `main`. The interface displays the application and schema versions. Deployment status is verified against the `main` commit through GitHub and Vercel checks.",
  "version statement"
);
replace(
  "The primary `/` route now uses native Pointer Events, pointer capture, explicit Navigate/Edit modes and canonical view revisions.",
  "The primary `/map` route now uses native Pointer Events, pointer capture, explicit Navigate/Edit modes and canonical view revisions.",
  "Map route"
);
replace(
  `See [ADR 0006](docs/decisions/0006-needs-first-interface.md).

## Current architecture`,
  `See [ADR 0006](docs/decisions/0006-needs-first-interface.md).

### Decision 14: ground the product in all four canonical tiers

The six individual needs are the accessible entry point, not the whole SCIM model. The canonical taxonomy also includes the needs of groups, organisations and nation-states, alongside layers of provision and service-delivery paths.

**Consequences:**

- Home may foreground individual survival while Matrix and Build expose the wider cooperative system;
- the same \`ScimDocument\` supports individual, group, organisational, state and integrated perspectives;
- supplementary crisis-planning material may extend the workflow but does not redefine the canonical taxonomy;
- examples and AI handoffs must not imply that SCIM ends with the six ways to die.

See [ADR 0007](docs/decisions/0007-canonical-four-tiers-and-inam.md).

### Decision 15: display INAM as a derived dependency projection

The primary Matrix is calculated from canonical need declarations and directed provider-to-receiver relationships. It shows both direct providers and every traced upstream dependency, grouped by layer. Explicit authored INAM views remain available for specialist layouts and notes, but they do not silently override the derived semantic projection.

**Consequences:**

- the Matrix reveals infrastructure chains rather than only direct need tags;
- direct and upstream providers remain visibly distinct;
- relationship direction affects Matrix correctness;
- view geometry never creates Matrix membership;
- changes to projection logic require semantic regression tests.

See [ADR 0008](docs/decisions/0008-derived-inam-projection.md).

## Current architecture`,
  "new design decisions"
);
replace(
  `lib/scim/workspace.ts        accepted local state and revisions
lib/scim/legacy-adapter.ts   historical mapper conversion`,
  `lib/scim/workspace.ts        accepted local state and revisions
lib/scim/needs.ts            need assessment across four tiers
lib/scim/tiers.ts            canonical tiers, needs, layers and delivery paths
lib/scim/inam.ts             direct/upstream Matrix projection
lib/scim/mutations.ts        referentially safe canonical deletion
lib/scim/guided-tier.ts      guided higher-tier authoring
lib/scim/legacy-adapter.ts   historical mapper conversion`,
  "library architecture list"
);

fs.writeFileSync(file, source);
console.log("Updated README for v0.7.1 decisions.");

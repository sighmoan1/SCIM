# SCIM library API

Status: descriptive guide to the public exports from `lib/scim/index.ts` in application 0.5.0 and schema 0.2.

The library is designed so rendering, parsing, comparison, simulation and collaboration can be used independently of the React interface. Import from the barrel where practical:

```ts
import {
  parseScimMarkdown,
  serializeScimDsl,
  applyScenario,
  compareScimDocuments,
} from "@/lib/scim";
```

## Boundary rule

Public functions generally validate complete documents with `ScimDocumentSchema`. Treat parsing, local-storage loading, legacy conversion, AI proposals and selective acceptance as untrusted boundaries.

Do not bypass validation by casting arbitrary objects to `ScimDocument`.

## Schema and types

Source: `lib/scim/schema.ts`

Important values and schemas include:

- `STANDARD_SCIM_LAYERS`
- `STANDARD_SCIM_THREATS`
- `STANDARD_SCIM_NEEDS`
- `STANDARD_SCIM_FAILURE_MODES`
- `STANDARD_SCIM_SERVICE_EFFECTS`
- `ExtensibleIdentifierSchema`
- `ScimPerspectiveSchema`
- `EntityStatusSchema`
- `DeliveryModeSchema`
- `EvidenceSchema`
- `ScimEntitySchema`
- `ScimRelationshipSchema`
- `ScenarioChangeSchema`
- `ScimScenarioSchema`
- `ScimRadialViewSchema`
- `ScimInamViewSchema`
- `ScimDocumentSchema`

Frequently used inferred types:

- `ScimDocument`
- `ScimEntity`
- `ScimRelationship`
- `ScimScenario`
- `ScenarioChange`
- `ScimRadialView`
- `ScimInamView`
- `ScimView`
- `Evidence`
- `EntityStatus`
- `DeliveryMode`

See [`canonical-model-reference.md`](canonical-model-reference.md).

## Parsing

Source: `lib/scim/parser.ts`

### `extractScimBlocks(markdown)`

```ts
function extractScimBlocks(markdown: string): string[]
```

Returns the contents of fenced `scim` blocks. SCIM 0.2 supports exactly one model block per portable Markdown document.

### `parseScimMarkdown(markdown)`

```ts
function parseScimMarkdown(markdown: string): ScimDocument
```

Extracts one fenced block, parses it and validates the canonical document.

Throws `ScimSyntaxError` when:

- no fenced block exists;
- more than one fenced SCIM model exists;
- syntax cannot be parsed;
- canonical validation fails.

### `parseScimDsl(source)`

```ts
function parseScimDsl(source: string): ScimDocument
```

Parses raw SCIM DSL and returns a validated canonical document.

### `ScimSyntaxError`

```ts
class ScimSyntaxError extends Error {
  readonly errors: ScimParseError[];
}

interface ScimParseError {
  line: number;
  message: string;
}
```

UI code should display individual errors rather than only the combined exception message.

## Serialisation and graph export

Source: `lib/scim/serializer.ts`

### `serializeScimDsl(document)`

```ts
function serializeScimDsl(input: ScimDocument): string
```

Returns canonical SCIM DSL with stable ordering. It validates the input first.

Use this for authoritative source export and revision comparison display.

### `serializeScimMarkdown(document)`

```ts
function serializeScimMarkdown(input: ScimDocument): string
```

Returns a Markdown document containing title, optional description and one fenced SCIM block.

### `serializeMermaid(document)`

```ts
function serializeMermaid(input: ScimDocument): string
```

Returns a left-to-right Mermaid dependency graph. This is a derived generic graph, not a replacement for the authoritative SCIM source or radial view.

### `serializeDot(document)`

```ts
function serializeDot(input: ScimDocument): string
```

Returns Graphviz DOT for the directed entity graph.

Mermaid and DOT exports currently represent entities and relationships but not the complete scenario, evidence, requirement or view model.

## Deterministic radial rendering

Source: `lib/scim/radial-svg.ts`

### `SCIM_RADIAL_RENDERER_PROFILE`

The immutable constants for renderer `scim-radial-1`, including:

- font family and dimensions;
- ring palette;
- sector styling;
- relationship styling;
- node corner radius;
- status styles.

Do not mutate or silently change these values for the existing profile.

### `serializeScimRadialSvg(document, viewId?)`

```ts
function serializeScimRadialSvg(
  input: ScimDocument,
  viewId?: string
): string
```

Returns one self-contained, escaped SVG string for the selected radial view.

Behaviour includes:

- canonical validation;
- selected or default radial-view resolution;
- declared canvas as `viewBox`;
- sorted rings and sectors;
- explicit routes or straight source-to-target fallback;
- edges before nodes;
- deterministic wrapping and status styling;
- accessible SVG title and description.

It throws when no suitable radial view can be resolved or the document is invalid.

See [`scim-radial-1.md`](scim-radial-1.md).

## Text-only structure and AI handoff

Sources: `lib/scim/structure.ts`, `lib/scim/handoff.ts`

### `serializeScimStructure(document)`

```ts
function serializeScimStructure(input: ScimDocument): string
```

Returns a deterministic entirely text-based reading of:

- perspective and focus;
- semantic entities;
- directed relationships;
- dependency requirements;
- scenarios;
- radial and INAM view structure;
- interpretation rules.

Use this for accessible inspection and AI reasoning that must not depend on rendered geometry.

### `SCIM_CHAT_RENDER_INSTRUCTIONS`

The current model-independent instructions for AI interpretation and exact `scim-radial-1` rendering.

When language, requirement or renderer interpretation changes, update this constant and the associated documentation together.

### `serializeScimAiHandoff(document)`

```ts
function serializeScimAiHandoff(input: ScimDocument): string
```

Returns portable Markdown containing:

- schema and renderer identifiers;
- AI interpretation and rendering rules;
- text-only structural reading;
- authoritative complete SCIM block.

The handoff does not call an AI provider.

## Dependency requirements

Source: `lib/scim/requirements.ts`

### `RequirementPolicySchema`

```ts
type RequirementPolicy = "all" | "any" | "at-least";
```

### `extractDependencyRequirements(document)`

```ts
function extractDependencyRequirements(
  input: ScimDocument
): DependencyRequirementResult
```

Groups relationships by `requirement-group`, normalises policy and thresholds and returns requirements plus warnings.

It does not mutate the document.

### `evaluateDependencyRequirements(document)`

```ts
function evaluateDependencyRequirements(
  input: ScimDocument
): {
  evaluations: DependencyRequirementEvaluation[];
  warnings: string[];
}
```

Calculates available and unavailable provider relationship IDs, satisfaction and explanation text for each explicit requirement.

See [`dependency-requirements.md`](dependency-requirements.md) and [`scenario-and-requirement-engine.md`](scenario-and-requirement-engine.md).

## Scenario application and propagation

Source: `lib/scim/simulation.ts`

### `applyScenario(document, scenarioOrId)`

```ts
function applyScenario(
  input: ScimDocument,
  scenarioOrId: ScimScenario | string
): SimulationResult
```

Applies explicit scenario operations to cloned entities and relationships and returns a validated simulated document.

Throws when a named scenario is unknown.

### `propagateCriticalFailures(document, options?)`

```ts
function propagateCriticalFailures(
  input: ScimDocument,
  options?: PropagationOptions
): SimulationResult
```

Evaluates explicit dependency requirements, then applies the conservative fallback rule to targets without explicit requirements until stable or the pass limit is reached.

### `SimulationResult`

```ts
interface SimulationResult {
  document: ScimDocument;
  changedEntityIds: string[];
  changedRelationshipIds: string[];
  warnings: string[];
  explanations: string[];
}
```

Simulation results are derived analysis. Do not save them as the accepted baseline without an explicit user action and revision.

## Canonical comparison

Source: `lib/scim/diff.ts`

### `compareScimDocuments(baseline, candidate)`

```ts
function compareScimDocuments(
  baselineInput: ScimDocument,
  candidateInput: ScimDocument
): ScimDocumentDiff
```

Validates both complete documents and produces deterministic object-level changes for:

- model metadata;
- entities;
- relationships;
- scenarios;
- views.

The result includes semantic, scenario and view counts.

### `ScimDocumentChange`

Contains:

- stable review key;
- area;
- add/remove/change kind;
- object ID;
- summary;
- changed fields;
- structured before and after values.

Comparison is structural and uses stable object IDs. It does not calculate semantic equivalence between different graph formulations.

## Selective application

Source: `lib/scim/diff-apply.ts`

### `applySelectedScimChanges(baseline, candidate, selectedKeys)`

```ts
function applySelectedScimChanges(
  baselineInput: ScimDocument,
  candidateInput: ScimDocument,
  selectedKeys: Iterable<string>
): ApplyScimChangesResult
```

Applies selected object-level operations to a clone of the baseline and validates the complete result.

```ts
interface ApplyScimChangesResult {
  document: ScimDocument | null;
  errors: string[];
}
```

An invalid partial result returns `document: null` and path-aware errors rather than throwing the broken result into accepted state.

## Proposal protocol

Source: `lib/scim/proposal.ts`

### `parseScimProposal(markdown)`

```ts
function parseScimProposal(markdown: string): ScimProposal
```

Extracts title, rationale, assumptions, open questions and the complete candidate document.

### `serializeScimProposal(proposal)`

```ts
function serializeScimProposal(
  input: Omit<ScimProposal, "source">
): string
```

Returns the standard reviewable proposal Markdown format.

### `serializeScimProposalRequest(baseline, request?)`

```ts
function serializeScimProposalRequest(
  baselineInput: ScimDocument,
  request?: string
): string
```

Returns a provider-neutral request containing the task, required response shape and complete AI handoff.

See [`ai-collaboration-protocol.md`](ai-collaboration-protocol.md).

## Workspace and revisions

Source: `lib/scim/workspace.ts`

### Storage keys

```ts
SCIM_WORKSPACE_DOCUMENT_KEY = "scim.workspace.document.v1"
SCIM_WORKSPACE_REVISIONS_KEY = "scim.workspace.revisions.v1"
```

### `createScimWorkspaceRevision(before, after, options)`

```ts
function createScimWorkspaceRevision(
  beforeInput: ScimDocument,
  afterInput: ScimDocument,
  options: { origin: "human" | "ai"; label: string }
): ScimWorkspaceRevision | null
```

Returns `null` when the documents are canonically equivalent.

### `loadScimWorkspace(storage, fallback)`

```ts
function loadScimWorkspace(
  storage: Pick<Storage, "getItem">,
  fallback: ScimDocument
): ScimWorkspaceSnapshot
```

Loads and validates browser-local state, falling back safely when stored data is malformed.

### `saveScimWorkspace(storage, snapshot)`

```ts
function saveScimWorkspace(
  storage: Pick<Storage, "setItem">,
  snapshot: ScimWorkspaceSnapshot
): void
```

Validates the accepted document and stores at most the latest 100 revisions.

See [`workspace-and-revisions.md`](workspace-and-revisions.md).

## Legacy conversion

Source: `lib/scim/legacy-adapter.ts`

### `legacyMapToScim(legacy, options?)`

```ts
function legacyMapToScim(
  legacy: LegacyInfrastructureMap,
  options?: { id?: string; title?: string; description?: string }
): AdaptedLegacyMap
```

Converts legacy semantic and layout data into a validated SCIM 0.2 document plus compatibility layout.

### `scimToLegacyMap(document, layout, exportedAt?)`

```ts
function scimToLegacyMap(
  document: ScimDocument,
  layout: ScimLayout,
  exportedAt?: string
): LegacyInfrastructureMap
```

Converts compatible canonical fields back into the historical export shape. Canonical features unsupported by the legacy format may be lost.

See [`legacy-migration.md`](legacy-migration.md).

## Default model

Source: `lib/scim/default-model.ts`

### `DEFAULT_SCIM_SOURCE`

The synthetic authoritative SCIM source used for the default hospital-resilience workspace.

### `createDefaultScimDocument()`

```ts
function createDefaultScimDocument(): ScimDocument
```

Parses the default source each time and returns a validated document.

Do not mutate and reuse a shared document object as global state.

## Error-handling guidance

- Parser functions throw `ScimSyntaxError`.
- Schema `.parse` functions throw `ZodError`.
- Selective application returns structured errors.
- Simulation returns warnings for recoverable runtime issues and may throw for an unknown named scenario.
- Renderer and handoff functions validate first and may throw for invalid documents or missing required views.
- Workspace loading deliberately catches malformed persisted data and returns a fallback.

UI code should convert technical paths into understandable messages while retaining object IDs for diagnosis.

## Stability guidance

The barrel export is convenient but not yet a formally versioned external npm package API.

Future collaborators should nevertheless treat these as internal contracts used across the application:

- canonical schema and portable text;
- deterministic renderer profile;
- proposal response shape;
- revision origin and storage keys;
- diff operation areas and keys;
- scenario and requirement explanations.

Breaking changes require documentation, tests, migration and a compatibility decision.
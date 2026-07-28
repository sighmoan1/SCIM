import { ScimDocumentSchema, type ScimDocument } from "./schema";

export interface ScimParseError {
  line: number;
  message: string;
}

export class ScimSyntaxError extends Error {
  constructor(public readonly errors: ScimParseError[]) {
    super(errors.map((error) => `Line ${error.line}: ${error.message}`).join("\n"));
    this.name = "ScimSyntaxError";
  }
}

function unquote(value: string): string {
  return value.trim().replace(/^"|"$/g, "");
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => unquote(item))
      .filter(Boolean);
  }
  return unquote(trimmed);
}

export function extractScimBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const pattern = /```scim\s*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(markdown))) blocks.push(match[1]);
  return blocks;
}

export function parseScimMarkdown(markdown: string): ScimDocument {
  const blocks = extractScimBlocks(markdown);
  if (blocks.length === 0) {
    throw new ScimSyntaxError([{ line: 1, message: "No fenced scim block found" }]);
  }
  if (blocks.length > 1) {
    throw new ScimSyntaxError([
      { line: 1, message: "Version 0.1 supports one scim model per document" },
    ]);
  }
  return parseScimDsl(blocks[0]);
}

export function parseScimDsl(source: string): ScimDocument {
  const lines = source.split(/\r?\n/);
  const errors: ScimParseError[] = [];
  const entities: Array<Record<string, unknown>> = [];
  const relationships: Array<Record<string, unknown>> = [];
  const scenarios: Array<Record<string, unknown>> = [];
  let model: { id: string; title: string } | undefined;
  let current:
    | { type: "entity"; value: Record<string, unknown> }
    | { type: "relationship"; value: Record<string, unknown> }
    | { type: "scenario"; value: Record<string, unknown> }
    | undefined;
  let relationshipCounter = 0;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) return;

    const modelMatch = line.match(/^model\s+([\w-]+)\s+"([^"]+)"\s*\{$/);
    if (modelMatch) {
      model = { id: modelMatch[1], title: modelMatch[2] };
      return;
    }

    const entityMatch = line.match(/^entity\s+([\w-]+)\s+"([^"]+)"\s*\{$/);
    if (entityMatch) {
      const value = {
        id: entityMatch[1],
        name: entityMatch[2],
        description: "",
        kind: "service",
        layer: "individual",
        status: "normal",
        protectsAgainst: [],
        attributes: {},
        evidence: [],
      };
      entities.push(value);
      current = { type: "entity", value };
      return;
    }

    const relationshipMatch = line.match(/^([\w-]+)\s*->\s*([\w-]+)\s*\{$/);
    if (relationshipMatch) {
      const value = {
        id: `relationship-${++relationshipCounter}`,
        from: relationshipMatch[1],
        to: relationshipMatch[2],
        kind: "depends-on",
        status: "normal",
        critical: false,
        attributes: {},
        evidence: [],
      };
      relationships.push(value);
      current = { type: "relationship", value };
      return;
    }

    const scenarioMatch = line.match(/^scenario\s+([\w-]+)\s+"([^"]+)"\s*\{$/);
    if (scenarioMatch) {
      const value = {
        id: scenarioMatch[1],
        name: scenarioMatch[2],
        description: "",
        changes: [],
      };
      scenarios.push(value);
      current = { type: "scenario", value };
      return;
    }

    if (line === "}") {
      if (current) current = undefined;
      return;
    }

    if (current?.type === "scenario") {
      const statusMatch = line.match(/^set\s+([\w-]+)\s+status\s+(normal|degraded|failed|new)$/);
      if (statusMatch) {
        (current.value.changes as unknown[]).push({
          operation: "set-entity-status",
          entityId: statusMatch[1],
          status: statusMatch[2],
        });
        return;
      }
    }

    const propertyMatch = line.match(/^([\w-]+)\s*:\s*(.+)$/);
    if (propertyMatch && current) {
      const [, key, rawValue] = propertyMatch;
      const value = parseScalar(rawValue);
      if (current.type === "entity") {
        if (key === "kind") current.value.kind = value;
        else if (key === "layer") current.value.layer = value;
        else if (key === "status") current.value.status = value;
        else if (key === "description") current.value.description = value;
        else if (key === "protects-against") current.value.protectsAgainst = value;
        else (current.value.attributes as Record<string, unknown>)[key] = value;
      } else if (current.type === "relationship") {
        if (key === "id") current.value.id = value;
        else if (key === "kind") current.value.kind = value;
        else if (key === "mode") current.value.deliveryMode = value;
        else if (key === "status") current.value.status = value;
        else if (key === "critical") current.value.critical = value;
        else (current.value.attributes as Record<string, unknown>)[key] = value;
      } else if (key === "description") current.value.description = value;
      return;
    }

    errors.push({ line: lineNumber, message: `Could not parse: ${line}` });
  });

  if (!model) errors.push({ line: 1, message: "Missing model declaration" });
  if (errors.length) throw new ScimSyntaxError(errors);

  const parsed = ScimDocumentSchema.safeParse({
    schemaVersion: "0.1",
    id: model!.id,
    title: model!.title,
    description: "",
    entities,
    relationships,
    scenarios,
  });

  if (!parsed.success) {
    throw new ScimSyntaxError(
      parsed.error.issues.map((issue) => ({
        line: 1,
        message: `${issue.path.join(".")}: ${issue.message}`,
      }))
    );
  }
  return parsed.data;
}

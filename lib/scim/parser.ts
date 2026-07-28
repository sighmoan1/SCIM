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

type Draft = Record<string, any>;

type CurrentBlock =
  | { type: "entity"; value: Draft }
  | { type: "relationship"; value: Draft }
  | { type: "scenario"; value: Draft }
  | { type: "radial-view"; value: Draft }
  | { type: "inam-view"; value: Draft };

function stripComment(value: string): string {
  let quoted = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (character === '"') {
      quoted = !quoted;
      continue;
    }
    if (character === "#" && !quoted) return value.slice(0, index);
  }

  return value;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return parseList(trimmed);
  }
  return unquote(trimmed);
}

function parseList(value: string): string[] {
  const trimmed = value.trim();
  const body = trimmed.startsWith("[") && trimmed.endsWith("]")
    ? trimmed.slice(1, -1)
    : trimmed;

  return body
    .split(",")
    .map((item) => unquote(item))
    .filter(Boolean);
}

function parsePoints(value: string): Array<{ x: number; y: number }> | null {
  const points = value.split(",").map((item) => item.trim());
  const parsed: Array<{ x: number; y: number }> = [];

  for (const point of points) {
    const match = point.match(/^(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$/);
    if (!match) return null;
    parsed.push({ x: Number(match[1]), y: Number(match[2]) });
  }

  return parsed.length >= 2 ? parsed : null;
}

function parseJsonLine(
  value: string,
  line: number,
  label: string,
  errors: ScimParseError[]
): unknown | undefined {
  try {
    return JSON.parse(value);
  } catch (error) {
    errors.push({
      line,
      message: `${label} must contain valid JSON: ${
        error instanceof Error ? error.message : "invalid JSON"
      }`,
    });
    return undefined;
  }
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
      { line: 1, message: "Language version 0.2 supports one scim model per document" },
    ]);
  }
  return parseScimDsl(blocks[0]);
}

export function parseScimDsl(source: string): ScimDocument {
  const lines = source.split(/\r?\n/);
  const errors: ScimParseError[] = [];
  const entities: Draft[] = [];
  const relationships: Draft[] = [];
  const scenarios: Draft[] = [];
  const views: Draft[] = [];
  let model: Draft | undefined;
  let current: CurrentBlock | undefined;
  let relationshipCounter = 0;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = stripComment(rawLine).trim();
    if (!line) return;

    const modelMatch = line.match(/^model\s+([\w-]+)\s+"([^"]+)"\s*\{$/);
    if (modelMatch) {
      model = {
        id: modelMatch[1],
        title: modelMatch[2],
        description: "",
        perspective: "individual",
      };
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
        supportsNeeds: [],
        protectsAgainst: [],
        failureModes: [],
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
        serviceEffects: [],
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

    const viewMatch = line.match(
      /^view\s+([\w-]+)\s+(radial|inam)\s+"([^"]+)"\s*\{$/
    );
    if (viewMatch) {
      const [, id, type, name] = viewMatch;
      if (type === "radial") {
        const value = {
          id,
          name,
          type: "radial",
          renderer: "scim-radial-1",
          layout: "automatic",
          canvas: { width: 1000, height: 1000 },
          centre: { x: 500, y: 500 },
          showSegments: true,
          rings: [],
          sectors: [],
          nodes: [],
          routes: [],
        };
        views.push(value);
        current = { type: "radial-view", value };
      } else {
        const value = {
          id,
          name,
          type: "inam",
          renderer: "scim-inam-1",
          rowNeeds: [],
          columns: [],
          cells: [],
        };
        views.push(value);
        current = { type: "inam-view", value };
      }
      return;
    }

    if (line === "}") {
      if (current) current = undefined;
      return;
    }

    if (current?.type === "scenario") {
      const relationshipStatusMatch = line.match(
        /^set\s+relationship\s+([\w-]+)\s+status\s+(normal|degraded|failed|new)$/
      );
      if (relationshipStatusMatch) {
        current.value.changes.push({
          operation: "set-relationship-status",
          relationshipId: relationshipStatusMatch[1],
          status: relationshipStatusMatch[2],
        });
        return;
      }

      const entityStatusMatch = line.match(
        /^set(?:\s+entity)?\s+([\w-]+)\s+status\s+(normal|degraded|failed|new)$/
      );
      if (entityStatusMatch) {
        current.value.changes.push({
          operation: "set-entity-status",
          entityId: entityStatusMatch[1],
          status: entityStatusMatch[2],
        });
        return;
      }

      const addEntityJsonMatch = line.match(/^add\s+entity-json\s+(.+)$/);
      if (addEntityJsonMatch) {
        const entity = parseJsonLine(
          addEntityJsonMatch[1],
          lineNumber,
          "entity-json",
          errors
        );
        if (entity !== undefined) {
          current.value.changes.push({ operation: "add-entity", entity });
        }
        return;
      }

      const addRelationshipJsonMatch = line.match(
        /^add\s+relationship-json\s+(.+)$/
      );
      if (addRelationshipJsonMatch) {
        const relationship = parseJsonLine(
          addRelationshipJsonMatch[1],
          lineNumber,
          "relationship-json",
          errors
        );
        if (relationship !== undefined) {
          current.value.changes.push({
            operation: "add-relationship",
            relationship,
          });
        }
        return;
      }

      const addEntityMatch = line.match(
        /^add\s+entity\s+([\w-]+)\s+"([^"]+)"\s+kind\s+([\w-]+)\s+layer\s+([\w-]+)$/
      );
      if (addEntityMatch) {
        current.value.changes.push({
          operation: "add-entity",
          entity: {
            id: addEntityMatch[1],
            name: addEntityMatch[2],
            description: "",
            kind: addEntityMatch[3],
            layer: addEntityMatch[4],
            status: "new",
            supportsNeeds: [],
            protectsAgainst: [],
            failureModes: [],
            attributes: {},
            evidence: [],
          },
        });
        return;
      }

      const addRelationshipMatch = line.match(
        /^add\s+relationship\s+([\w-]+)\s*->\s*([\w-]+)\s+id\s+([\w-]+)\s+kind\s+([\w-]+)(?:\s+mode\s+([\w-]+))?(?:\s+critical\s+(true|false))?$/
      );
      if (addRelationshipMatch) {
        current.value.changes.push({
          operation: "add-relationship",
          relationship: {
            id: addRelationshipMatch[3],
            from: addRelationshipMatch[1],
            to: addRelationshipMatch[2],
            kind: addRelationshipMatch[4],
            deliveryMode: addRelationshipMatch[5],
            status: "new",
            critical: addRelationshipMatch[6] === "true",
            serviceEffects: [],
            attributes: {},
            evidence: [],
          },
        });
        return;
      }
    }

    if (current?.type === "radial-view") {
      const ringMatch = line.match(
        /^ring\s+([\w-]+)\s+radius\s+(-?\d+(?:\.\d+)?)(?:\s+label-angle\s+(-?\d+(?:\.\d+)?))?$/
      );
      if (ringMatch) {
        current.value.rings.push({
          layer: ringMatch[1],
          radius: Number(ringMatch[2]),
          labelAngle: ringMatch[3] ? Number(ringMatch[3]) : -90,
        });
        return;
      }

      const sectorMatch = line.match(
        /^sector\s+([\w-]+)\s+angle\s+(\d+(?:\.\d+)?)$/
      );
      if (sectorMatch) {
        current.value.sectors.push({
          need: sectorMatch[1],
          angle: Number(sectorMatch[2]),
        });
        return;
      }

      const placementMatch = line.match(
        /^place\s+([\w-]+)\s+at\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)(?:\s+size\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?))?$/
      );
      if (placementMatch) {
        current.value.nodes.push({
          entityId: placementMatch[1],
          x: Number(placementMatch[2]),
          y: Number(placementMatch[3]),
          width: placementMatch[4] ? Number(placementMatch[4]) : 100,
          height: placementMatch[5] ? Number(placementMatch[5]) : 36,
        });
        return;
      }

      const routeMatch = line.match(/^route\s+([\w-]+)\s+via\s+(.+)$/);
      if (routeMatch) {
        const points = parsePoints(routeMatch[2]);
        if (!points) {
          errors.push({
            line: lineNumber,
            message: "A route requires at least two comma-separated x y points",
          });
        } else {
          current.value.routes.push({
            relationshipId: routeMatch[1],
            points,
          });
        }
        return;
      }
    }

    if (current?.type === "inam-view") {
      const cellMatch = line.match(
        /^cell\s+([\w-]+)\s+([\w-]+)\s*:\s*(\[[^\]]*\])$/
      );
      if (cellMatch) {
        current.value.cells.push({
          rowNeed: cellMatch[1],
          column: cellMatch[2],
          entityIds: parseList(cellMatch[3]),
        });
        return;
      }
    }

    const propertyMatch = line.match(/^([\w-]+)\s*:\s*(.+)$/);
    if (propertyMatch) {
      const [, key, rawValue] = propertyMatch;
      const value = parseScalar(rawValue);

      if (!current && model) {
        if (key === "perspective") model.perspective = value;
        else if (key === "focus") model.focusEntityId = value;
        else if (key === "description") model.description = value;
        else errors.push({ line: lineNumber, message: `Unknown model property: ${key}` });
        return;
      }

      if (current?.type === "entity") {
        if (key === "kind") current.value.kind = value;
        else if (key === "layer") current.value.layer = value;
        else if (key === "status") current.value.status = value;
        else if (key === "description") current.value.description = value;
        else if (key === "supports") current.value.supportsNeeds = value;
        else if (key === "protects-against") current.value.protectsAgainst = value;
        else if (key === "failure-modes") current.value.failureModes = value;
        else current.value.attributes[key] = value;
        return;
      }

      if (current?.type === "relationship") {
        if (key === "id") current.value.id = value;
        else if (key === "kind") current.value.kind = value;
        else if (key === "mode") current.value.deliveryMode = value;
        else if (key === "status") current.value.status = value;
        else if (key === "critical") current.value.critical = value;
        else if (key === "service-effects") current.value.serviceEffects = value;
        else current.value.attributes[key] = value;
        return;
      }

      if (current?.type === "scenario") {
        if (key === "description") current.value.description = value;
        else errors.push({ line: lineNumber, message: `Unknown scenario property: ${key}` });
        return;
      }

      if (current?.type === "radial-view") {
        if (key === "renderer") current.value.renderer = value;
        else if (key === "layout") current.value.layout = value;
        else if (key === "segments") current.value.showSegments = value;
        else if (key === "canvas") {
          const match = rawValue.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
          if (match) {
            current.value.canvas = { width: Number(match[1]), height: Number(match[2]) };
          } else {
            errors.push({ line: lineNumber, message: "canvas must be: width height" });
          }
        } else if (key === "centre" || key === "center") {
          const match = rawValue.match(
            /^(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$/
          );
          if (match) {
            current.value.centre = { x: Number(match[1]), y: Number(match[2]) };
          } else {
            errors.push({ line: lineNumber, message: "centre must be: x y" });
          }
        } else {
          errors.push({ line: lineNumber, message: `Unknown radial view property: ${key}` });
        }
        return;
      }

      if (current?.type === "inam-view") {
        if (key === "renderer") current.value.renderer = value;
        else if (key === "rows") current.value.rowNeeds = value;
        else if (key === "columns") current.value.columns = value;
        else errors.push({ line: lineNumber, message: `Unknown INAM view property: ${key}` });
        return;
      }
    }

    errors.push({ line: lineNumber, message: `Could not parse: ${line}` });
  });

  if (!model) errors.push({ line: 1, message: "Missing model declaration" });
  if (errors.length) throw new ScimSyntaxError(errors);

  const parsed = ScimDocumentSchema.safeParse({
    schemaVersion: "0.2",
    id: model!.id,
    title: model!.title,
    description: model!.description,
    perspective: model!.perspective,
    focusEntityId: model!.focusEntityId,
    entities,
    relationships,
    scenarios,
    views,
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

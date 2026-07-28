import {
  ScimDocumentSchema,
  type ScimDocument,
  type ScimPoint,
  type ScimRadialView,
} from "./schema";

export const SCIM_RADIAL_RENDERER_PROFILE = {
  id: "scim-radial-1",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 10,
  lineHeight: 12,
  nodeCornerRadius: 6,
  ringColours: [
    "#dcfce7",
    "#bbf7d0",
    "#86efac",
    "#4ade80",
    "#22c55e",
    "#16a34a",
    "#15803d",
  ],
  ringStroke: "#374151",
  ringLabel: "#374151",
  sectorFill: "#ef4444",
  sectorStroke: "#ef4444",
  edge: "#6b7280",
  criticalEdge: "#111827",
  text: "#1f2937",
  statuses: {
    normal: { fill: "#ffffff", stroke: "#65a30d", dash: "" },
    degraded: { fill: "#fef3c7", stroke: "#f59e0b", dash: "3 2" },
    failed: { fill: "#fee2e2", stroke: "#ef4444", dash: "5 5" },
    new: { fill: "#d1fae5", stroke: "#10b981", dash: "" },
  },
} as const;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function number(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
}

function polarPoint(
  centre: ScimPoint,
  radius: number,
  angleDegrees: number
): ScimPoint {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: centre.x + Math.cos(radians) * radius,
    y: centre.y + Math.sin(radians) * radius,
  };
}

function sectorPath(
  centre: ScimPoint,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  let end = endAngle;
  if (end <= startAngle) end += 360;
  const start = polarPoint(centre, radius, startAngle);
  const finish = polarPoint(centre, radius, end);
  const largeArc = end - startAngle > 180 ? 1 : 0;
  return [
    `M ${number(centre.x)} ${number(centre.y)}`,
    `L ${number(start.x)} ${number(start.y)}`,
    `A ${number(radius)} ${number(radius)} 0 ${largeArc} 1 ${number(finish.x)} ${number(finish.y)}`,
    "Z",
  ].join(" ");
}

function annulusPath(centre: ScimPoint, inner: number, outer: number): string {
  const cx = number(centre.x);
  const cy = number(centre.y);
  const outerRadius = number(outer);
  const innerRadius = number(inner);
  const outerRight = number(centre.x + outer);
  const outerLeft = number(centre.x - outer);
  const innerRight = number(centre.x + inner);
  const innerLeft = number(centre.x - inner);

  const outerPath = `M ${outerRight} ${cy} A ${outerRadius} ${outerRadius} 0 1 0 ${outerLeft} ${cy} A ${outerRadius} ${outerRadius} 0 1 0 ${outerRight} ${cy} Z`;
  if (inner <= 0) return outerPath;
  const innerPath = `M ${innerRight} ${cy} A ${innerRadius} ${innerRadius} 0 1 1 ${innerLeft} ${cy} A ${innerRadius} ${innerRadius} 0 1 1 ${innerRight} ${cy} Z`;
  return `${outerPath} ${innerPath}`;
}

export function wrapScimLabel(text: string, width: number): string[] {
  const maxCharacters = Math.max(1, Math.floor((width - 12) / 7));
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharacters) {
      current = candidate;
    } else if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word);
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function getRadialView(document: ScimDocument, viewId?: string): ScimRadialView {
  const view = document.views.find(
    (candidate): candidate is ScimRadialView =>
      candidate.type === "radial" && (!viewId || candidate.id === viewId)
  );
  if (!view) throw new Error(viewId ? `Unknown radial view: ${viewId}` : "No radial view declared");
  return view;
}

function relationshipPoints(
  document: ScimDocument,
  view: ScimRadialView,
  relationshipId: string
): ScimPoint[] | null {
  const route = view.routes.find(
    (candidate) => candidate.relationshipId === relationshipId
  );
  if (route) return route.points;

  const relationship = document.relationships.find(
    (candidate) => candidate.id === relationshipId
  );
  if (!relationship) return null;
  const source = view.nodes.find((node) => node.entityId === relationship.from);
  const target = view.nodes.find((node) => node.entityId === relationship.to);
  if (!source || !target) return null;
  return [
    { x: source.x, y: source.y },
    { x: target.x, y: target.y },
  ];
}

export function serializeScimRadialSvg(
  input: ScimDocument,
  viewId?: string
): string {
  const document = ScimDocumentSchema.parse(input);
  const view = getRadialView(document, viewId);
  const profile = SCIM_RADIAL_RENDERER_PROFILE;
  const sortedRings = [...view.rings].sort((a, b) => a.radius - b.radius);
  const sortedSectors = [...view.sectors].sort((a, b) => a.angle - b.angle);
  const maximumRadius = sortedRings.at(-1)?.radius ?? 0;
  const entities = new Map(document.entities.map((entity) => [entity.id, entity]));

  const svg: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="scim-title scim-description" viewBox="0 0 ${number(view.canvas.width)} ${number(view.canvas.height)}" width="100%" height="auto">`,
    `<title id="scim-title">${escapeXml(view.name)}</title>`,
    `<desc id="scim-description">SCIM radial infrastructure map for ${escapeXml(document.title)}</desc>`,
    "<defs>",
    '<marker id="scim-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">',
    `<path d="M 0 0 L 8 4 L 0 8 Z" fill="${profile.edge}" />`,
    "</marker>",
    "</defs>",
    `<rect x="0" y="0" width="${number(view.canvas.width)}" height="${number(view.canvas.height)}" fill="#ffffff" />`,
  ];

  if (view.showSegments && maximumRadius > 0) {
    sortedSectors.forEach((sector, index) => {
      const next = sortedSectors[(index + 1) % sortedSectors.length];
      if (!next) return;
      const path = sectorPath(view.centre, maximumRadius, sector.angle, next.angle);
      svg.push(
        `<path d="${path}" fill="${profile.sectorFill}" fill-opacity="0.07" stroke="${profile.sectorStroke}" stroke-opacity="0.35" stroke-width="1" />`
      );
      const endAngle = next.angle <= sector.angle ? next.angle + 360 : next.angle;
      const labelAngle = (sector.angle + endAngle) / 2;
      const label = polarPoint(view.centre, maximumRadius + 28, labelAngle);
      svg.push(
        `<text x="${number(label.x)}" y="${number(label.y)}" text-anchor="middle" dominant-baseline="middle" font-family="${profile.fontFamily}" font-size="12" font-weight="700" fill="${profile.text}">${escapeXml(sector.need)}</text>`
      );
    });
  }

  let innerRadius = 0;
  sortedRings.forEach((ring, index) => {
    const colour = profile.ringColours[Math.min(index, profile.ringColours.length - 1)];
    svg.push(
      `<path d="${annulusPath(view.centre, innerRadius, ring.radius)}" fill="${colour}" fill-opacity="0.32" fill-rule="evenodd" stroke="none" />`
    );
    svg.push(
      `<circle cx="${number(view.centre.x)}" cy="${number(view.centre.y)}" r="${number(ring.radius)}" fill="none" stroke="${profile.ringStroke}" stroke-opacity="0.65" stroke-width="1" />`
    );
    const labelRadius = Math.max(innerRadius + 12, ring.radius - 15);
    const label = polarPoint(view.centre, labelRadius, ring.labelAngle);
    svg.push(
      `<text x="${number(label.x)}" y="${number(label.y)}" text-anchor="middle" dominant-baseline="middle" font-family="${profile.fontFamily}" font-size="11" font-weight="600" fill="${profile.ringLabel}">${escapeXml(ring.layer)}</text>`
    );
    innerRadius = ring.radius;
  });

  for (const relationship of document.relationships) {
    const points = relationshipPoints(document, view, relationship.id);
    if (!points) continue;
    const pointsAttribute = points
      .map((point) => `${number(point.x)},${number(point.y)}`)
      .join(" ");
    const stroke = relationship.critical ? profile.criticalEdge : profile.edge;
    const dash = relationship.status === "failed" ? ' stroke-dasharray="5 5"' : "";
    const opacity = relationship.status === "failed" ? "0.65" : "0.9";
    svg.push(
      `<polyline points="${pointsAttribute}" fill="none" stroke="${stroke}" stroke-width="${relationship.critical ? 2.5 : 1.75}" stroke-linejoin="round" stroke-linecap="round" opacity="${opacity}" marker-end="url(#scim-arrow)"${dash} />`
    );
  }

  for (const node of view.nodes) {
    const entity = entities.get(node.entityId);
    if (!entity) continue;
    const status = profile.statuses[entity.status];
    const x = node.x - node.width / 2;
    const y = node.y - node.height / 2;
    const dash = status.dash ? ` stroke-dasharray="${status.dash}"` : "";
    svg.push(
      `<rect x="${number(x)}" y="${number(y)}" width="${number(node.width)}" height="${number(node.height)}" rx="${profile.nodeCornerRadius}" fill="${status.fill}" stroke="${status.stroke}" stroke-width="2"${dash} />`
    );

    const lines = wrapScimLabel(entity.name, node.width);
    const totalHeight = lines.length * profile.lineHeight;
    const firstY = node.y - totalHeight / 2 + profile.lineHeight / 2;
    svg.push(
      `<text text-anchor="middle" dominant-baseline="middle" font-family="${profile.fontFamily}" font-size="${profile.fontSize}" font-weight="600" fill="${profile.text}">`
    );
    lines.forEach((line, index) => {
      svg.push(
        `<tspan x="${number(node.x)}" y="${number(firstY + index * profile.lineHeight)}">${escapeXml(line)}</tspan>`
      );
    });
    svg.push("</text>");

    if (entity.status === "failed") {
      svg.push(
        `<line x1="${number(x)}" y1="${number(y)}" x2="${number(x + node.width)}" y2="${number(y + node.height)}" stroke="${status.stroke}" stroke-width="2" />`,
        `<line x1="${number(x + node.width)}" y1="${number(y)}" x2="${number(x)}" y2="${number(y + node.height)}" stroke="${status.stroke}" stroke-width="2" />`
      );
    }
  }

  svg.push("</svg>");
  return svg.join("\n");
}

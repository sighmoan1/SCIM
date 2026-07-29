import {
  ScimDocumentSchema,
  type ScenarioChange,
  type ScimDocument,
} from "./schema";

function referencesRelationship(
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
        return !referencesRelationship(change, relationshipIds);
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
        (change) => !referencesRelationship(change, relationshipIds)
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

import test from "node:test";
import assert from "node:assert/strict";
import { createPersonalStarterDocument } from "../lib/scim/personal-starter";
import {
  removeEntityFromDocument,
  removeRelationshipFromDocument,
} from "../lib/scim/mutations";
import { ScimDocumentSchema } from "../lib/scim/schema";

test("entity deletion removes scenario and view references", () => {
  const next = removeEntityFromDocument(createPersonalStarterDocument(), "grid");
  assert.doesNotThrow(() => ScimDocumentSchema.parse(next));
  assert.equal(next.entities.some((entity) => entity.id === "grid"), false);
  assert.equal(
    next.relationships.some(
      (relationship) => relationship.from === "grid" || relationship.to === "grid"
    ),
    false
  );
  assert.equal(
    next.scenarios
      .flatMap((scenario) => scenario.changes)
      .some(
        (change) =>
          change.operation === "set-entity-status" && change.entityId === "grid"
      ),
    false
  );
  assert.equal(
    next.views.some(
      (view) =>
        view.type === "radial" &&
        view.nodes.some((node) => node.entityId === "grid")
    ),
    false
  );
});

test("relationship deletion removes routed references", () => {
  const next = removeRelationshipFromDocument(
    createPersonalStarterDocument(),
    "grid-hospital"
  );
  assert.doesNotThrow(() => ScimDocumentSchema.parse(next));
  assert.equal(
    next.relationships.some((relationship) => relationship.id === "grid-hospital"),
    false
  );
  assert.equal(
    next.views.some(
      (view) =>
        view.type === "radial" &&
        view.routes.some((route) => route.relationshipId === "grid-hospital")
    ),
    false
  );
});

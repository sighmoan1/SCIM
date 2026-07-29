import test from "node:test";
import assert from "node:assert/strict";
import { createPersonalStarterDocument } from "../lib/scim/personal-starter";
import { buildInamMatrix } from "../lib/scim/inam";

test("INAM includes direct and upstream providers", () => {
  const matrix = buildInamMatrix(createPersonalStarterDocument());
  const thirst = matrix.groups
    .flatMap((group) => group.rows)
    .find((row) => row.need.id === "thirst");
  const entities = thirst?.cells.flatMap((cell) => cell.entities) ?? [];
  assert.equal(entities.find((entity) => entity.id === "tap-water")?.role, "direct");
  assert.equal(
    entities.find((entity) => entity.id === "water-works")?.role,
    "upstream"
  );
  assert.equal(entities.find((entity) => entity.id === "grid")?.distance, 2);
});

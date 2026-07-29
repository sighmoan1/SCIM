import test from "node:test";
import assert from "node:assert/strict";
import { createPersonalStarterDocument } from "../lib/scim/personal-starter";
import { parseScimDsl } from "../lib/scim/parser";
import { serializeScimDsl } from "../lib/scim/serializer";

test("the shipped starter model round-trips through SCIM text", () => {
  const original = createPersonalStarterDocument();
  assert.deepEqual(parseScimDsl(serializeScimDsl(original)), original);
});

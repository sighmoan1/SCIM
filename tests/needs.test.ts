import test from "node:test";
import assert from "node:assert/strict";
import { createPersonalStarterDocument } from "../lib/scim/personal-starter";
import { assessDocument } from "../lib/scim/needs";

function withStatus(id: string, status: "normal" | "degraded" | "failed") {
  const document = createPersonalStarterDocument();
  return {
    ...document,
    entities: document.entities.map((entity) =>
      entity.id === id ? { ...entity, status } : entity
    ),
  };
}

test("a degraded sole protector leaves the need at risk", () => {
  const result = assessDocument(withStatus("heating", "degraded"));
  assert.equal(
    result.needs.find((need) => need.threat.id === "too-cold")?.status,
    "at-risk"
  );
});

test("a failed sole protector leaves the need unprotected", () => {
  const result = assessDocument(withStatus("heating", "failed"));
  assert.equal(
    result.needs.find((need) => need.threat.id === "too-cold")?.status,
    "unprotected"
  );
});

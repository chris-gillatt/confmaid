const test = require("node:test");
const assert = require("node:assert/strict");

const { handler } = require("../src/index");

test("resolver healthcheck operation responds", async () => {
  const response = await handler({ payload: {} });
  assert.equal(response.ok, true);
  assert.equal(response.operation, "healthcheck");
});

test("resolver validate operation returns validation result", async () => {
  const response = await handler({
    payload: {
      operation: "validate",
      source: "flowchart TD\nA-->B",
    },
  });

  assert.equal(response.ok, true);
  assert.equal(response.operation, "validate");
  assert.equal(response.result.isValid, true);
  assert.equal(response.result.diagramType, "flowchart");
});

test("resolver render operation returns html payload", async () => {
  const response = await handler({
    payload: {
      operation: "render",
      source: "flowchart TD\nA-->B",
    },
  });

  assert.equal(response.ok, true);
  assert.equal(response.operation, "render");
  assert.equal(response.result.ok, true);
  assert.ok(response.result.html.includes('<pre class="mermaid">'));
});
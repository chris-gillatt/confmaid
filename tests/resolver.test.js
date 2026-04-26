const test = require("node:test");
const assert = require("node:assert/strict");

const { localHandler } = require("../src/index");

test("resolver healthcheck operation responds", async () => {
  const response = await localHandler({ payload: {} });
  assert.equal(response.ok, true);
  assert.equal(response.operation, "healthcheck");
});

test("resolver validate operation returns validation result", async () => {
  const response = await localHandler({
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
  const response = await localHandler({
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

test("resolver loadMacroConfig returns persisted config defaults", async () => {
  const response = await localHandler({
    payload: {
      operation: "loadMacroConfig",
      macroConfig: {
        source: "flowchart TD\nA-->B",
        title: "Project flow",
      },
    },
  });

  assert.equal(response.ok, true);
  assert.equal(response.operation, "loadMacroConfig");
  assert.equal(response.result.macroConfig.title, "Project flow");
});

test("resolver saveMacroConfig returns macro config and rendered payload", async () => {
  const response = await localHandler({
    payload: {
      operation: "saveMacroConfig",
      macroConfig: {
        source: "flowchart TD\nA-->B",
        title: "Flow",
      },
    },
  });

  assert.equal(response.ok, true);
  assert.equal(response.operation, "saveMacroConfig");
  assert.equal(response.result.macroConfig.title, "Flow");
  assert.equal(response.result.rendered.ok, true);
});

test("resolver renderFromMacroConfig uses saved source", async () => {
  const response = await localHandler({
    payload: {
      operation: "renderFromMacroConfig",
      macroConfig: {
        source: "flowchart TD\nA-->B",
      },
    },
  });

  assert.equal(response.ok, true);
  assert.equal(response.operation, "renderFromMacroConfig");
  assert.equal(response.result.rendered.ok, true);
  assert.ok(response.result.rendered.html.includes('<pre class="mermaid">'));
});
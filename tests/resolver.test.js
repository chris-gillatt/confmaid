const test = require("node:test");
const assert = require("node:assert/strict");

const { localHandler } = require("../src/index");

test("resolver healthcheck operation responds", async () => {
  const response = await localHandler({ payload: {} });
  assert.equal(response.ok, true);
  assert.equal(response.operation, "healthcheck");
  assert.equal(typeof response.result.buildInfo.packageVersion, "string");
  assert.ok("deploymentVersion" in response.result.buildInfo);
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

test("resolver validate handles Forge request object shape", async () => {
  const response = await localHandler({
    payload: {
      operation: "validate",
      source: "flowchart TD\nA-->B",
    },
  });

  assert.equal(response.ok, true);
  assert.equal(response.result.isValid, true);
  assert.equal(response.result.errors.length, 0);
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
  assert.equal(response.result.macroConfig.displayMode, "standard");
  assert.equal(response.result.rendered.ok, true);
});

test("resolver saveMacroConfig preserves dual displayMode", async () => {
  const response = await localHandler({
    payload: {
      operation: "saveMacroConfig",
      macroConfig: {
        source: "flowchart TD\nA-->B",
        title: "Dual flow",
        displayMode: "dual",
      },
    },
  });

  assert.equal(response.ok, true);
  assert.equal(response.result.macroConfig.displayMode, "dual");
});

test("resolver saveMacroConfig rejects unknown displayMode", async () => {
  const response = await localHandler({
    payload: {
      operation: "saveMacroConfig",
      macroConfig: {
        source: "flowchart TD\nA-->B",
        title: "Test",
        displayMode: "invalid",
      },
    },
  });

  assert.equal(response.ok, true);
  assert.equal(response.result.macroConfig.displayMode, "standard");
});

test("saveMacroConfig supports Forge request object in handler call", async () => {
  const { saveMacroConfig } = require("../src/resolverHandlers");
  const response = await saveMacroConfig({
    payload: {
      macroConfig: {
        source: "flowchart TD\nA-->B",
        title: "Forge request",
      },
    },
    context: {},
  });

  assert.equal(response.ok, true);
  assert.equal(response.result.macroConfig.title, "Forge request");
  assert.equal(response.result.rendered.ok, true);
});

test("resolver saveMacroConfig rejects oversize source", async () => {
  const response = await localHandler({
    payload: {
      operation: "saveMacroConfig",
      macroConfig: {
        source: `flowchart TD\n${"A".repeat(50001)}`,
      },
    },
  });

  assert.equal(response.ok, false);
  assert.equal(response.operation, "saveMacroConfig");
  assert.ok(Array.isArray(response.errors));
  assert.ok(response.errors[0].includes("exceeds"));
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

test("resolver loadMacroConfig can read context parameters", async () => {
  const response = await localHandler({
    payload: {
      operation: "loadMacroConfig",
    },
    context: {
      extension: {
        macro: {
          parameters: {
            source: "flowchart TD\nA-->B",
            title: "Context macro",
          },
        },
      },
    },
  });

  assert.equal(response.ok, true);
  assert.equal(response.result.macroConfig.title, "Context macro");
  assert.equal(response.result.macroConfig.source, "flowchart TD\nA-->B");
});

const test = require("node:test");
const assert = require("node:assert/strict");

const { localHandler } = require("../src/index");

test("macro lifecycle contract: insert, save, reopen, edit, re-render", async () => {
  const initialConfig = {
    title: "Delivery flow",
    source: "flowchart TD\nA[Start]-->B[Finish]",
  };

  const saveInitial = await localHandler({
    payload: {
      operation: "saveMacroConfig",
      macroConfig: initialConfig,
    },
  });

  assert.equal(saveInitial.ok, true);
  assert.equal(saveInitial.result.macroConfig.title, "Delivery flow");
  assert.equal(saveInitial.result.rendered.ok, true);

  const reopen = await localHandler({
    payload: {
      operation: "loadMacroConfig",
    },
    context: {
      extension: {
        macro: {
          parameters: saveInitial.result.macroConfig,
        },
      },
    },
  });

  assert.equal(reopen.ok, true);
  assert.equal(reopen.result.macroConfig.source, initialConfig.source);

  const editedConfig = {
    ...reopen.result.macroConfig,
    source: "flowchart TD\nA[Start]-->B[Review]-->C[Finish]",
  };

  const saveEdited = await localHandler({
    payload: {
      operation: "saveMacroConfig",
      macroConfig: editedConfig,
    },
  });

  assert.equal(saveEdited.ok, true);
  assert.ok(saveEdited.result.rendered.html.includes("Review"));

  const renderFromSaved = await localHandler({
    payload: {
      operation: "renderFromMacroConfig",
      macroConfig: saveEdited.result.macroConfig,
    },
  });

  assert.equal(renderFromSaved.ok, true);
  assert.equal(renderFromSaved.result.rendered.ok, true);
  assert.ok(renderFromSaved.result.rendered.html.includes("Finish"));
});
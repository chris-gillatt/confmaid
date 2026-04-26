const test = require("node:test");
const assert = require("node:assert/strict");

async function importAdapterWithWindow(windowStub) {
  global.window = windowStub;
  return import("../static/main/invokeAdapter.mjs");
}

test("invoke adapter prefers explicit override", async () => {
  const expected = async () => ({ ok: true, source: "override" });
  const localInvoke = async () => ({ ok: true, source: "local" });

  const module = await importAdapterWithWindow({
    __CONFMAID_INVOKE__: expected,
  });

  const adapter = await module.createInvokeAdapter(localInvoke);
  const response = await adapter("healthcheck", {});
  assert.equal(response.source, "override");
});

test("invoke adapter uses local fallback when bridge is unavailable", async () => {
  const localInvoke = async () => ({ ok: true, source: "local" });

  const module = await importAdapterWithWindow({});
  const adapter = await module.createInvokeAdapter(localInvoke);
  const response = await adapter("healthcheck", {});

  assert.equal(response.source, "local");
});

test("invoke adapter prefers packaged forge bridge global", async () => {
  const localInvoke = async () => ({ ok: true, source: "local" });
  const expected = async () => ({ ok: true, source: "forge-bridge" });

  const module = await importAdapterWithWindow({
    __FORGE_BRIDGE_INVOKE__: expected,
  });

  const adapter = await module.createInvokeAdapter(localInvoke);
  const response = await adapter("healthcheck", {});

  assert.equal(response.source, "forge-bridge");
});
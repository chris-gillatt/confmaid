const test = require("node:test");
const assert = require("node:assert/strict");

const {
  DEFAULT_SOURCE,
  buildMacroConfig,
  normaliseSource,
  sanitiseTitle,
  validateConfigLimits,
  MAX_SOURCE_LENGTH,
} = require("../src/lib/macroConfig");

test("normaliseSource trims and normalises line endings", () => {
  const input = "\r\n flowchart TD\r\nA-->B \r\n";
  const output = normaliseSource(input);
  assert.equal(output, "flowchart TD\nA-->B");
});

test("sanitiseTitle applies default fallback", () => {
  assert.equal(sanitiseTitle("   "), "Mermaid diagram");
});

test("buildMacroConfig returns default source when missing", () => {
  const config = buildMacroConfig({});
  assert.equal(config.source, DEFAULT_SOURCE);
  assert.equal(config.title, "Mermaid diagram");
  assert.ok(config.updatedAt.length > 0);
});

test("validateConfigLimits rejects oversize source", () => {
  const config = { source: "A".repeat(MAX_SOURCE_LENGTH + 1) };
  const result = validateConfigLimits(config);
  assert.equal(result.ok, false);
});

test("validateConfigLimits accepts valid source", () => {
  const config = { source: "flowchart TD\nA-->B" };
  const result = validateConfigLimits(config);
  assert.equal(result.ok, true);
});

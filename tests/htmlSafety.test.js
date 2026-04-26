const test = require("node:test");
const assert = require("node:assert/strict");

const { escapeHtml } = require("../src/lib/htmlSafety");

test("escapeHtml encodes dangerous characters", () => {
  const result = escapeHtml('<img src=x onerror="alert(1)">');
  assert.equal(result, "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
});

test("escapeHtml returns empty string for non-string input", () => {
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(undefined), "");
  assert.equal(escapeHtml(42), "");
});

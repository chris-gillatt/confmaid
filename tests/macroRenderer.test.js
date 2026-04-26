const test = require("node:test");
const assert = require("node:assert/strict");

const { renderMacroPayload } = require("../src/lib/macroRenderer");

test("renderMacroPayload returns html for valid source", () => {
  const source = "flowchart TD\nA-->B";
  const result = renderMacroPayload(source);

  assert.equal(result.ok, true);
  assert.equal(result.validation.isValid, true);
  assert.ok(result.html.includes('<pre class="mermaid">'));
  assert.ok(result.html.includes("flowchart TD"));
});

test("renderMacroPayload rejects invalid source", () => {
  const result = renderMacroPayload("notMermaid\nA-->B");

  assert.equal(result.ok, false);
  assert.equal(result.html, "");
  assert.equal(result.validation.isValid, false);
});

test("renderMacroPayload escapes html content", () => {
  const source = 'flowchart TD\nA[<img src=x onerror="alert(1)">]';
  const result = renderMacroPayload(source);

  assert.equal(result.ok, true);
  assert.ok(result.html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
});

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  detectDiagramType,
  validateBalancedDelimiters,
  validateMermaidSource,
  MAX_SOURCE_LENGTH,
} = require("../src/lib/mermaidValidation");

test("detectDiagramType identifies flowchart from graph header", () => {
  const source = `graph TD\nA-->B`;
  assert.equal(detectDiagramType(source), "flowchart");
});

test("validateBalancedDelimiters returns false for mismatched delimiters", () => {
  const source = "flowchart TD\nA[Start --> B)";
  assert.equal(validateBalancedDelimiters(source), false);
});

test("validateMermaidSource validates a basic sequence diagram", () => {
  const source = `sequenceDiagram\nAlice->>Bob: Hello`;
  const result = validateMermaidSource(source);

  assert.equal(result.isValid, true);
  assert.equal(result.diagramType, "sequence");
  assert.equal(result.errors.length, 0);
});

test("validateMermaidSource rejects empty source", () => {
  const result = validateMermaidSource("   \n  ");
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((error) => error.includes("cannot be empty")));
});

test("validateMermaidSource rejects unsupported header", () => {
  const result = validateMermaidSource("notMermaid\nA-->B");
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((error) => error.includes("Unsupported or missing")));
});

test("validateMermaidSource flags suspicious patterns as warnings", () => {
  const source = `flowchart TD\nA[<script>alert(1)</script>]`;
  const result = validateMermaidSource(source);

  assert.equal(result.isValid, true);
  assert.ok(result.warnings.length > 0);
});

test("validateMermaidSource rejects overly large input", () => {
  const source = `flowchart TD\n${"A".repeat(MAX_SOURCE_LENGTH + 1)}`;
  const result = validateMermaidSource(source);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((error) => error.includes("exceeds maximum length")));
});
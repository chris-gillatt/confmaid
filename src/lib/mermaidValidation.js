const SUPPORTED_DIAGRAM_PREFIXES = [
  { prefix: "flowchart", type: "flowchart" },
  { prefix: "graph", type: "flowchart" },
  { prefix: "sequenceDiagram", type: "sequence" },
  { prefix: "classDiagram", type: "class" },
  { prefix: "stateDiagram-v2", type: "state" },
  { prefix: "stateDiagram", type: "state" },
  { prefix: "erDiagram", type: "erd" },
  { prefix: "gantt", type: "gantt" },
  { prefix: "pie", type: "pie" },
  { prefix: "journey", type: "journey" },
  { prefix: "gitGraph", type: "gitgraph" },
];

const SUSPICIOUS_PATTERN = /(javascript:|on\w+\s*=|<script|<iframe)/gi;
const MAX_SOURCE_LENGTH = 50000;

function firstMeaningfulLine(source) {
  return (
    source
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) || ""
  );
}

function detectDiagramType(source) {
  const header = firstMeaningfulLine(source);
  const match = SUPPORTED_DIAGRAM_PREFIXES.find(({ prefix }) => header.startsWith(prefix));
  return match ? match.type : null;
}

function validateBalancedDelimiters(source) {
  const stack = [];
  const pairs = {
    "(": ")",
    "[": "]",
    "{": "}",
  };
  const closers = new Set(Object.values(pairs));

  for (const char of source) {
    if (pairs[char]) {
      stack.push(pairs[char]);
      continue;
    }
    if (closers.has(char)) {
      const expected = stack.pop();
      if (char !== expected) {
        return false;
      }
    }
  }

  return stack.length === 0;
}

function validateMermaidSource(source) {
  const errors = [];
  const warnings = [];

  if (typeof source !== "string") {
    errors.push("Mermaid source must be a string.");
    return { isValid: false, diagramType: null, errors, warnings };
  }

  if (source.trim().length === 0) {
    errors.push("Mermaid source cannot be empty.");
  }

  if (source.length > MAX_SOURCE_LENGTH) {
    errors.push(`Mermaid source exceeds maximum length of ${MAX_SOURCE_LENGTH} characters.`);
  }

  const diagramType = detectDiagramType(source);
  if (!diagramType) {
    errors.push(
      "Unsupported or missing diagram declaration. Start with a supported Mermaid keyword like flowchart, graph, sequenceDiagram, or classDiagram."
    );
  }

  if (!validateBalancedDelimiters(source)) {
    errors.push("Unbalanced delimiters detected in Mermaid source.");
  }

  if (SUSPICIOUS_PATTERN.test(source)) {
    warnings.push(
      "Potentially unsafe patterns detected. Input should be sanitized before rendering."
    );
  }

  return {
    isValid: errors.length === 0,
    diagramType,
    errors,
    warnings,
  };
}

module.exports = {
  detectDiagramType,
  validateMermaidSource,
  validateBalancedDelimiters,
  MAX_SOURCE_LENGTH,
};

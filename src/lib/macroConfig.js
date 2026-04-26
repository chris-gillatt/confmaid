const MAX_SOURCE_LENGTH = 50000;

const DEFAULT_SOURCE = `flowchart TD
  A[Edit page] --> B[Insert Confmaid macro]
  B --> C[Paste Mermaid source]
  C --> D[Save and render]`;

function normaliseSource(source) {
  if (typeof source !== "string") {
    return "";
  }

  return source.replace(/\r\n/g, "\n").trim();
}

function sanitiseTitle(title) {
  if (typeof title !== "string") {
    return "Mermaid diagram";
  }

  const trimmed = title.trim();
  if (!trimmed) {
    return "Mermaid diagram";
  }

  return trimmed.slice(0, 120);
}

function buildMacroConfig(input = {}) {
  const source = normaliseSource(input.source || DEFAULT_SOURCE);
  const title = sanitiseTitle(input.title);

  return {
    source,
    title,
    sourceLength: source.length,
    updatedAt: new Date().toISOString(),
  };
}

function validateConfigLimits(config) {
  if (!config || typeof config !== "object") {
    return {
      ok: false,
      errors: ["Macro config is missing or invalid."],
    };
  }

  if (typeof config.source !== "string") {
    return {
      ok: false,
      errors: ["Macro config source must be a string."],
    };
  }

  if (config.source.length > MAX_SOURCE_LENGTH) {
    return {
      ok: false,
      errors: [`Macro source exceeds ${MAX_SOURCE_LENGTH} characters.`],
    };
  }

  return {
    ok: true,
    errors: [],
  };
}

module.exports = {
  DEFAULT_SOURCE,
  MAX_SOURCE_LENGTH,
  buildMacroConfig,
  normaliseSource,
  sanitiseTitle,
  validateConfigLimits,
};
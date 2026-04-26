const { buildMacroConfig, validateConfigLimits } = require("./lib/macroConfig");
const { renderMacroPayload } = require("./lib/macroRenderer");
const { validateMermaidSource } = require("./lib/mermaidValidation");

async function healthcheck() {
  return {
    ok: true,
    operation: "healthcheck",
    message: "Confmaid resolver is reachable.",
  };
}

async function validate(payload = {}) {
  const source = payload.source || "";
  return {
    ok: true,
    operation: "validate",
    result: validateMermaidSource(source),
  };
}

async function render(payload = {}) {
  const source = payload.source || "";
  return {
    ok: true,
    operation: "render",
    result: renderMacroPayload(source),
  };
}

async function loadMacroConfig(payload = {}, context = {}) {
  const storedConfig =
    payload.macroConfig ||
    context.extension?.macro?.parameters ||
    context.extension?.macro?.config ||
    {};

  const macroConfig = buildMacroConfig(storedConfig);

  return {
    ok: true,
    operation: "loadMacroConfig",
    result: {
      macroConfig,
    },
  };
}

async function saveMacroConfig(payload = {}) {
  const macroConfig = buildMacroConfig(payload.macroConfig || payload);
  const limitCheck = validateConfigLimits(macroConfig);

  if (!limitCheck.ok) {
    return {
      ok: false,
      operation: "saveMacroConfig",
      errors: limitCheck.errors,
      result: {
        macroConfig,
      },
    };
  }

  const rendered = renderMacroPayload(macroConfig.source);

  return {
    ok: true,
    operation: "saveMacroConfig",
    result: {
      macroConfig,
      rendered,
    },
  };
}

async function renderFromMacroConfig(payload = {}, context = {}) {
  const storedConfig =
    payload.macroConfig ||
    context.extension?.macro?.parameters ||
    context.extension?.macro?.config ||
    {};

  const macroConfig = buildMacroConfig(storedConfig);
  const rendered = renderMacroPayload(macroConfig.source);

  return {
    ok: true,
    operation: "renderFromMacroConfig",
    result: {
      macroConfig,
      rendered,
    },
  };
}

module.exports = {
  healthcheck,
  validate,
  render,
  loadMacroConfig,
  saveMacroConfig,
  renderFromMacroConfig,
};

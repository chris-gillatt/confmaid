const { buildMacroConfig, validateConfigLimits } = require("./lib/macroConfig");
const { renderMacroPayload } = require("./lib/macroRenderer");
const { validateMermaidSource } = require("./lib/mermaidValidation");
const packageJson = require("../package.json");

function resolveInvocationInput(firstArg = {}, secondArg = {}) {
  if (
    firstArg &&
    typeof firstArg === "object" &&
    (Object.prototype.hasOwnProperty.call(firstArg, "payload") ||
      Object.prototype.hasOwnProperty.call(firstArg, "context"))
  ) {
    return {
      payload: firstArg.payload || {},
      context: firstArg.context || {},
    };
  }

  return {
    payload: firstArg || {},
    context: secondArg || {},
  };
}

function getFromPath(input, path) {
  return path.reduce((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return current[segment];
    }
    return undefined;
  }, input);
}

function extractDeploymentVersion(context = {}) {
  const candidates = [
    ["appVersion"],
    ["environment", "appVersion"],
    ["installation", "appVersion"],
    ["extension", "app", "appVersion"],
    ["extension", "appVersion"],
  ];

  for (const path of candidates) {
    const value = getFromPath(context, path);
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }

  return null;
}

async function healthcheck(firstArg = {}, secondArg = {}) {
  const { context } = resolveInvocationInput(firstArg, secondArg);
  const deploymentVersion = extractDeploymentVersion(context);

  return {
    ok: true,
    operation: "healthcheck",
    message: "Confmaid resolver is reachable.",
    result: {
      buildInfo: {
        packageVersion: packageJson.version,
        deploymentVersion,
      },
    },
  };
}

async function validate(firstArg = {}, secondArg = {}) {
  const { payload } = resolveInvocationInput(firstArg, secondArg);
  const source = payload.source || "";
  return {
    ok: true,
    operation: "validate",
    result: validateMermaidSource(source),
  };
}

async function render(firstArg = {}, secondArg = {}) {
  const { payload } = resolveInvocationInput(firstArg, secondArg);
  const source = payload.source || "";
  return {
    ok: true,
    operation: "render",
    result: renderMacroPayload(source),
  };
}

async function loadMacroConfig(firstArg = {}, secondArg = {}) {
  const { payload, context } = resolveInvocationInput(firstArg, secondArg);
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

async function saveMacroConfig(firstArg = {}, secondArg = {}) {
  const { payload } = resolveInvocationInput(firstArg, secondArg);
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

async function renderFromMacroConfig(firstArg = {}, secondArg = {}) {
  const { payload, context } = resolveInvocationInput(firstArg, secondArg);
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

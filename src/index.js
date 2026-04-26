const { validateMermaidSource } = require("./lib/mermaidValidation");
const { renderMacroPayload } = require("./lib/macroRenderer");

/**
 * Initial resolver handler scaffold.
 *
 * This shape allows us to validate Mermaid source before wiring full Forge UI
 * resources and macro configuration persistence.
 */
async function handler(request) {
  const payload = request?.payload || {};
  const operation = payload.operation || "healthcheck";

  if (operation === "validate") {
    const source = payload.source || "";
    return {
      ok: true,
      operation,
      result: validateMermaidSource(source),
    };
  }

  if (operation === "render") {
    const source = payload.source || "";
    return {
      ok: true,
      operation,
      result: renderMacroPayload(source),
    };
  }

  return {
    ok: true,
    operation,
    message: "Confmaid resolver is reachable.",
  };
}

module.exports = {
  handler,
};
const { escapeHtml } = require("./htmlSafety");
const { validateMermaidSource } = require("./mermaidValidation");

function renderMacroPayload(source) {
  const validation = validateMermaidSource(source);

  if (!validation.isValid) {
    return {
      ok: false,
      validation,
      html: "",
    };
  }

  const escapedSource = escapeHtml(source);
  const escapedType = escapeHtml(validation.diagramType || "unknown");

  const html = [
    '<section data-confmaid="macro">',
    `  <div data-confmaid="meta">type: ${escapedType}</div>`,
    `  <pre class="mermaid">${escapedSource}</pre>`,
    "</section>",
  ].join("\n");

  return {
    ok: true,
    validation,
    html,
  };
}

module.exports = {
  renderMacroPayload,
};

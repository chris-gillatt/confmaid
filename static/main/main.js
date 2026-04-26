const EXAMPLE_SOURCE = `flowchart TD
  A[User opens page] --> B[Insert Confmaid macro]
  B --> C[Paste Mermaid source]
  C --> D[Render diagram]`;

const DEFAULT_TITLE = "Mermaid diagram";
const LOCAL_CONFIG_KEY = "confmaid.macroConfig";

const statusEl = document.getElementById("status");
const previewEl = document.getElementById("preview");
const sourceEl = document.getElementById("source");
const titleEl = document.getElementById("title");
const diagnosticsEl = document.getElementById("diagnostics");
const loadBtn = document.getElementById("loadBtn");
const saveBtn = document.getElementById("saveBtn");
const validateBtn = document.getElementById("validateBtn");
const renderBtn = document.getElementById("renderBtn");
const resetBtn = document.getElementById("resetBtn");

let mermaid;

function getConfigFromUI() {
  return {
    title: titleEl.value || DEFAULT_TITLE,
    source: sourceEl.value || "",
  };
}

function applyConfigToUI(config = {}) {
  titleEl.value = config.title || DEFAULT_TITLE;
  sourceEl.value = config.source || EXAMPLE_SOURCE;
}

function readLocalConfig() {
  try {
    const raw = localStorage.getItem(LOCAL_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
}

function writeLocalConfig(config) {
  try {
    localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
  } catch (_error) {
    // Ignore storage exceptions and continue with in-memory behaviour.
  }
}

function inferDiagramType(source) {
  const header = source
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!header) {
    return null;
  }

  if (header.startsWith("flowchart") || header.startsWith("graph")) {
    return "flowchart";
  }
  if (header.startsWith("sequenceDiagram")) {
    return "sequence";
  }
  if (header.startsWith("classDiagram")) {
    return "class";
  }
  if (header.startsWith("stateDiagram") || header.startsWith("stateDiagram-v2")) {
    return "state";
  }

  return null;
}

function localValidate(source) {
  const trimmed = (source || "").trim();
  const errors = [];
  const warnings = [];

  if (!trimmed) {
    errors.push("Mermaid source cannot be empty.");
  }

  const diagramType = inferDiagramType(trimmed);
  if (!diagramType) {
    errors.push("Unsupported or missing diagram declaration.");
  }

  if (/(javascript:|on\w+\s*=|<script|<iframe)/gi.test(trimmed)) {
    warnings.push("Potentially unsafe patterns detected.");
  }

  return {
    isValid: errors.length === 0,
    diagramType,
    errors,
    warnings,
  };
}

async function invokeLocal(operation, payload = {}) {
  if (operation === "healthcheck") {
    return { ok: true, operation, message: "Local adapter ready." };
  }

  if (operation === "validate") {
    return { ok: true, operation, result: localValidate(payload.source || "") };
  }

  if (operation === "saveMacroConfig") {
    const macroConfig = {
      title: (payload.macroConfig?.title || DEFAULT_TITLE).trim() || DEFAULT_TITLE,
      source: payload.macroConfig?.source || "",
      updatedAt: new Date().toISOString(),
    };
    writeLocalConfig(macroConfig);
    return {
      ok: true,
      operation,
      result: {
        macroConfig,
      },
    };
  }

  if (operation === "loadMacroConfig") {
    const macroConfig = readLocalConfig() || {
      title: DEFAULT_TITLE,
      source: EXAMPLE_SOURCE,
    };
    return {
      ok: true,
      operation,
      result: {
        macroConfig,
      },
    };
  }

  if (operation === "renderFromMacroConfig") {
    const macroConfig = payload.macroConfig || readLocalConfig() || {
      title: DEFAULT_TITLE,
      source: EXAMPLE_SOURCE,
    };
    return {
      ok: true,
      operation,
      result: {
        macroConfig,
      },
    };
  }

  return { ok: false, operation, error: "Unsupported operation." };
}

async function invokeOperation(operation, payload = {}) {
  const providedInvoke = window.__CONFMAID_INVOKE__;
  if (typeof providedInvoke === "function") {
    return providedInvoke(operation, payload);
  }

  return invokeLocal(operation, payload);
}

function setStatus(kind, message) {
  statusEl.className = `status ${kind}`;
  statusEl.textContent = message;
}

function setDiagnostics(result = {}) {
  const items = [];
  const errors = result.errors || [];
  const warnings = result.warnings || [];

  for (const error of errors) {
    items.push(`<li><strong>Error:</strong> ${error}</li>`);
  }

  for (const warning of warnings) {
    items.push(`<li><strong>Warning:</strong> ${warning}</li>`);
  }

  if (result.diagramType) {
    items.push(`<li><strong>Diagram type:</strong> ${result.diagramType}</li>`);
  }

  if (items.length === 0) {
    diagnosticsEl.innerHTML = "<li>No diagnostics.</li>";
    return;
  }

  diagnosticsEl.innerHTML = items.join("");
}

async function loadMermaid() {
  if (mermaid) {
    return mermaid;
  }

  try {
    const module = await import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs");
    mermaid = module.default;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "default",
    });
    return mermaid;
  } catch (error) {
    setStatus("error", "Failed to load Mermaid runtime.");
    throw error;
  }
}

async function renderSource() {
  const source = sourceEl.value || "";
  if (!source.trim()) {
    setStatus("error", "Mermaid source is empty.");
    previewEl.innerHTML = "";
    return;
  }

  setStatus("warn", "Rendering...");

  try {
    const validationResponse = await invokeOperation("validate", {
      source,
    });
    const validation = validationResponse?.result || {};
    setDiagnostics(validation);
    if (!validation.isValid) {
      setStatus("error", "Validation failed. Fix errors before rendering.");
      previewEl.innerHTML = "";
      return;
    }

    const m = await loadMermaid();
    const id = `confmaid-preview-${Date.now()}`;
    const { svg } = await m.render(id, source);
    previewEl.innerHTML = svg;
    setStatus("ok", "Preview rendered.");
  } catch (error) {
    previewEl.innerHTML = "";
    setStatus("error", `Render failed: ${error.message}`);
  }
}

async function loadMacroConfig() {
  setStatus("warn", "Loading saved configuration...");
  const response = await invokeOperation("loadMacroConfig", {});
  const macroConfig = response?.result?.macroConfig || {};
  applyConfigToUI(macroConfig);
  setStatus("ok", "Configuration loaded.");
}

async function saveMacroConfig() {
  setStatus("warn", "Saving configuration...");

  const response = await invokeOperation("saveMacroConfig", {
    macroConfig: getConfigFromUI(),
  });

  if (!response?.ok) {
    setStatus("error", "Unable to save configuration.");
    return;
  }

  setStatus("ok", "Configuration saved.");
}

async function validateSource() {
  const source = sourceEl.value || "";
  const response = await invokeOperation("validate", { source });
  const validation = response?.result || {};
  setDiagnostics(validation);

  if (!validation.isValid) {
    setStatus("error", "Validation failed.");
    return;
  }

  setStatus("ok", "Validation passed.");
}

renderBtn.addEventListener("click", () => {
  renderSource();
});

validateBtn.addEventListener("click", () => {
  validateSource();
});

saveBtn.addEventListener("click", () => {
  saveMacroConfig();
});

loadBtn.addEventListener("click", () => {
  loadMacroConfig().then(() => renderSource());
});

resetBtn.addEventListener("click", () => {
  sourceEl.value = EXAMPLE_SOURCE;
  titleEl.value = DEFAULT_TITLE;
  renderSource();
});

async function bootstrap() {
  await loadMacroConfig();
  await renderSource();
}

bootstrap();
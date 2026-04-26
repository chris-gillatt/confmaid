import { createInvokeAdapter } from "./invokeAdapter.mjs";

const EXAMPLE_SOURCE = `flowchart TD
  A[User opens page] --> B[Insert Confmaid macro]
  B --> C[Paste Mermaid source]
  C --> D[Render diagram]`;

const DEFAULT_TITLE = "Mermaid diagram";
const LOCAL_CONFIG_KEY = "confmaid.macroConfig";

const statusEl = document.getElementById("status");
const previewEl = document.getElementById("preview");
const previewTitleEl = document.getElementById("previewTitle");
const sourceEl = document.getElementById("source");
const titleEl = document.getElementById("title");
const diagnosticsEl = document.getElementById("diagnostics");
const runtimeVersionEl = document.getElementById("runtimeVersion");
const displayModeEl = document.getElementById("displayMode");
const loadBtn = document.getElementById("loadBtn");
const saveBtn = document.getElementById("saveBtn");
const validateBtn = document.getElementById("validateBtn");
const renderBtn = document.getElementById("renderBtn");
const resetBtn = document.getElementById("resetBtn");

let mermaid;
let invokeOperation;
let latestSavedConfig = null;

function setRuntimeVersionText(buildInfo = {}) {
  if (!runtimeVersionEl) {
    return;
  }

  const packageVersion = buildInfo.packageVersion || "unknown";
  const deploymentVersion = buildInfo.deploymentVersion;

  if (deploymentVersion) {
    runtimeVersionEl.textContent = `deployed ${deploymentVersion} (package ${packageVersion})`;
    return;
  }

  runtimeVersionEl.textContent = `package ${packageVersion} (deployment version unavailable in context)`;
}

function getConfigFromUI() {
  return {
    title: titleEl.value || DEFAULT_TITLE,
    source: sourceEl.value || "",
    displayMode: displayModeEl?.value || "standard",
  };
}

function setPreviewTitle(title) {
  if (!previewTitleEl) {
    return;
  }

  previewTitleEl.textContent = (title || DEFAULT_TITLE).trim() || DEFAULT_TITLE;
}

function applyConfigToUI(config = {}) {
  titleEl.value = config.title || DEFAULT_TITLE;
  sourceEl.value = config.source || EXAMPLE_SOURCE;
  setPreviewTitle(config.title || DEFAULT_TITLE);
  if (displayModeEl) {
    displayModeEl.value = config.displayMode || "standard";
  }
}

async function getForgeContext() {
  try {
    if (typeof window.__FORGE_BRIDGE_VIEW__?.getContext === "function") {
      return await window.__FORGE_BRIDGE_VIEW__.getContext();
    }
  } catch {
    // Fall through to local dev fallback.
  }
  // Local dev fallback: treat as edit mode with any locally stored config.
  return {
    extension: {
      isEditing: true,
      config: readLocalConfig() || {},
      macro: {
        isConfiguring: true,
        config: readLocalConfig() || {},
      },
    },
  };
}

async function submitMacroConfig(config, keepEditing = true) {
  if (typeof window.__FORGE_BRIDGE_VIEW__?.submit === "function") {
    await window.__FORGE_BRIDGE_VIEW__.submit({ config, keepEditing });
    return;
  }
  writeLocalConfig(config);
}

function readLocalConfig() {
  try {
    const raw = localStorage.getItem(LOCAL_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalConfig(config) {
  try {
    localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
  } catch {
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
    return {
      ok: true,
      operation,
      message: "Local adapter ready.",
      result: {
        buildInfo: {
          packageVersion: "local",
          deploymentVersion: null,
        },
      },
    };
  }

  if (operation === "validate") {
    return { ok: true, operation, result: localValidate(payload.source || "") };
  }

  if (operation === "saveMacroConfig") {
    const macroConfig = {
      title: (payload.macroConfig?.title || DEFAULT_TITLE).trim() || DEFAULT_TITLE,
      source: payload.macroConfig?.source || "",
      displayMode: payload.macroConfig?.displayMode === "dual" ? "dual" : "standard",
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
      displayMode: "standard",
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
    const macroConfig = payload.macroConfig ||
      readLocalConfig() || {
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

async function invokeViaAdapter(operation, payload = {}) {
  if (!invokeOperation) {
    invokeOperation = await createInvokeAdapter(invokeLocal);
  }

  return invokeOperation(operation, payload);
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

function applyMermaidSvgFallbackStyles(svgElement) {
  if (!svgElement) {
    return;
  }

  const setShape = (selector) => {
    for (const node of svgElement.querySelectorAll(selector)) {
      node.setAttribute("fill", "#ffffff");
      node.setAttribute("stroke", "#1f2937");
      node.setAttribute("stroke-width", "1.5");
    }
  };

  setShape(".node rect");
  setShape(".node polygon");
  setShape(".node path");
  setShape(".cluster rect");
  setShape(".cluster polygon");

  for (const edge of svgElement.querySelectorAll(".edgePath path, path.path, .flowchart-link, g.edge path")) {
    edge.setAttribute("fill", "none");
    edge.setAttribute("stroke", "#1f2937");
    edge.setAttribute("stroke-width", "1.6");
  }

  // Sequence diagrams use different class names than flowcharts.
  for (const line of svgElement.querySelectorAll(
    ".messageLine0, .messageLine1, line.messageLine0, line.messageLine1, .signal-line, .actor-line",
  )) {
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "#1f2937");
    line.setAttribute("stroke-width", "1.6");
  }

  for (const dashedReturn of svgElement.querySelectorAll(".messageLine1, line.messageLine1")) {
    dashedReturn.setAttribute("stroke-dasharray", "3,3");
  }

  for (const arrow of svgElement.querySelectorAll(".arrowheadPath, marker path")) {
    arrow.setAttribute("fill", "#1f2937");
    arrow.setAttribute("stroke", "#1f2937");
  }

  for (const label of svgElement.querySelectorAll("text, tspan, .nodeLabel, .label")) {
    label.setAttribute("fill", "#111827");
    label.setAttribute("font-family", "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif");
  }
}

async function loadMermaid() {
  if (mermaid) {
    return mermaid;
  }

  try {
    mermaid = window.__CONFMAID_MERMAID__;
    if (!mermaid) {
      throw new Error("Local Mermaid runtime is unavailable.");
    }
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
    const validationResponse = await invokeViaAdapter("validate", {
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
    applyMermaidSvgFallbackStyles(previewEl.querySelector("svg"));
    setStatus("ok", "Preview rendered.");
  } catch (error) {
    previewEl.innerHTML = "";
    setStatus("error", `Render failed: ${error.message}`);
  }
}

async function loadMacroConfig() {
  setStatus("warn", "Loading saved configuration...");
  const context = await getForgeContext();
  const macroConfig =
    context?.extension?.config ||
    context?.extension?.macro?.config ||
    context?.extension?.macro?.parameters ||
    {};
  applyConfigToUI(macroConfig);
  latestSavedConfig = getConfigFromUI();
  setStatus("ok", "Configuration loaded.");
}

async function saveMacroConfig() {
  setStatus("warn", "Saving configuration...");

  const config = getConfigFromUI();
  const response = await invokeViaAdapter("saveMacroConfig", {
    macroConfig: config,
  });

  if (!response?.ok) {
    const errMsg = response?.errors?.[0] || "Unable to save configuration.";
    setStatus("error", errMsg);
    return;
  }

  // Close the config modal after successful save so users can continue editing the page.
  await submitMacroConfig(config, false);
  latestSavedConfig = config;
  writeLocalConfig(config);
  setStatus("ok", "Saved. Closing...");
}

async function validateSource() {
  const source = sourceEl.value || "";
  const response = await invokeViaAdapter("validate", { source });
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

titleEl.addEventListener("input", () => {
  setPreviewTitle(titleEl.value);
});

validateBtn.addEventListener("click", () => {
  validateSource();
});

saveBtn.addEventListener("click", () => {
  saveMacroConfig();
});

loadBtn.addEventListener("click", () => {
  if (latestSavedConfig) {
    applyConfigToUI(latestSavedConfig);
    setStatus("ok", "Reverted to last saved configuration.");
    renderSource();
    return;
  }
  loadMacroConfig().then(() => renderSource());
});

resetBtn.addEventListener("click", () => {
  sourceEl.value = EXAMPLE_SOURCE;
  titleEl.value = DEFAULT_TITLE;
  setPreviewTitle(DEFAULT_TITLE);
  renderSource();
});

async function bootstrap() {
  invokeOperation = await createInvokeAdapter(invokeLocal);

  const probe = await invokeOperation("healthcheck", {});
  setRuntimeVersionText(probe?.result?.buildInfo || {});
  if (probe?.message && probe.message.includes("Local")) {
    setStatus("warn", "Running with local invoke fallback.");
  }

  const context = await getForgeContext();
  const isConfiguring = context?.extension?.macro?.isConfiguring ?? false;
  const isEditing = context?.extension?.isEditing ?? false;

  if (isConfiguring) {
    document.body.classList.add("mode-config");
    await loadMacroConfig();
    await renderSource();
  } else {
    document.body.classList.add("mode-view");
    if (isEditing) {
      // In page editor (non-config), keep macro easy to select/configure.
      document.body.classList.add("mode-editor-view");
    }
    const savedConfig = context?.extension?.config || context?.extension?.macro?.config || {};
    const displayMode = savedConfig.displayMode || "standard";
    if (displayMode === "dual") {
      document.body.classList.add("display-dual");
      sourceEl.setAttribute("readonly", "");
      titleEl.setAttribute("readonly", "");
    }
    if (savedConfig.source) {
      applyConfigToUI(savedConfig);
      await renderSource();
    } else {
      previewEl.innerHTML = '<p class="view-placeholder">No diagram configured\u2014edit this page to add one.</p>';
    }
  }
}

bootstrap();

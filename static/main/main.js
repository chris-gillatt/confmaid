const EXAMPLE_SOURCE = `flowchart TD
  A[User opens page] --> B[Insert Confmaid macro]
  B --> C[Paste Mermaid source]
  C --> D[Render diagram]`;

const statusEl = document.getElementById("status");
const previewEl = document.getElementById("preview");
const sourceEl = document.getElementById("source");
const renderBtn = document.getElementById("renderBtn");
const resetBtn = document.getElementById("resetBtn");

let mermaid;

function setStatus(kind, message) {
  statusEl.className = `status ${kind}`;
  statusEl.textContent = message;
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

renderBtn.addEventListener("click", () => {
  renderSource();
});

resetBtn.addEventListener("click", () => {
  sourceEl.value = EXAMPLE_SOURCE;
  renderSource();
});

renderSource();
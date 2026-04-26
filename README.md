# Confmaid - Mermaid Diagrams for Confluence

Confmaid is a Confluence Cloud Forge app project for authoring and rendering Mermaid diagrams inside Confluence pages.

## Licence

This project is licensed under the MIT Licence. See `LICENSE`.

## Current Scope

- Platform: Confluence Cloud (Forge)
- MVP diagrams: flowchart, sequence, class
- Rendering strategy: hybrid direction, client-side-first MVP
- Security baseline: strict input validation and sanitisation gates

## Repository Structure

- `docs/problem-statement.md`: living product statement, requirements, and ADR log
- `src/lib/mermaidValidation.js`: Mermaid source validation utilities
- `src/lib/htmlSafety.js`: HTML escaping utility for untrusted source
- `src/lib/macroRenderer.js`: safe macro payload rendering helper
- `src/lib/macroConfig.js`: macro config normalisation and persistence contract helpers
- `src/resolverHandlers.js`: Forge operation handlers for macro lifecycle actions
- `src/index.js`: Forge resolver entrypoint with local test fallback
- `tests/mermaidValidation.test.js`: baseline unit tests for validator behaviour
- `static/main/index.html`: macro editor and preview scaffold UI
- `static/main/main.js`: Mermaid runtime load, resolver invocation, and local persistence fallback
- `static/main/invokeAdapter.mjs`: Forge bridge invoke adapter with local fallback

## Contribution Policy

See `CONTRIBUTING.md` for commit conventions and the British English documentation standard.

## Implemented API Operations

The resolver currently supports these payload operations:

- `healthcheck`: basic connectivity response
- `validate`: validates Mermaid input and returns diagnostics
- `render`: validates then returns safe macro HTML payload with escaped source
- `loadMacroConfig`: returns normalised macro config for editor hydration
- `saveMacroConfig`: validates and returns persisted config plus rendered preview payload
- `renderFromMacroConfig`: renders using saved macro config source

`static/main/main.js` resolves invoke in this order:

1. `window.__CONFMAID_INVOKE__`
2. `window.__FORGE_BRIDGE_INVOKE__`
3. dynamic import of `@forge/bridge` invoke
4. local fallback invoke for development and reopen-flow testing

## Local Development (Current)

This repository now contains a Forge-aligned resolver baseline with macro configuration load/save/render contracts and tests. UI-to-resolver invocation wiring is the next step.

### Prerequisites

- Podman (recommended)
- Atlassian Forge CLI

## Container-First Development (Recommended)

Using Podman keeps the host clean and gives a reproducible Node/npm environment for the project.

On macOS, initialise and start the Podman VM once:

```bash
podman machine init
podman machine start
```

### 1) Build the development image

```bash
podman build -f Containerfile.dev -t confmaid-dev:node20 .
```

### 2) Start a shell in the project container

```bash
podman run --rm -it \
	-v "$PWD":/workspace:Z \
	-w /workspace \
	confmaid-dev:node20
```

### 3) Run tests in the container

```bash
npm test
```

### Forge CLI in container

Inside the running container:

```bash
npm install -g @forge/cli
forge --version
forge login
forge register
```

After `forge register`, replace the app id placeholder in `manifest.yml`.

## Optional Host Install (If You Prefer)

If you do not want to use Podman, install Node and npm directly on macOS:

```bash
brew install node@20
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
node --version
npm --version
```

Install Forge CLI once Node/npm are available:

```bash
npm install -g @forge/cli
forge --version
```

### Run tests

```bash
node --test
```

The suite now includes a resolver contract integration-style lifecycle test (`tests/macroLifecycle.integration.test.js`) for insert/save/reopen/edit/render flows.

### Forge bootstrap (next runnable step)

```bash
forge login
forge register
```

## Next Implementation Steps

1. Replace the interim dynamic bridge import with packaged `@forge/bridge` wiring in deployed Custom UI assets.
2. Persist macro configuration via Confluence macro edit/save cycle and reload flow.
3. Run end-to-end integration tests against a live Forge/Confluence environment once credentials are available.
4. Add security and performance test suites.

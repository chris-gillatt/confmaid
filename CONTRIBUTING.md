# Contributing

Thank you for contributing to Confmaid.

## Documentation Language Standard

All project documentation must use British English.

- Use British spellings in prose, headings, and examples.
- Keep US English only where syntax, APIs, commands, library names, or external quoted text require it.
- Do not rename code symbols purely for spelling changes unless there is a technical reason and tests are updated.

Examples:

- Use `optimise`, not `optimize`.
- Use `behaviour`, not `behavior`.
- Use `initialise`, not `initialize`.
- Use `sanitise` / `sanitisation`, not `sanitize` / `sanitization`.

## Commit Standard

Use Conventional Commits with informative bodies that explain both change and intent.

Required structure:

1. Subject line in Conventional Commit format.
2. `What changed:` bullets.
3. `Why:` bullets.

Example:

```text
feat(core): add macro source validation path

What changed:
- Added Mermaid input validation helper.
- Added resolver operation for validation.

Why:
- Prevents invalid macro content from being persisted.
- Establishes a secure baseline before richer editor features.
```

## Development Workflow

Container-first development is recommended.

```bash
podman machine init
podman machine start
podman build -f Containerfile.dev -t confmaid-dev:node20 .
podman run --rm -it -v "$PWD":/workspace:Z -w /workspace confmaid-dev:node20
```

Run tests:

```bash
npm test
```

## Shell Command Guidance

- Prefer temporary files over heredocs when running terminal commands; heredocs can be brittle across shells and execution environments.
# Confmaid Living Problem Statement

## 1. Problem Statement

Confluence users need a reliable way to create and maintain diagrams as text so diagrams stay versionable, reviewable, and easy to update. Confmaid provides a Confluence Cloud macro that accepts Mermaid syntax and renders diagrams directly in page content.

## 2. Goals

- Provide a smooth insert and edit macro flow in Confluence.
- Accept Mermaid text and render diagrams predictably in page view.
- Support MVP diagram types: flowchart, sequence, and class.
- Provide validation feedback for invalid Mermaid input.
- Establish secure defaults for untrusted diagram input.

## 3. Non-Goals (Initial)

- Confluence Data Center or Server plugin support.
- Real-time collaborative diagram editing.
- Full Mermaid feature parity on day one.

## 4. User Journey (Target)

1. User opens Confluence page editor.
2. User inserts macro via `+` menu or slash command.
3. User searches for Mermaid integration macro.
4. User pastes Mermaid source into macro body/editor.
5. User inserts/saves macro.
6. Page view shows rendered diagram.

## 5. Functional Requirements

- FR-001: Macro discoverable in Confluence macro browser.
- FR-002: Mermaid source input field in macro edit workflow.
- FR-003: Render valid Mermaid source into visible diagram output.
- FR-004: Show actionable validation errors for invalid input.
- FR-005: Preserve source across save/reopen/edit cycles.
- FR-006: Macro must operate in two distinct display modes (see Section 12).
- FR-007: Mermaid source must only be editable when the Confluence page is in edit mode.
- FR-008: In Standard Mode, the editor GUI must not be visible in page view — only the rendered diagram is shown.
- FR-009: Button labels must clearly communicate what they do in context.

## 6. Non-Functional Requirements

- NFR-001: Input handling must be safe against script injection attempts.
- NFR-002: Invalid input should fail gracefully without page breakage.
- NFR-003: Common diagrams should render within acceptable interactive latency.
- NFR-004: Architecture decisions must be recorded as ADRs.

## 7. Feature Backlog (Phased)

### MVP

- Macro insertion and edit UX.
- Source validation with clear error messages.
- Rendering for flowchart, sequence, class diagrams.

### Post-MVP

- Live preview while editing.
- Extended diagram coverage (state, ERD, gantt, pie, journey, gitGraph).
- Export helpers.
- Accessibility and performance hardening.

## 12. Display Modes

Confmaid supports two display modes. The default is Standard Mode.

### Standard Mode (default)

The macro shows the source editor and action buttons **only when the Confluence page is in edit mode**. When the user saves or navigates away (page view), the editor GUI disappears entirely and only the rendered diagram is shown. This matches the expected behaviour of a native Confluence macro.

- Edit mode: source editor + title field + action buttons (Validate, Render Preview) are visible.
- Page view: rendered diagram only — no editor chrome.

### Dual Mode

Both the source editor and the rendered diagram are visible side-by-side at all times, even in page view. This is useful for documentation-heavy contexts where readers benefit from seeing the source alongside the output. The source editor is **read-only in page view** — it can only be edited when the page is in edit mode.

- Edit mode: editor + diagram, source is editable.
- Page view: editor (read-only) + diagram, no edit controls.

### Mode Selector

A toggle in the macro configuration allows the author to switch between Standard and Dual Mode at the per-macro level.

### Button Label Glossary

| Current label  | Problem                                          | Proposed label     |
|----------------|--------------------------------------------------|--------------------|
| Load Saved     | Unclear — loads what from where?                 | Revert             |
| Save Config    | Unclear — saves where? Into Forge storage?       | Save to Macro      |
| Validate       | Clear                                            | Validate           |
| Render Preview | Clear                                            | Render Preview     |
| Reset Example  | Clear                                            | Reset Example      |

**Load Saved / Revert**: discards unsaved edits and reloads the last-saved macro config from Forge storage. Should only be visible in edit mode.  
**Save Config / Save to Macro**: persists the current source and title into Forge storage as this macro's configuration. Should only be visible in edit mode.

## 8. Risks and Mitigations

- Risk: XSS through untrusted source.
  - Mitigation: strict validation, sanitisation, and isolated rendering strategy.
- Risk: Mermaid parse/render failures impacting user trust.
  - Mitigation: deterministic error states and robust fallback UI.
- Risk: Scope expansion before stable MVP.
  - Mitigation: phase gates and explicit acceptance criteria.

## 9. Acceptance Criteria (MVP)

- AC-001: User can insert macro and provide Mermaid source.
- AC-002: Valid flowchart, sequence, and class sources render correctly.
- AC-003: Invalid source returns clear error feedback.
- AC-004: Macro save/reopen preserves source without corruption.
- AC-005: Unsafe input patterns are blocked or neutralised.

## 10. ADR Log

### ADR-001: Platform Scope

- Status: Accepted
- Date: 2026-04-26
- Context: Project requires a clear initial platform target.
- Decision: Build for Confluence Cloud using Forge first.
- Consequences:
  - Enables faster Cloud-focused delivery.
  - Defers Data Center/Server and Atlassian SDK implementation to a future track.
  - Keeps architecture and tooling aligned with Forge constraints.

### ADR-002: Resolver and Macro Persistence Contract

- Status: Accepted
- Date: 2026-04-26
- Context: The macro needs a reliable edit/save/reopen lifecycle before full Confluence integration is wired.
- Decision:
  - Adopt Forge Resolver-style operation definitions for macro actions.
  - Introduce explicit operations for `loadMacroConfig`, `saveMacroConfig`, and `renderFromMacroConfig`.
  - Normalise and validate macro config at save/load boundaries using shared helper modules.
- Consequences:
  - Establishes a stable contract for UI-to-backend integration.
  - Keeps validation and sanitisation logic in one path, reducing divergent behaviour.
  - Makes persistence behaviour testable in local and container test runs before deployment.

### ADR-003: UI Invoke Adapter with Local Persistence Fallback

- Status: Accepted
- Date: 2026-04-26
- Context: The project needs to continue feature delivery before full Forge bridge packaging is wired for deployed Custom UI assets.
- Decision:
  - Use a UI invoke adapter based on `window.__CONFMAID_INVOKE__` for resolver operations.
  - Provide a local browser storage fallback for `loadMacroConfig` and `saveMacroConfig` to support edit/save/reopen flows during local development.
- Consequences:
  - Keeps editor behaviour aligned with resolver contracts while reducing local development friction.
  - Allows rapid iteration of macro lifecycle UX without blocking on packaging details.
  - Requires follow-up integration step to wire Forge bridge `invoke` in deployed assets.

### ADR-004: Packaged Forge Bridge for Custom UI Runtime

- Status: Accepted
- Date: 2026-04-26
- Context: The interim dynamic import path for bridge invocation was useful for development, but deployment requires deterministic packaged assets.
- Decision:
  - Bundle `@forge/bridge` via the UI build step and load it as a local static vendor module.
  - Keep adapter fallback logic for local development and test execution only.
- Consequences:
  - Aligns runtime behaviour with Forge deployment expectations.
  - Removes external runtime dependency for bridge import resolution.
  - Adds a build dependency and artefact generation step before deployment.

### ADR-005: Display Mode Architecture

- Status: Proposed
- Date: 2026-04-26
- Context: The macro currently shows the editor GUI in both edit and page view, making it unclear whether the user is editing or viewing. The source is also lost on page navigate because it is not persisted into Forge storage on page save. This causes confusion about the macro's purpose and undermines the user journey.
- Decision:
  - Introduce two explicit display modes: **Standard** and **Dual** (see Section 12).
  - Use the Forge `context` API to detect whether the macro is running in `edit` or `view` context and conditionally render the editor UI.
  - In Standard Mode (default), hide the editor entirely in page view and render only the SVG diagram.
  - In Dual Mode, show source (read-only in page view) alongside the diagram.
  - Rename ambiguous button labels to accurately describe their action.
  - Mode is stored as a per-macro config property alongside source and title.
- Consequences:
  - Editor chrome is never visible to readers in Standard Mode — macro behaves like a native Confluence diagram block.
  - The "Save to Macro" button becomes the explicit trigger for committing source to Forge storage; the "Revert" button discards unsaved edits.
  - Dual Mode must guard the editor with a read-only attribute outside edit context.
  - Requires Forge `context.extension.edit` (or equivalent) to be reliably available at macro render time.

## 11. Change Log

- 2026-04-26: Initial problem statement, requirements, phase framing, and ADR-001 created.
- 2026-04-26: Added ADR-002 for resolver operation design and macro config persistence contract.
- 2026-04-26: Added ADR-003 for UI invoke adapter strategy and local persistence fallback.
- 2026-04-26: Added bridge adapter implementation path in Custom UI with ordered invoke fallback resolution.
- 2026-04-26: Added ADR-004 for packaged Forge bridge runtime and local fallback boundaries.
- 2026-04-26: Added FR-006–FR-009 for display mode and UX clarity requirements.
- 2026-04-26: Added Section 12 (Display Modes) defining Standard and Dual modes, mode selector, and button label glossary.
- 2026-04-26: Added ADR-005 for display mode architecture.

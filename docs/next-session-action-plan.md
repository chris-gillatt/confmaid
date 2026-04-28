# Confmaid Next Session Action Plan

Date: 2026-04-26
Context: Persistence is now fixed. Remaining issues are macro edit discoverability and config-window exit UX.

## Problem Summary

1. In page edit mode, selecting the macro does not clearly expose the expected configure/edit affordance early enough.
2. Config modal has no obvious explicit exit action during normal workflow.
3. Desired behavior: clicking Save to Macro should close the config modal automatically and return user to page editor so they can click Update.

## Priority Order

1. Auto-close config modal on Save to Macro (highest priority)
2. Improve edit affordance discoverability when macro is selected in page editor
3. Optional UX polish for explicit close/cancel action

## Implementation Plan

### Phase 1: Save to Macro closes config modal

Goal: after successful save, user is returned to Confluence editor immediately.

Changes:

- File: static/main/main.js
- In submit flow, call view.submit with keepEditing=false (or omit keepEditing entirely, since false is default).
- Keep existing validation first; only submit on valid config.
- Update status copy from long-running wording to a short final confirmation before modal closes.

Expected result:

- User clicks Save to Macro -> modal closes -> user continues in page editor -> Update page persists diagram.

### Phase 2: Improve macro edit affordance in page editor

Goal: make it obvious how to re-open config for existing macro instances.

Changes:

- Add explicit editor-view detection state:
  - Config context: extension.macro.isConfiguring=true
  - Editor-view context: extension.isEditing=true and !extension.macro.isConfiguring
- In editor-view (not config modal), apply non-interactive preview behavior to make macro selection easier:
  - CSS for editor-view: disable pointer events on preview internals so click selects macro node cleanly
  - Keep rendered output visible (Standard mode behavior unchanged)
- Add a compact in-macro hint banner visible only in editor-view:
  - Example text: "Select macro and click Configure to edit diagram"
  - This avoids dead-end UI and mirrors Confluence-native editing flow.

Expected result:

- First click reliably selects macro block and shows Confluence configure controls.
- Users understand immediately how to reopen config.

### Phase 3: Optional explicit close/cancel UX (if still needed)

Goal: provide an obvious escape path inside config modal.

Options:

- Add Cancel button that calls view.close() when available.
- Keep Save to Macro as primary action that closes via submit.

Note:

- Use this only if user feedback still says modal exit is unclear after Phase 1.

## Testing Checklist

### Functional

- Insert new macro -> config opens (openOnInsert still true)
- Enter Mermaid code -> Render Preview works
- Click Save to Macro -> modal closes automatically
- Click Update page -> page updates and diagram persists
- Re-open page edit -> configure existing macro -> previous config is present

### Discoverability

- In page editor, click macro once -> configure affordance appears without needing to click title text
- Hint text appears only in editor-view and not in published page view

### Regression

- Standard mode: published page shows diagram only
- Dual mode: published page shows read-only source + diagram
- Mermaid rendering still has arrows and labels as before
- Runtime version line still visible in config modal

### Quality gates

- npm run build:ui
- npm run lint
- npm test (currently 33 tests)
- forge deploy + forge install --upgrade (development)

## Files Expected To Change Next Session

- static/main/main.js
- static/main/styles.css
- static/main/index.html
- (optional) tests for editor-view mode UI behavior if covered by existing test style

## Definition of Done

- Save to Macro closes modal every time after successful validation.
- User can easily discover how to re-open config from selected macro in editor.
- Page Update records changes and persisted diagram remains after reload.
- Build/lint/tests green and app deployed to development.

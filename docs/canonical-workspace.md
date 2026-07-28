# Canonical map workspace

The primary map now edits a `ScimDocument` directly. It no longer relies on translated touch events or on the legacy mapper's private React state.

## One accepted model

The Map, Model and Review workspaces share one browser-local accepted document.

- Manual map edits change the canonical entities, relationships or radial view.
- AI responses are complete candidate documents.
- Both are compared with `compareScimDocuments`.
- Both produce the same `ScimDocumentChange` operations.
- Accepted operations are stored in one revision history with an origin of `human` or `ai`.

An AI never edits the accepted map invisibly. The Review workspace applies only the operations explicitly selected by the human reviewer.

## Native pointer interaction

The primary map uses Pointer Events directly:

- mouse, touch and pen use the same handlers;
- the dragged node captures its pointer until completion;
- node movement updates only the frozen radial view placement;
- a completed drag records one canonical view revision rather than one revision per movement frame;
- Navigate mode leaves browser scrolling and pinch zoom available;
- Edit mode uses explicit node hit targets of at least 48 by 48 units.

Scenario previews are read-only. This prevents a user from accidentally changing the baseline while looking at a simulated result.

## Manual capabilities

The canonical map supports:

- selecting, moving, editing, adding and deleting entities;
- adding and deleting directed relationships;
- editing entity kind, locality layer, status and supported needs;
- baseline and scenario preview;
- simulation explanations;
- undoing the latest accepted revision;
- copying or downloading authoritative SCIM;
- copying the text-first AI handoff;
- reviewing an AI proposal against the exact accepted workspace baseline.

The complete original mapper remains at `/legacy` while specialist controls such as impact-zone editing and threat-sector editing are migrated onto canonical state.

## Persistence

The accepted document and the latest 100 revisions are stored in local storage. They are not uploaded to an AI provider by the map. A user chooses when to copy a portable handoff into an external chat.

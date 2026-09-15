# Markdown Editor Architecture

## Goal

Introduce a native-input markdown editor surface for React Native with two modules:

- `MarkdownTextInput`: focused editing primitive built on native `TextInput`
- `MarkdownComposer`: wrapper that combines compact and expanded editing modes

Markdown remains the source of truth. The renderer already present in this repo is used for preview and output rendering, while the editor layer is responsible for selection-aware markdown transforms and composer UX.

## Scope For First Milestone

- Add typed editor APIs
- Add a compact composer with an expand button
- Add an expanded composer mode
- Add pure markdown command utilities for:
    - bold
    - italic
    - strikethrough
    - inline code
    - headings
    - blockquote
    - bullet lists
    - ordered lists
    - fenced code blocks
    - links
    - tables
- Add tests for command behavior and initial component behavior

Not included yet:

- live attributed styling inside the input
- native iOS/Android attributed text bridges
- image or file support
- advanced table editing UI

## Current Implementation Status

Implemented:

- typed editor command model
- compact and expanded composer modules
- selection-safe markdown command helpers
- async command payload resolution hooks for actions like links and tables
- built-in native composer prompts for link and table insertion
- prompt validation and normalization for URLs and table dimensions
- newline continuation shortcuts for:
    - blockquotes
    - bullet lists
    - ordered lists
- exit shortcuts for empty list and blockquote markers
- compact composer auto-grow with a capped height before expansion
- expanded-mode preview powered by the existing markdown parser and renderer
- expanded-mode preview visibility toggle

Still pending:

- richer keyboard shortcut handling
- more advanced built-in dialogs and field-level UX polish

## WYSIWYG Editing

`MarkdownEditor` is the unified surface and supports two modes via a `mode`
prop (`'plaintext' | 'wysiwyg'`) plus an optional built-in toggle:

- `plaintext`: edits the raw markdown source through `MarkdownTextInput`.
- `wysiwyg`: edits through `MarkdownWysiwygEditor`, a real multiline
  `TextInput` whose inline markers are hidden and whose content is rendered as
  styled `Text` spans (bold, italic, underline, strikethrough, inline code).

Markdown is always the source of truth in both modes. The WYSIWYG surface keeps
the markdown source authoritative while presenting marker-free display text:

- `utils/wysiwygModel.ts` is a pure module that parses the source into a display
  string plus a per-character source-offset map and grouped styled segments.
- `applyDisplayEdit` uses the previous display selection to locate edits,
  falling back to a common prefix/suffix diff for native replacements elsewhere.
  It preserves paired delimiters around surviving content, removes spans emptied
  by the edit, and joins matching spans when their separating text is deleted.
  Line breaks close and reopen inline formatting, and joining blocks removes the
  second block's prefix. Lines whose delimiter boundaries become invalid are
  serialized again; untouched valid syntax and literal code remain unchanged.
  Its optional third argument accepts the previous display selection, and the
  native editor supplies it automatically.
- `applyInlineFormatWysiwyg` toggles formats on selected display characters and
  serializes the affected lines. It keeps block prefixes outside inline formats,
  preserves nested styles, and treats code contents as literal text. Delimiter
  choice, escaped punctuation, and character references keep the stored Markdown
  valid at word boundaries without adding visible characters.
- `displaySelectionToSource` / `sourceOffsetToDisplay` translate selections
  between the two coordinate spaces. Selections are clamped after value changes
  and translated for both toolbar and parent-controlled mode changes.
- Async command resolvers apply their returned command to the latest committed
  value and selection. Pending commands are discarded after unmounting or when
  editing is disabled. Both toolbars honor `editable={false}` and `readOnly`.
- The native surface uses styled children without a `TextInput.value`, since
  React Native does not support combining both. Accepted edits retain the input
  instance. If a parent rejects an edit, the surface replaces its native input
  to restore the source text and selection, and restores focus when needed.

Known limitations (next steps):

- Headings hide their prefixes and lists show synthetic markers. Quotes, tables,
  links, and fenced code blocks are still edited as literal visible text.
- Native styling, selection, and IME behavior need validation on iOS and Android
  devices. Replacing the input after a rejected edit can reset native undo and
  composition state; tests cover the component recovery path using native mocks.
- Intraword underscores are treated as italic markers when balanced.

## Design Principles

- Native inputs only
- Markdown is always stored as plain text
- Editing commands must be deterministic and selection-safe
- Public APIs must stay strict and typed
- Complex behavior should start as pure utility functions with test coverage

## Module Layout

- `src/editor/types.ts`
- `src/editor/utils/selection.ts`
- `src/editor/commands/formatMarkdown.ts`
- `src/editor/MarkdownTextInput.tsx`
- `src/editor/MarkdownComposer.tsx`
- `src/editor/index.ts`

## Editing Model

Editor state is represented by:

- `value: string`
- `selection: { start: number; end: number }`
- `mode: 'compact' | 'expanded'`

Formatting commands receive the current `value` and `selection`, and return:

- updated markdown string
- updated selection

This keeps command logic independent from React and native event details.

## Two-Module Strategy

### `MarkdownTextInput`

Responsibilities:

- wrap React Native `TextInput`
- keep selection in sync
- expose formatting command entry points
- stay usable on its own

### `MarkdownComposer`

Responsibilities:

- orchestrate compact vs expanded mode
- render the compact editor with an expand button
- render optional toolbars
- later host preview and richer block editing controls

## Next Milestones

### Milestone 2

- typing shortcut engine for markdown prefixes and inline wrappers
- toolbar presets for compact and expanded modes
- preview slot powered by existing markdown renderer

### Milestone 3

- native live styling implementation
- inline syntax highlighting while typing
- platform parity checks for selection edge cases

### Milestone 4

- richer block tools
- link dialog support
- table row and column helpers
- accessibility and keyboard refinements

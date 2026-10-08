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
the markdown source authoritative while presenting marker-free display text.

The fidelity contract, enforced by `__tests__/wysiwygFidelity.test.ts`: text the
user types or pastes reaches `value` byte for byte, lines the user did not touch
are never rewritten, and the editor hides exactly the markers the renderer
consumes so the sent message looks like the editor did.

- `utils/wysiwygModel.ts` parses the source into a display string, per-character
  source ranges and formats, grouped styled segments, and the recognised inline
  spans and block prefixes. Inline parsing is a port of markdown-it's rules
  (delimiter runs with CommonMark flanking, the rule of three, backtick runs,
  escapes, entities, `~~` and the `ins` plugin's `++`), using markdown-it's own
  character classes, so `snake_case`, `2 * 3`, `C++` and `a*b*c` parse exactly
  as the message bubble renders them. Lines are parsed independently and cached
  by text, and whole models are cached by source, so a keystroke re-parses only
  the line it touched and both editor components share one model per value.
- `utils/wysiwygEdit.ts` translates display edits back onto the source. It
  classifies the surviving source bytes into units (display characters, hidden
  delimiters, block prefixes, newlines), inserts the typed text between them,
  and verifies by re-parsing that every surviving span is still recognised.
  Text typed after a character continues its formatting; trailing whitespace
  moves outside closing delimiters; code spans are not extended by typing at
  their end; a newline closes open spans and reopens them on the next line;
  Enter continues list and quote prefixes and exits an empty one; deleting a
  glyph or the newline before a prefix removes the whole prefix; spans emptied
  by a deletion lose their delimiters and matching neighbours are joined.
- Markdown typed by hand takes effect: when typed marker characters change the
  parse without altering visible text, the keystrokes are kept verbatim. The
  result's `caretOutside` flag tells the component that the next keystroke at
  that caret belongs after the span that was just closed, so `*b*` then `c`
  gives `*b*c`. When an edit would break surviving formatting, the pipeline
  escapes the typed markers, switches `_`/`*` delimiter families, and only as a
  last resort re-serializes the edited lines (choosing markers, escaping, and
  finally character references for boundaries CommonMark cannot express, such
  as bold code directly followed by a letter).
- `applyInlineFormatWysiwyg` toggles formats on the selected display characters
  (or the word around a collapsed caret) and re-serializes only those lines,
  keeping block prefixes, other lines and literal characters as they were.
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
  Like a controlled React Native `TextInput`, the parent must commit `value`
  synchronously; a debounced or asynchronous parent is indistinguishable from a
  rejection.

Known limitations (next steps):

- Headings hide their prefixes and lists show synthetic markers (with their
  indentation). Quotes, tables, links, images, HTML and fenced code blocks are
  edited as literal visible text; link URLs and indented code blocks are
  inline-parsed like prose, so their display may hide emphasis the renderer
  keeps literal. The stored value is never affected.
- Inline spans are matched per line. Emphasis that CommonMark would carry across
  a soft line break within a paragraph shows its markers in the editor.
- Native styling, selection, IME, autocorrect and undo behavior need validation
  on iOS and Android devices; see `doc/wysiwyg-device-checklist.md`. Replacing
  the input after a rejected edit can reset native undo and composition state;
  tests cover the component recovery path using native mocks.

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

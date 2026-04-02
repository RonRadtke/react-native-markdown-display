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
- newline continuation shortcuts for:
  - blockquotes
  - bullet lists
  - ordered lists
- exit shortcuts for empty list and blockquote markers
- compact composer auto-grow with a capped height before expansion
- expanded-mode preview powered by the existing markdown parser and renderer

Still pending:

- native inline attributed styling
- richer keyboard shortcut handling
- richer built-in dialogs for link and table editing

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

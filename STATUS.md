# React Native Markdown Display — Current Status

## Use Case

This library serves a dual role in an AI chat interface (similar to Claude):

- **Input** — `MarkdownTextInput` / `MarkdownComposer` let the user compose messages with markdown
  formatting via a toolbar and typing shortcuts.
- **Output** — `Markdown` renders completed AI responses. `MarkdownStream` renders responses while
  they are still being generated, sealing incomplete markdown on every token arrival so the layout
  never breaks mid-stream.

---

## What Is Built

### Viewer (rendering pipeline)

| Component / utility | Status | Notes |
|---|---|---|
| `Markdown` | Done | Full markdown-it parse → AST → render pipeline |
| `MarkdownStream` | Done | Streaming-safe wrapper; seals open fences; blinking cursor |
| `sealIncompleteMarkdown` | Done | Pure utility; handles 3+/4+ backtick and tilde fences |
| Plugin system | Done | `markdown-it` plugins slot in via `markdownit` prop |
| Custom render rules | Done | `rules` prop; full per-node override |
| Custom styles | Done | `style` prop; `mergeStyle` flag |
| Underline plugin | Done | Bundled as `underlinePlugin` |
| Image handling | Done | `allowedImageHandlers`, `defaultImageHandler` |

### Editor (input pipeline)

| Component / utility | Status | Notes |
|---|---|---|
| `MarkdownTextInput` | Done | Native `TextInput` + toolbar + command hooks |
| `MarkdownComposer` | Done | Compact/expanded modes, auto-grow, preview toggle |
| `MarkdownPreview` | Done | Read-only rendered view of live editor content |
| Toolbar | Done | Bold, italic, strikethrough, inline-code, headings, blockquote, lists, code-block, link, table |
| `formatMarkdown` commands | Done | All toolbar actions; toggle detection (wrap and unwrap) |
| Typing shortcuts | Done | `Enter` continuation for `>`, `-`, `*`, `+`, `1.`; exit on empty marker |
| Link dialog | Done | Built-in native `Alert`-based prompt; URL normalization |
| Table dialog | Done | Built-in native `Alert`-based prompt; dimension validation |
| `onCommand` hook | Done | Intercept any toolbar command before it applies |
| `toolbarItems` prop | Done | Restrict or reorder toolbar buttons |

### Example App

- Live chat UI simulating user + AI message bubbles
- `MarkdownComposer` as the input surface
- `MarkdownStream` animating a ~750-character AI response over ~10 s on load
- Replay button in the header to restart the stream
- All markdown elements covered in the demo: headings, bold/italic/strike/code, fenced code block,
  ordered list, unordered list, table, blockquote

---

## Test Coverage (123 tests)

| Test file | Tests | What it covers |
|---|---|---|
| `editorCommands.test.ts` | ~50 | Every `formatMarkdown` action: wrap, unwrap, toggle, edge cases |
| `editorShortcuts.test.ts` | 11 | Typing shortcuts and continuation rules |
| `MarkdownTextInput.test.tsx` | 11 | Component rendering, toolbar interaction, `onCommand` hook |
| `sealIncompleteMarkdown.test.ts` | 15 | Fence detection: 3/4 backtick, tilde, language tags, mixed fences |
| `MarkdownStream.test.tsx` | 7 | Render, cursor show/hide, streaming seal, custom props |

---

## What Is Left

### High priority

#### Code block copy button — Done
Clipboard icon overlaid on fenced code blocks. Shows only when consumer passes `onCopyCode` prop
to `Markdown` / `MarkdownStream`. Copy button swaps to "Copied!" label for 2 s.

- `onCopyCode?: (code: string, language: string) => void` on both `Markdown` and `MarkdownStream`
- Consumer handles clipboard; library is dependency-free for this feature
- Example app wires up `Alert.alert` as demo

#### Syntax highlighting in code blocks — Done
Color-token highlighting via `prism-react-renderer` (v2, light theme `oneLight`).

- Language extracted from the opening fence info string (e.g. ` ```typescript `)
- Falls back to plain text for unknown languages
- Horizontally scrollable so long lines never wrap
- New style keys: `fence_header`, `fence_language_label`, `fence_copy_button`,
  `fence_copy_text`, `fence_code`, `fence_token`

### Medium priority

#### `ChatMessage` component
A ready-made bubble-pair layout component so consumers do not have to wire up the
`Markdown` / `MarkdownStream` discriminator themselves.

```tsx
<ChatMessage
  role="assistant"         // 'user' | 'assistant'
  content={text}
  streaming={isStreaming}  // passes through to MarkdownStream
  style={bubbleStyle}
/>
```

Props to consider: `role`, `content`, `streaming`, `avatar`, `timestamp`, `onCopyMessage`.

#### `ChatComposer` component
An integrated input + send button surface that wraps `MarkdownComposer`.

```tsx
<ChatComposer
  onSend={(markdown) => sendMessage(markdown)}
  placeholder="Message..."
  disabled={isStreaming}
/>
```

The `disabled` prop should prevent sending while the AI is still streaming.

### Low priority / polish

| Item | Notes |
|---|---|
| Dark mode support in example | Done — `useColorScheme()` drives `LIGHT_CHROME`/`DARK_CHROME` palettes + `colorScheme` prop on `Markdown`/`MarkdownStream`. Note: `colorScheme` is a plain prop so consumers using Paper/styled-components should source it from their own theme context, not `useColorScheme()` directly, to stay in sync with manual toggles. |
| Keyboard-avoiding in example chat | `KeyboardAvoidingView` so the composer stays above the soft keyboard |
| Accessibility labels on toolbar | Each toolbar `Pressable` needs an `accessibilityLabel` |
| `streaming` auto-scroll | `FlatList.scrollToEnd` triggered on each new token |
| Native inline styling | Live syntax highlighting while typing inside `MarkdownTextInput` (Milestone 3 in architecture doc) |

---

## Architecture Notes

### Streaming pipeline

```
children (partial string)
  → sealIncompleteMarkdown (closes open fences)
  → stringToTokens (markdown-it)
  → cleanupTokens + groupTextTokens
  → tokensToAST
  → renderer.render (applies plugins, rules, styles)
```

Sealing happens **before** `stringToTokens`. Every extension point (plugins, rules, styles,
custom renderer) sits downstream and is completely unaffected by the streaming mode.

### Editor command model

All formatting commands are pure functions:

```ts
formatMarkdown(value, selection, format, options?) → { value, selection }
```

No React, no native event details. Easy to test, easy to extend.

### Toggle detection

Commands detect whether the selection is already wrapped and unwrap instead of double-wrapping.
Implemented for: bold, italic, strikethrough, inline-code, code-block, headings.

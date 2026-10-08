# WYSIWYG Device Checklist

The rich-text surface (`MarkdownWysiwygEditor`) renders styled children inside a
multiline `TextInput` and controls `selection` on every render. The pure model is
covered by Jest, but the native behaviors below can only be verified on hardware.
Run through this list on a physical iOS device and a physical Android device
(plus one Android device with a non-Latin keyboard) before calling the mode
production ready. Use the example app in `example/` with the mode toggle set to
"Rich text".

## Typing and caret

- [ ] Type a sentence quickly; no dropped or duplicated characters.
- [ ] Type `**bold** then plain` character by character; "bold" turns bold when the
      second `**` is typed and "then plain" stays plain.
- [ ] Type `snake_case_name`, `2 * 3 * 4`, `C++` and a URL with underscores; the
      value shown in plain-text mode equals what was typed.
- [ ] Place the caret in the middle of a bold word, type, and confirm the text stays
      bold and the caret does not jump.
- [ ] Type a space at the end of a bold word; the bold stays intact and the space is
      plain.
- [ ] Type at the end of an inline code span; the new text is not code.
- [ ] Press Enter inside a list item; a new item appears with the caret after the
      bullet. Press Enter on the empty item; the bullet disappears.
- [ ] Backspace over a bullet; the whole marker disappears in one step.

## Selection and toolbar

- [ ] Select text with the handles and press Bold; the selection stays on the same
      text afterwards.
- [ ] Toggle Bold with a collapsed caret inside a word; the word is formatted.
- [ ] Switch between plain and rich mode with a selection active; the selection
      covers the same text in both modes.
- [ ] Long-press to select a word; the native menu (Copy, Paste, Select All) works.

## Input methods

- [ ] Android autocorrect: type a misspelled word and accept the suggestion inside
      bold text; the correction lands in the right place and stays bold.
- [ ] iOS predictive text: accept a QuickType suggestion; no doubled words.
- [ ] CJK input (Japanese or Chinese keyboard): compose a word over several
      keystrokes; composition is not interrupted by re-rendering.
- [ ] Dictation: dictate a sentence; text appears once, with correct caret.
- [ ] Emoji keyboard: insert an emoji inside bold text; it renders bold and the
      caret advances by one glyph.
- [ ] Hardware keyboard (iPad / Android with keyboard): Shift+Arrow selection, Cmd/Ctrl+Z
      undo after typing, and after a toolbar command.

## Paste and large content

- [ ] Paste a 20k+ character log or code dump; the paste completes without a
      visible freeze and scrolling stays smooth while typing at the end.
- [ ] Paste content copied from a Windows machine (CRLF line endings); fenced code
      blocks stay literal.
- [ ] Paste a previous assistant answer containing headings, lists, tables and code
      fences; the value sent equals the pasted text.

## Rejection and controlled value

- [ ] Wire `onChangeText` to a parent that ignores edits over a length limit; the
      surface snaps back and keeps focus.
- [ ] Wire `onChangeText` through a debounce (this is unsupported); observe the
      flicker and document it, or remove the debounce.

## Rendering

- [ ] Headings render larger with no visible `#`.
- [ ] Underline plus strikethrough on the same text shows both decorations.
- [ ] Dark mode colors from `formatStyles` are applied.
- [ ] Placeholder shows when the value is empty in rich mode.

Record the device, OS version, React Native version and the outcome of each item
in the pull request that promotes the rich mode.

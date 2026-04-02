export {
  applyBlockFormat,
  applyInlineFormat,
  applyLinkFormat,
  applyTableFormat,
  createMarkdownTable,
} from './commands/formatMarkdown';
export {default as MarkdownComposer} from './MarkdownComposer';
export {default as MarkdownTextInput} from './MarkdownTextInput';
export {getSelectedText, normalizeSelection} from './utils/selection';

export type {
  MarkdownBlockFormat,
  MarkdownCommand,
  MarkdownCommandResult,
  MarkdownComposerMode,
  MarkdownComposerProps,
  MarkdownInlineFormat,
  MarkdownLinkPayload,
  MarkdownSelection,
  MarkdownTablePayload,
  MarkdownTextInputCommandPayload,
  MarkdownTextInputProps,
  MarkdownToolbarItem,
} from './types';

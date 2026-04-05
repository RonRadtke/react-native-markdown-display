import markdownItIns from 'markdown-it-ins';

import type MarkdownIt from 'markdown-it';

export type MarkdownItPlugin = (markdownIt: MarkdownIt) => void;

export const underlinePlugin: MarkdownItPlugin = markdownItIns;

export default underlinePlugin;

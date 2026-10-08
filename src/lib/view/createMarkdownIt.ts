import MarkdownIt from 'markdown-it';

import {underlinePlugin, type MarkdownItPlugin} from './plugins/underline';

export interface CreateMarkdownItOptions {
    plugins?: readonly MarkdownItPlugin[];
    typographer?: boolean;
    underline?: boolean;
}

export const createMarkdownIt = ({plugins = [], typographer = true, underline = false}: CreateMarkdownItOptions = {}): MarkdownIt => {
    const markdownIt = MarkdownIt({typographer});

    if (underline) {
        markdownIt.use(underlinePlugin);
    }

    plugins.forEach(plugin => {
        markdownIt.use(plugin);
    });

    return markdownIt;
};

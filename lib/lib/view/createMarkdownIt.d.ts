import MarkdownIt from 'markdown-it';
import { type MarkdownItPlugin } from './plugins/underline';
export interface CreateMarkdownItOptions {
    plugins?: readonly MarkdownItPlugin[];
    typographer?: boolean;
    underline?: boolean;
}
export declare const createMarkdownIt: ({ plugins, typographer, underline, }?: CreateMarkdownItOptions) => MarkdownIt;
//# sourceMappingURL=createMarkdownIt.d.ts.map
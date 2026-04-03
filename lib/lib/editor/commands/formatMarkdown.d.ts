import type { MarkdownBlockFormat, MarkdownCommandResult, MarkdownInlineFormat, MarkdownLinkPayload, MarkdownSelection, MarkdownTablePayload } from '../types';
export declare const applyInlineFormat: (value: string, selection: MarkdownSelection | undefined, format: MarkdownInlineFormat) => MarkdownCommandResult;
export declare const applyBlockFormat: (value: string, selection: MarkdownSelection | undefined, format: MarkdownBlockFormat) => MarkdownCommandResult;
export declare const applyLinkFormat: (value: string, selection: MarkdownSelection | undefined, payload?: MarkdownLinkPayload) => MarkdownCommandResult;
export declare const createMarkdownTable: (payload?: MarkdownTablePayload) => string;
export declare const applyTableFormat: (value: string, selection: MarkdownSelection | undefined, payload?: MarkdownTablePayload) => MarkdownCommandResult;
//# sourceMappingURL=formatMarkdown.d.ts.map
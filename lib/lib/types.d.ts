import type MarkdownIt from 'markdown-it';
import type { ComponentType, ReactNode } from 'react';
import type { ImageStyle, StyleProp, TextProps, TextStyle, ViewStyle } from 'react-native';
export type MarkdownStyle = ImageStyle & TextStyle & ViewStyle;
export type MarkdownStyleObject = Partial<MarkdownStyle>;
export type MarkdownStyleMap = Record<string, StyleProp<MarkdownStyle>>;
export type MarkdownStyleSheet = Record<string, MarkdownStyleObject>;
export type TextComponent = ComponentType<TextProps>;
export type MarkdownTokenNesting = -1 | 0 | 1;
export type MarkdownItToken = MarkdownIt.Token;
export interface TokenLike {
    type: string;
    tag: string;
    attrs: Array<[string, string]> | null;
    nesting: MarkdownTokenNesting;
    children: TokenLike[] | null;
    content: string;
    markup: string;
    info: string;
    meta: unknown;
    block: boolean;
    attrIndex(name: string): number;
}
export interface ASTNode {
    type: string;
    sourceType: string;
    sourceInfo: unknown;
    sourceMeta: unknown;
    block: boolean;
    key: string;
    content: string;
    markup: string;
    tokenIndex: number;
    index: number;
    attributes: Record<string, string>;
    children: ASTNode[];
}
export type OnLinkPress = (url: string) => boolean;
export type RenderRule = (node: ASTNode, children: ReactNode[], parentNodes: ASTNode[], styles: MarkdownStyleMap, ...extra: unknown[]) => ReactNode;
export type RenderRules = Record<string, RenderRule | undefined> & {
    link?: RenderRule;
    blocklink?: RenderRule;
    image?: RenderRule;
    unknown?: RenderRule;
};
export interface MarkdownParser {
    parse(value: string, env: Record<string, never>): MarkdownItToken[];
}
//# sourceMappingURL=types.d.ts.map
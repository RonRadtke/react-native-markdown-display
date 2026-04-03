import MarkdownIt from 'markdown-it';
import type {ReactNode} from 'react';
import React from 'react';
import FitImage from 'react-native-fit-image';
import AstRenderer from './lib/AstRenderer';
import parser from './lib/parser';
import renderRules from './lib/renderRules';
import {styles as defaultStyles} from './lib/styles';
import textStyleProps from './lib/data/textStyleProps';
import getUniqueID from './lib/util/getUniqueID';
import hasParents from './lib/util/hasParents';
import openUrl from './lib/util/openUrl';
import removeTextStyleProps from './lib/util/removeTextStyleProps';
import {stringToTokens} from './lib/util/stringToTokens';
import tokensToAST from './lib/util/tokensToAST';
import type {ASTNode, MarkdownParser, MarkdownStyleMap, MarkdownStyleObject, OnLinkPress, RenderRules, TextComponent} from './lib/types';

export * from './editor';
export {AstRenderer, FitImage, getUniqueID, hasParents, MarkdownIt, openUrl, parser, renderRules, removeTextStyleProps, stringToTokens, defaultStyles as styles, textStyleProps, tokensToAST,};
export type {ASTNode, MarkdownParser, MarkdownStyleMap, MarkdownStyleObject, OnLinkPress, RenderRules,};

export interface MarkdownProps {
    allowedImageHandlers?: string[];
    children: string | ASTNode[];
    debugPrintTree?: boolean;
    defaultImageHandler?: string | null;
    markdownit?: MarkdownParser;
    maxTopLevelChildren?: number | null;
    mergeStyle?: boolean;
    onLinkPress?: OnLinkPress;
    renderer?: AstRenderer | null;
    rules?: RenderRules | null;
    style?: MarkdownStyleMap | null;
    textcomponent?: TextComponent;
    topLevelMaxExceededItem?: ReactNode;
}

declare const Markdown: React.NamedExoticComponent<MarkdownProps> & {
    displayName?: string;
};
export default Markdown;
//# sourceMappingURL=index.d.ts.map
import MarkdownIt from 'markdown-it';
import type {ReactNode} from 'react';
import React, {useMemo} from 'react';
import {Text} from 'react-native';
import FitImage from 'react-native-fit-image';

import AstRenderer from './lib/AstRenderer';
import {getRenderer} from './lib/createRenderer';
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

import type {ASTNode, MarkdownParser, MarkdownStyleMap, MarkdownStyleObject, OnLinkPress, RenderRules, TextComponent,} from './lib/types';

export * from './editor';

export {
    AstRenderer,
    FitImage,
    getUniqueID,
    hasParents,
    MarkdownIt,
    openUrl,
    parser,
    renderRules,
    removeTextStyleProps,
    stringToTokens,
    defaultStyles as styles,
    textStyleProps,
    tokensToAST,
};

export type {
    ASTNode,
    MarkdownParser,
    MarkdownStyleMap,
    MarkdownStyleObject,
    OnLinkPress,
    RenderRules,
};

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

const MarkdownComponent = React.memo(function MarkdownMemo({
                                                               children,
                                                               textcomponent = Text,
                                                               renderer = null,
                                                               rules = null,
                                                               style = null,
                                                               mergeStyle = true,
                                                               markdownit = MarkdownIt({
                                                                   typographer: true,
                                                               }),
                                                               onLinkPress,
                                                               maxTopLevelChildren = null,
                                                               topLevelMaxExceededItem =
                                                               <Text key="dotdotdot">...</Text>,
                                                               allowedImageHandlers = [
                                                                   'data:image/png;base64',
                                                                   'data:image/gif;base64',
                                                                   'data:image/jpeg;base64',
                                                                   'https://',
                                                                   'http://',
                                                               ],
                                                               defaultImageHandler = 'https://',
                                                               debugPrintTree = false,
                                                           }: MarkdownProps) {
        const memoizedRenderer = useMemo(
            () =>
                getRenderer(
                    textcomponent,
                    renderer,
                    rules,
                    style,
                    mergeStyle,
                    onLinkPress,
                    maxTopLevelChildren,
                    topLevelMaxExceededItem,
                    allowedImageHandlers,
                    defaultImageHandler,
                    debugPrintTree,
                ),
            [
                allowedImageHandlers,
                debugPrintTree,
                defaultImageHandler,
                maxTopLevelChildren,
                mergeStyle,
                onLinkPress,
                renderer,
                rules,
                style,
                textcomponent,
                topLevelMaxExceededItem,
            ],
        );

        const memoizedParser = useMemo(() => markdownit, [markdownit]);

        return parser(children, memoizedRenderer.render, memoizedParser);
    },
);

const Markdown = MarkdownComponent as React.NamedExoticComponent<MarkdownProps> & {
    displayName?: string;
};

Markdown.displayName = 'Markdown';

export default Markdown;

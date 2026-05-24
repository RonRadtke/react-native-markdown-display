import MarkdownIt from 'markdown-it';
import type {ReactNode} from 'react';
import React, {useMemo} from 'react';
import {Text} from 'react-native';
import FitImage from 'react-native-fit-image';

import AstRenderer from './lib/view/AstRenderer';
import {createMarkdownIt} from './lib/view/createMarkdownIt';
import {getRenderer} from './lib/view/createRenderer';
import {underlinePlugin} from './lib/view/plugins/underline';
import parser from './lib/view/parser';
import renderRules from './lib/view/renderRules';
import {styles as defaultStyles} from './lib/view/styles';
import textStyleProps from './lib/view/data/textStyleProps';
import getUniqueID from './lib/view/util/getUniqueID';
import hasParents from './lib/view/util/hasParents';
import openUrl from './lib/view/util/openUrl';
import removeTextStyleProps from './lib/view/util/removeTextStyleProps';
import {sealIncompleteMarkdown} from './lib/view/util/sealIncompleteMarkdown';
import {stringToTokens} from './lib/view/util/stringToTokens';
import tokensToAST from './lib/view/util/tokensToAST';
import MarkdownStream from './lib/view/StreamingMarkdown';

import type {CreateMarkdownItOptions} from './lib/view/createMarkdownIt';
import type {MarkdownItPlugin} from './lib/view/plugins/underline';
import type {ASTNode, MarkdownParser, MarkdownStyleMap, MarkdownStyleObject, OnCopyCode, OnLinkPress, RenderRules, TextComponent,} from './lib/view/types';
import type {MarkdownStreamProps} from './lib/view/StreamingMarkdown';

export * from './lib/editor';

export {
    AstRenderer,
    FitImage,
    createMarkdownIt,
    getUniqueID,
    hasParents,
    MarkdownIt,
    MarkdownStream,
    openUrl,
    parser,
    renderRules,
    removeTextStyleProps,
    sealIncompleteMarkdown,
    stringToTokens,
    defaultStyles as styles,
    textStyleProps,
    tokensToAST,
    underlinePlugin,
};

export type {
    ASTNode,
    CreateMarkdownItOptions,
    MarkdownParser,
    MarkdownItPlugin,
    MarkdownStreamProps,
    MarkdownStyleMap,
    MarkdownStyleObject,
    OnCopyCode,
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
    onCopyCode?: OnCopyCode;
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
                                                               markdownit = createMarkdownIt(),
                                                               onCopyCode,
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
                    onCopyCode,
                ),
            [
                allowedImageHandlers,
                debugPrintTree,
                defaultImageHandler,
                maxTopLevelChildren,
                mergeStyle,
                onCopyCode,
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

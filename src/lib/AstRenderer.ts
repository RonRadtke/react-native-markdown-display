import {StyleSheet} from 'react-native';

import textStyleProps from './data/textStyleProps';
import convertAdditionalStyles from './util/convertAdditionalStyles';
import getUniqueID from './util/getUniqueID';

import type {ASTNode, MarkdownStyleMap, MarkdownStyleObject, OnLinkPress, RenderRule, RenderRuleExtra, RenderRules,} from './types';
import type {ReactNode} from 'react';

type StylePropertyValue = MarkdownStyleObject[keyof MarkdownStyleObject];

export default class AstRenderer {
    private readonly _allowedImageHandlers: string[];

    private readonly _debugPrintTree: boolean;

    private readonly _defaultImageHandler: string | null;

    private readonly _maxTopLevelChildren: number | null;

    private readonly _onLinkPress: OnLinkPress | undefined;

    private readonly _renderRules: RenderRules;

    private readonly _style: MarkdownStyleMap;

    private readonly _topLevelMaxExceededItem: ReactNode;

    public constructor(
        renderRules: RenderRules,
        style: MarkdownStyleMap,
        onLinkPress?: OnLinkPress,
        maxTopLevelChildren: number | null = null,
        topLevelMaxExceededItem: ReactNode = null,
        allowedImageHandlers: string[] = [],
        defaultImageHandler: string | null = null,
        debugPrintTree = false,
    ) {
        this._renderRules = renderRules;
        this._style = style;
        this._onLinkPress = onLinkPress;
        this._maxTopLevelChildren = maxTopLevelChildren;
        this._topLevelMaxExceededItem = topLevelMaxExceededItem;
        this._allowedImageHandlers = allowedImageHandlers;
        this._defaultImageHandler = defaultImageHandler;
        this._debugPrintTree = debugPrintTree;
    }

    public getRenderFunction(type: string): RenderRule {
        const renderFunction = this._renderRules[type] ?? this._renderRules.unknown;

        if (!renderFunction) {
            throw new Error(`Missing render rule: ${type}`);
        }

        if (!this._renderRules[type]) {
            console.warn(
                `Warning, unknown render rule encountered: ${type}. 'unknown' render rule used (by default, returns null - nothing rendered)`,
            );
        }

        return renderFunction;
    }

    public renderNode = (
        node: ASTNode,
        parentNodes: ReadonlyArray<ASTNode>,
        isRoot = false,
    ): ReactNode => {
        const renderFunction = this.getRenderFunction(node.type);
        const parents = [...parentNodes];

        if (this._debugPrintTree) {
            console.log(`${'-'.repeat(parents.length)}${node.type}`);
        }

        parents.unshift(node);

        let children = node.children.map((childNode) =>
            this.renderNode(childNode, parents),
        );

        if (node.type === 'link' || node.type === 'blocklink') {
            return renderFunction(
                node,
                children,
                [...parentNodes],
                this._style,
                this._onLinkPress,
            );
        }

        if (node.type === 'image') {
            return renderFunction(
                node,
                children,
                [...parentNodes],
                this._style,
                this._allowedImageHandlers,
                this._defaultImageHandler,
            );
        }

        if (children.length === 0 || node.type === 'list_item') {
            const styleObj: MarkdownStyleObject = {};

            for (let index = parentNodes.length - 1; index >= 0; index -= 1) {
                const parentNode = parentNodes[index]!;
                let refStyle: MarkdownStyleObject = {};

                if (typeof parentNode.attributes.style === 'string') {
                    refStyle = convertAdditionalStyles(parentNode.attributes.style);
                }

                const parentStyle = this._style[parentNode.type];

                if (parentStyle) {
                    refStyle = {
                        ...refStyle,
                        ...(StyleSheet.flatten(parentStyle) ?? {}),
                    };

                    if (parentNode.type === 'list_item') {
                        const nextParentNode = parentNodes[index + 1];

                        const contentStyle =
                            nextParentNode?.type === 'bullet_list'
                                ? this._style.bullet_list_content
                                : nextParentNode?.type === 'ordered_list'
                                    ? this._style.ordered_list_content
                                    : undefined;

                        refStyle = {
                            ...refStyle,
                            ...(StyleSheet.flatten(contentStyle) ?? {}),
                        };
                    }
                }

                for (const propertyName of Object.keys(refStyle)) {
                    if (textStyleProps.includes(propertyName)) {
                        (styleObj as Record<string, StylePropertyValue>)[propertyName] = (
                            refStyle as Record<string, StylePropertyValue>
                        )[propertyName];
                    }
                }
            }

            return renderFunction(
                node,
                children,
                [...parentNodes],
                this._style,
                styleObj as RenderRuleExtra,
            );
        }

        if (
            isRoot &&
            this._maxTopLevelChildren !== null &&
            children.length > this._maxTopLevelChildren
        ) {
            children = [
                ...children.slice(0, this._maxTopLevelChildren),
                this._topLevelMaxExceededItem,
            ];
        }

        return renderFunction(node, children, [...parentNodes], this._style);
    };

    public render = (nodes: ReadonlyArray<ASTNode>): ReactNode => {
        const root: ASTNode = {
            type: 'body',
            sourceType: 'body',
            sourceInfo: null,
            sourceMeta: null,
            block: true,
            key: getUniqueID(),
            content: '',
            markup: '',
            tokenIndex: -1,
            index: 0,
            attributes: {},
            children: [...nodes],
        };

        return this.renderNode(root, [], true);
    };
}

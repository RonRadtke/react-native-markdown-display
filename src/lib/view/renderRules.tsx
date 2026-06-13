import type {ReactNode} from 'react';
import React from 'react';
import {Platform, Pressable, StyleSheet, View} from 'react-native';
import FitImage, {type IFitImageProps} from 'react-native-fit-image';

import textStyleProps from './data/textStyleProps';
import hasParents from './util/hasParents';
import openUrl from './util/openUrl';

import FenceBlock from './FenceBlock';

import type {ASTNode, MarkdownStyleObject, OnCopyCode, OnLinkPress, RenderRuleExtra, RenderRules, TextComponent,} from './types';

type StylePropertyValue = MarkdownStyleObject[keyof MarkdownStyleObject];

const trimTrailingNewLine = (content: string): string =>
    content.endsWith('\n') ? content.slice(0, -1) : content;

const getStyleObject = (value?: RenderRuleExtra): MarkdownStyleObject => {
    if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof value !== 'function'
    ) {
        return value as MarkdownStyleObject;
    }

    return {};
};

const getOnLinkPress = (value?: RenderRuleExtra): OnLinkPress | undefined =>
    typeof value === 'function' ? value as OnLinkPress : undefined;

const getAllowedImageHandlers = (value?: RenderRuleExtra): string[] =>
    Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : [];

const getDefaultImageHandler = (value?: RenderRuleExtra): string | null =>
    typeof value === 'string' ? value : value === null ? null : null;

const pickTextStyles = (
    inheritedStyles: MarkdownStyleObject,
): MarkdownStyleObject => {
    const textStyles: MarkdownStyleObject = {};

    for (const propertyName of Object.keys(inheritedStyles)) {
        if (textStyleProps.includes(propertyName)) {
            (textStyles as Record<string, StylePropertyValue>)[propertyName] = (
                inheritedStyles as Record<string, StylePropertyValue>
            )[propertyName];
        }
    }

    return textStyles;
};

const getBlockLinkAccessibilityLabel = (node: ASTNode): string | undefined => {
    const imageAlt = node.children.find((child) => child.type === 'image')
        ?.attributes.alt;

    if (imageAlt && imageAlt.trim().length > 0) {
        return imageAlt;
    }

    const title = node.attributes.title;

    if (title && title.trim().length > 0) {
        return title;
    }

    const href = node.attributes.href;

    return href && href.trim().length > 0 ? href : undefined;
};

const renderRules = (Text: TextComponent): RenderRules => ({
    unknown: () => null,
    body: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_body}>
            {children}
        </View>
    ),
    heading1: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_heading1}>
            {children}
        </View>
    ),
    heading2: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_heading2}>
            {children}
        </View>
    ),
    heading3: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_heading3}>
            {children}
        </View>
    ),
    heading4: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_heading4}>
            {children}
        </View>
    ),
    heading5: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_heading5}>
            {children}
        </View>
    ),
    heading6: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_heading6}>
            {children}
        </View>
    ),
    hr: (node, _children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_hr}/>
    ),
    strong: (node, children, _parent, styles) => (
        <Text key={node.key} style={styles.strong}>
            {children}
        </Text>
    ),
    em: (node, children, _parent, styles) => (
        <Text key={node.key} style={styles.em}>
            {children}
        </Text>
    ),
    ins: (node, children, _parent, styles) => (
        <Text key={node.key} style={styles.ins}>
            {children}
        </Text>
    ),
    s: (node, children, _parent, styles) => (
        <Text key={node.key} style={styles.s}>
            {children}
        </Text>
    ),
    blockquote: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_blockquote}>
            {children}
        </View>
    ),
    bullet_list: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_bullet_list}>
            {children}
        </View>
    ),
    ordered_list: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_ordered_list}>
            {children}
        </View>
    ),
    list_item: (
        node,
        children,
        parent,
        styles,
        inheritedStyles?: RenderRuleExtra,
    ) => {
        const textStyles = pickTextStyles({
            ...getStyleObject(inheritedStyles),
            ...(StyleSheet.flatten(styles.list_item) ?? {}),
        });

        if (hasParents(parent, 'bullet_list')) {
            return (
                <View key={node.key} style={styles._VIEW_SAFE_list_item}>
                    <Text
                        style={[textStyles, styles.bullet_list_icon]}
                        accessible={false}
                    >
                        {Platform.select({
                            android: '\u2022',
                            ios: '\u00B7',
                            default: '\u2022',
                        })}
                    </Text>
                    <View style={styles._VIEW_SAFE_bullet_list_content}>{children}</View>
                </View>
            );
        }

        if (hasParents(parent, 'ordered_list')) {
            const orderedList = parent.find(
                (parentNode) => parentNode.type === 'ordered_list',
            );
            const startValue = Number(orderedList?.attributes.start);
            const listItemNumber = Number.isFinite(startValue)
                ? startValue + node.index
                : node.index + 1;

            return (
                <View key={node.key} style={styles._VIEW_SAFE_list_item}>
                    <Text style={[textStyles, styles.ordered_list_icon]}>
                        {listItemNumber}
                        {node.markup}
                    </Text>
                    <View style={styles._VIEW_SAFE_ordered_list_content}>{children}</View>
                </View>
            );
        }

        return (
            <View key={node.key} style={styles._VIEW_SAFE_list_item}>
                {children}
            </View>
        );
    },
    code_inline: (
        node,
        _children,
        _parent,
        styles,
        inheritedStyles?: RenderRuleExtra,
    ) => (
        <Text
            key={node.key}
            style={[getStyleObject(inheritedStyles), styles.code_inline]}
        >
            {node.content}
        </Text>
    ),
    code_block: (
        node,
        _children,
        _parent,
        styles,
        inheritedStyles?: RenderRuleExtra,
    ) => (
        <Text
            key={node.key}
            style={[getStyleObject(inheritedStyles), styles.code_block]}
        >
            {trimTrailingNewLine(node.content)}
        </Text>
    ),
    fence: (
        node,
        _children,
        _parent,
        styles,
        onCopyCode?: RenderRuleExtra,
        colorScheme?: RenderRuleExtra,
    ) => {
        const language = typeof node.sourceInfo === 'string'
            ? node.sourceInfo.trim().split(/\s+/)[0] ?? ''
            : '';
        return (
            <FenceBlock
                key={node.key}
                code={trimTrailingNewLine(node.content)}
                colorScheme={colorScheme === 'dark' ? 'dark' : 'light'}
                language={language}
                styles={styles}
                onCopyCode={typeof onCopyCode === 'function' ? onCopyCode as OnCopyCode : undefined}
            />
        );
    },
    table: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_table}>
            {children}
        </View>
    ),
    thead: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_thead}>
            {children}
        </View>
    ),
    tbody: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_tbody}>
            {children}
        </View>
    ),
    th: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_th}>
            {children}
        </View>
    ),
    tr: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_tr}>
            {children}
        </View>
    ),
    td: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_td}>
            {children}
        </View>
    ),
    link: (
        node,
        children,
        _parent,
        styles,
        onLinkPress?: RenderRuleExtra,
    ): ReactNode => (
        <Pressable
            accessibilityRole="link"
            key={node.key}
            onPress={() => openUrl(node.attributes.href, getOnLinkPress(onLinkPress))}
        >
            <Text style={styles.link}>{children}</Text>
        </Pressable>
    ),
    blocklink: (
        node,
        children,
        _parent,
        styles,
        onLinkPress?: RenderRuleExtra,
    ): ReactNode => (
        <Pressable
            accessibilityLabel={getBlockLinkAccessibilityLabel(node)}
            accessibilityRole="link"
            key={node.key}
            onPress={() => openUrl(node.attributes.href, getOnLinkPress(onLinkPress))}
            style={styles.blocklink}
        >
            <View style={styles.image}>{children}</View>
        </Pressable>
    ),
    image: (
        node,
        _children,
        _parent,
        styles,
        allowedImageHandlers?: RenderRuleExtra,
        defaultImageHandler?: RenderRuleExtra,
    ) => {
        const src = node.attributes.src;
        const alt = node.attributes.alt;
        const handlers = getAllowedImageHandlers(allowedImageHandlers);
        const fallbackHandler = getDefaultImageHandler(defaultImageHandler);

        if (!src) {
            return null;
        }

        const show = handlers.some((value) =>
            src.toLowerCase().startsWith(value.toLowerCase()),
        );

        if (!show && fallbackHandler === null) {
            return null;
        }

        const imageProps: IFitImageProps = {
            indicator: true,
            style: styles._VIEW_SAFE_image,
            source: {
                uri: show ? src : `${fallbackHandler}${src}`,
            },
        };

        if (alt) {
            imageProps.accessible = true;
            imageProps.accessibilityLabel = alt;
        }

        return <FitImage key={node.key} {...imageProps} />;
    },
    text: (
        node,
        _children,
        _parent,
        styles,
        inheritedStyles?: RenderRuleExtra,
    ) => (
        <Text key={node.key} style={[getStyleObject(inheritedStyles), styles.text]}>
            {node.content}
        </Text>
    ),
    textgroup: (node, children, _parent, styles) => (
        <Text key={node.key} style={styles.textgroup}>
            {children}
        </Text>
    ),
    paragraph: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_paragraph}>
            {children}
        </View>
    ),
    hardbreak: (node, _children, _parent, styles) => (
        <Text key={node.key} style={styles.hardbreak}>
            {'\n'}
        </Text>
    ),
    softbreak: (node, _children, _parent, styles) => (
        <Text key={node.key} style={styles.softbreak}>
            {'\n'}
        </Text>
    ),
    pre: (node, children, _parent, styles) => (
        <View key={node.key} style={styles._VIEW_SAFE_pre}>
            {children}
        </View>
    ),
    inline: (node, children, _parent, styles) => (
        <Text key={node.key} style={styles.inline}>
            {children}
        </Text>
    ),
    span: (node, children, _parent, styles) => (
        <Text key={node.key} style={styles.span}>
            {children}
        </Text>
    ),
});

export default renderRules;

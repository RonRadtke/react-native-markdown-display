import React, {useEffect, useMemo, useState} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';

import AstRenderer from './AstRenderer';
import {createMarkdownIt} from './createMarkdownIt';
import {getRenderer} from './createRenderer';
import parser from './parser';
import {sealIncompleteMarkdown} from './util/sealIncompleteMarkdown';

import type {ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import type {MarkdownParser, MarkdownStyleMap, OnCopyCode, OnLinkPress, RenderRules, TextComponent} from './types';

const CURSOR_BLINK_ON_MS = 600;
const CURSOR_BLINK_OFF_MS = 600;

interface StreamingCursorProps {
    color: string;
    style?: StyleProp<ViewStyle>;
}

function StreamingCursor({color, style}: StreamingCursorProps): React.JSX.Element {
    const [opacity] = useState(() => new Animated.Value(1));

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {duration: 0, toValue: 1, useNativeDriver: false}),
                Animated.delay(CURSOR_BLINK_ON_MS),
                Animated.timing(opacity, {duration: 0, toValue: 0, useNativeDriver: false}),
                Animated.delay(CURSOR_BLINK_OFF_MS),
            ]),
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.cursor,
                {backgroundColor: color},
                style,
                {opacity},
            ]}
        />
    );
}

export interface MarkdownStreamProps {
    allowedImageHandlers?: string[];
    /**
     * The markdown source string. Unlike the base Markdown component, only
     * strings are accepted here — pre-parsed AST nodes do not make sense in a
     * streaming context.
     */
    children: string;
    /**
     * Color of the blinking cursor shown while streaming is active.
     * Defaults to black. Pass the foreground / text color of your theme.
     */
    cursorColor?: string;
    /** Override the cursor View style (size, margin, etc.). */
    cursorStyle?: StyleProp<ViewStyle>;
    debugPrintTree?: boolean;
    defaultImageHandler?: string | null;
    markdownit?: MarkdownParser;
    colorScheme?: 'light' | 'dark';
    maxTopLevelChildren?: number | null;
    mergeStyle?: boolean;
    onCopyCode?: OnCopyCode;
    onLinkPress?: OnLinkPress;
    renderer?: AstRenderer | null;
    rules?: RenderRules | null;
    /**
     * When true the source is sealed (unclosed code fences are closed) before
     * being handed to the parser, preventing layout thrash mid-stream. The
     * blinking cursor indicator is also shown while this is true.
     */
    streaming?: boolean;
    style?: MarkdownStyleMap | null;
    textcomponent?: TextComponent;
    topLevelMaxExceededItem?: ReactNode;
}

const MarkdownStream = React.memo(function MarkdownStream({
    allowedImageHandlers = [
        'data:image/png;base64',
        'data:image/gif;base64',
        'data:image/jpeg;base64',
        'https://',
        'http://',
    ],
    children,
    cursorColor = '#000000',
    cursorStyle,
    debugPrintTree = false,
    defaultImageHandler = 'https://',
    markdownit = createMarkdownIt(),
    maxTopLevelChildren = null,
    colorScheme,
    mergeStyle = true,
    onCopyCode,
    onLinkPress,
    renderer = null,
    rules = null,
    streaming = false,
    style = null,
    textcomponent = Text,
    topLevelMaxExceededItem = <Text key="dotdotdot">...</Text>,
}: MarkdownStreamProps) {
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
                colorScheme,
            ),
        [
            allowedImageHandlers,
            colorScheme,
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

    const source = useMemo(
        () => (streaming ? sealIncompleteMarkdown(children) : children),
        [children, streaming],
    );

    return (
        <View>
            {parser(source, memoizedRenderer.render, memoizedParser)}
            {streaming ? (
                <StreamingCursor color={cursorColor} style={cursorStyle} />
            ) : null}
        </View>
    );
});

MarkdownStream.displayName = 'MarkdownStream';

const styles = StyleSheet.create({
    cursor: {
        height: 16,
        marginTop: 4,
        width: 2,
    },
});

export default MarkdownStream;

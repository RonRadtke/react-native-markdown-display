import React, {useMemo} from 'react';
import {Text, View} from 'react-native';

import {createMarkdownIt} from '../../view/createMarkdownIt';
import {getRenderer} from '../../view/createRenderer';
import parser from '../../view/parser';
import styles from './style';

import type {MarkdownPreviewProps} from '../types';

const MarkdownPreview = React.memo(function MarkdownPreview({allowedImageHandlers = ['data:image/png;base64', 'data:image/gif;base64', 'data:image/jpeg;base64', 'https://', 'http://'], debugPrintTree = false, defaultImageHandler = 'https://', emptyState = 'Nothing to preview yet.', label = 'Preview', markdownit = createMarkdownIt(), maxTopLevelChildren = null, mergeStyle = true, onLinkPress, previewContainerStyle, renderer = null, rules = null, style = null, textcomponent = Text, topLevelMaxExceededItem = <Text key="dotdotdot">...</Text>, value}: MarkdownPreviewProps) {
    const memoizedRenderer = useMemo(() => getRenderer(textcomponent, renderer, rules, style, mergeStyle, onLinkPress, maxTopLevelChildren, topLevelMaxExceededItem, allowedImageHandlers, defaultImageHandler, debugPrintTree), [allowedImageHandlers, debugPrintTree, defaultImageHandler, maxTopLevelChildren, mergeStyle, onLinkPress, renderer, rules, style, textcomponent, topLevelMaxExceededItem]);

    const memoizedParser = useMemo(() => markdownit, [markdownit]);

    return (
        <View style={[styles.container, previewContainerStyle]}>
            <Text style={styles.label}>{label}</Text>
            {value.trim().length > 0 ? parser(value, memoizedRenderer.render, memoizedParser) : <Text style={styles.emptyState}>{emptyState}</Text>}
        </View>
    );
});

MarkdownPreview.displayName = 'MarkdownPreview';

export default MarkdownPreview;

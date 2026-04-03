import MarkdownIt from 'markdown-it';
import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {getRenderer} from '../lib/createRenderer';
import parser from '../lib/parser';

import type {MarkdownParser} from '../lib/types';
import type {MarkdownPreviewProps} from './types';

const MarkdownPreview = React.memo(function MarkdownPreview({
                                                                emptyState = 'Nothing to preview yet.',
                                                                label = 'Preview',
                                                                previewContainerStyle,
                                                                style = null,
                                                                value,
                                                            }: MarkdownPreviewProps) {
    const renderer = useMemo(
        () =>
            getRenderer(
                Text,
                null,
                null,
                style,
                true,
                undefined,
                null,
                <Text key="dotdotdot">...</Text>,
                [
                    'data:image/png;base64',
                    'data:image/gif;base64',
                    'data:image/jpeg;base64',
                    'https://',
                    'http://',
                ],
                'https://',
                false,
            ),
        [style],
    );

    const markdownit = useMemo<MarkdownParser>(
        () =>
            MarkdownIt({
                typographer: true,
            }),
        [],
    );

    return (
        <View style={[styles.container, previewContainerStyle]}>
            <Text style={styles.label}>{label}</Text>
            {value.trim().length > 0 ? (
                parser(value, renderer.render, markdownit)
            ) : (
                <Text style={styles.emptyState}>{emptyState}</Text>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        borderColor: '#E2E7EC',
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 12,
        padding: 12,
    },
    emptyState: {
        color: '#68707A',
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
});

MarkdownPreview.displayName = 'MarkdownPreview';

export default MarkdownPreview;

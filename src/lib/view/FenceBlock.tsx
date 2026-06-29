import React, {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Highlight, themes} from 'prism-react-renderer';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import type {MarkdownStyleMap, OnCopyCode} from './types';

const COPY_FEEDBACK_MS = 2000;

interface FenceBlockProps {
    code: string;
    colorScheme?: 'light' | 'dark';
    language: string;
    styles: MarkdownStyleMap;
    onCopyCode?: OnCopyCode | undefined;
}

const FenceBlock = React.memo(function FenceBlock({code, colorScheme = 'light', language, styles, onCopyCode}: FenceBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        onCopyCode?.(code, language);
        setCopied(true);
        setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    };

    const showHeader = language.length > 0 || onCopyCode !== undefined;
    const prismTheme = colorScheme === 'dark' ? themes.oneDark : themes.oneLight;
    const iconColor = colorScheme === 'dark' ? '#8b949e' : '#666666';

    return (
        <View style={styles._VIEW_SAFE_fence}>
            {showHeader && (
                <View style={styles._VIEW_SAFE_fence_header}>
                    <Text style={styles.fence_language_label}>{language}</Text>
                    {onCopyCode !== undefined && (
                        <Pressable accessibilityLabel="Copy code" accessibilityRole="button" onPress={handleCopy} style={styles._VIEW_SAFE_fence_copy_button}>
                            {copied ? <Text style={styles.fence_copy_text}>Copied!</Text> : <MaterialDesignIcons color={iconColor} name="content-copy" size={15} />}
                        </Pressable>
                    )}
                </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Highlight theme={prismTheme} code={code} language={language || 'text'}>
                    {({tokens, getTokenProps}) => (
                        <View style={styles._VIEW_SAFE_fence_code}>
                            {tokens.map((line, lineIndex) => (
                                <View key={lineIndex} style={localStyles.codeLine}>
                                    {line
                                        .filter(token => !token.empty)
                                        .map((token, tokenIndex) => {
                                            const tokenProps = getTokenProps({token});
                                            const tokenColor = tokenProps.style?.color;
                                            const tokenFontStyle = tokenProps.style?.fontStyle;
                                            const tokenFontWeight = tokenProps.style?.fontWeight;
                                            return (
                                                <Text key={tokenIndex} style={[styles.fence_token, tokenColor != null ? {color: String(tokenColor)} : null, tokenFontStyle != null ? {fontStyle: tokenFontStyle as 'normal' | 'italic'} : null, tokenFontWeight != null ? {fontWeight: String(tokenFontWeight) as 'bold' | 'normal'} : null]}>
                                                    {tokenProps.children}
                                                </Text>
                                            );
                                        })}
                                </View>
                            ))}
                        </View>
                    )}
                </Highlight>
            </ScrollView>
        </View>
    );
});

const localStyles = StyleSheet.create({codeLine: {flexDirection: 'row'}});

export default FenceBlock;

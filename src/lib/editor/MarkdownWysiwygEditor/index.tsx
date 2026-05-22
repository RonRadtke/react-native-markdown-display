import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
    Animated,
    type NativeSyntheticEvent,
    Pressable,
    Text,
    TextInput,
    type TextInputKeyPressEventData,
    View,
} from 'react-native';

import styles from './style';
import {normalizeSelection} from '../utils/selection';
import {
    insertTextAtSelection,
    removeTextBeforeSelection,
} from '../utils/wysiwygEditing';

import type {MarkdownSelection, MarkdownWysiwygEditorProps} from '../types';

const setForwardedRef = (
    forwardedRef: React.ForwardedRef<TextInput>,
    value: TextInput | null,
): void => {
    if (typeof forwardedRef === 'function') {
        forwardedRef(value);
        return;
    }

    if (forwardedRef) {
        forwardedRef.current = value;
    }
};

const MarkdownWysiwygEditor = React.forwardRef<
    TextInput,
    MarkdownWysiwygEditorProps
>(function MarkdownWysiwygEditor(
    {
        cursorBlinkEnabled = true,
        cursorStyle,
        editorStyle,
        onChangeText,
        onSelectionChange,
        placeholder,
        selection,
        textStyle,
        value,
        ...textInputProps
    },
    ref,
) {
    const inputRef = useRef<TextInput | null>(null);
    const cursorOpacity = useMemo(() => new Animated.Value(1), []);
    const [internalSelection, setInternalSelection] = useState(() =>
        normalizeSelection(value, selection),
    );

    const normalizedSelection = useMemo(
        () => normalizeSelection(value, selection ?? internalSelection),
        [internalSelection, selection, value],
    );

    useEffect(() => {
        if (!cursorBlinkEnabled) {
            cursorOpacity.setValue(1);
            return undefined;
        }

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(cursorOpacity, {
                    duration: 500,
                    toValue: 0,
                    useNativeDriver: false,
                }),
                Animated.timing(cursorOpacity, {
                    duration: 500,
                    toValue: 1,
                    useNativeDriver: false,
                }),
            ]),
        );

        animation.start();

        return () => {
            animation.stop();
        };
    }, [cursorBlinkEnabled, cursorOpacity]);

    const updateSelection = (nextSelection: MarkdownSelection): void => {
        if (!selection) {
            setInternalSelection(nextSelection);
        }

        onSelectionChange?.(nextSelection);
    };

    const applyResult = (
        result: ReturnType<typeof insertTextAtSelection>,
    ): void => {
        updateSelection(result.selection);
        onChangeText(result.value);
    };

    const focusInput = (): void => {
        inputRef.current?.focus();
    };

    const moveCursorToEnd = (): void => {
        updateSelection({
            end: value.length,
            start: value.length,
        });
        focusInput();
    };

    const handleHiddenInputChange = (typedText: string): void => {
        if (typedText.length === 0) {
            return;
        }

        applyResult(insertTextAtSelection(value, normalizedSelection, typedText));
    };

    const handleKeyPress = (
        event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    ): void => {
        textInputProps.onKeyPress?.(event);

        if (event.nativeEvent.key === 'Backspace') {
            applyResult(removeTextBeforeSelection(value, normalizedSelection));
        }
    };

    const visibleBeforeCursor = value.slice(0, normalizedSelection.start);
    const visibleAfterCursor = value.slice(normalizedSelection.end);
    const showPlaceholder = value.length === 0 && placeholder;

    return (
        <Pressable
            accessibilityRole="text"
            onPress={moveCursorToEnd}
            style={[styles.container, editorStyle]}
        >
            {showPlaceholder ? (
                <Text style={[styles.placeholder, textStyle]}>{placeholder}</Text>
            ) : (
                <View style={styles.cursorRow}>
                    <Text style={[styles.text, textStyle]}>{visibleBeforeCursor}</Text>
                    <Animated.View
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        style={[
                            styles.cursor,
                            cursorStyle,
                            {
                                opacity: cursorOpacity,
                            },
                        ]}
                    />
                    <Text style={[styles.text, textStyle]}>{visibleAfterCursor}</Text>
                </View>
            )}
            <TextInput
                {...textInputProps}
                autoCorrect={textInputProps.autoCorrect ?? true}
                caretHidden
                multiline
                onChangeText={handleHiddenInputChange}
                onKeyPress={handleKeyPress}
                ref={(input) => {
                    inputRef.current = input;
                    setForwardedRef(ref, input);
                }}
                selection={{end: 0, start: 0}}
                style={styles.hiddenInput}
                value=""
            />
        </Pressable>
    );
});

MarkdownWysiwygEditor.displayName = 'MarkdownWysiwygEditor';

export default MarkdownWysiwygEditor;

import React, {useMemo, useRef, useState} from 'react';
import {type NativeSyntheticEvent, Pressable, Text, TextInput, type TextInputContentSizeChangeEventData, type TextInputSelectionChangeEventData, View} from 'react-native';

import {applyToolbarAction} from '../commands/formatMarkdown';
import {executeCommand} from '../commands/executeCommand';
import {DEFAULT_TEXT_INPUT_TOOLBAR_ITEMS} from '../defaultToolbarItems';
import styles from './style';
import {applyMarkdownShortcut} from '../utils/shortcuts';
import {normalizeSelection} from '../utils/selection';
import {useCommittedValue} from '../utils/useCommittedValue';

import type {MarkdownCommand, MarkdownManagedTextInputProps, MarkdownTextInputProps, MarkdownToolbarButtonItem, MarkdownToolbarCommandItem, MarkdownToolbarItem, MarkdownToolbarMenuItem} from '../types';

const DEFAULT_TOOLBAR_ACCESSIBILITY_LABELS: Record<MarkdownCommand, string> = {bold: 'Bold', italic: 'Italic', underline: 'Underline', strikethrough: 'Strikethrough', 'inline-code': 'Inline code', 'heading-one': 'Heading one', 'heading-two': 'Heading two', 'heading-three': 'Heading three', blockquote: 'Block quote', 'bullet-list': 'Bullet list', 'ordered-list': 'Ordered list', 'code-block': 'Code block', link: 'Insert link', table: 'Insert table'};

const isToolbarMenuItem = (item: MarkdownToolbarItem): item is MarkdownToolbarMenuItem => 'items' in item;

const isToolbarCommandItem = (item: MarkdownToolbarButtonItem): item is MarkdownToolbarCommandItem => 'command' in item;

const getToolbarMenuAccessibilityLabel = (item: MarkdownToolbarMenuItem): string => item.accessibilityLabel ?? (typeof item.label === 'string' || typeof item.label === 'number' ? `${item.label} menu` : 'Toolbar menu');

const getToolbarButtonAccessibilityLabel = (item: MarkdownToolbarButtonItem): string => {
    if (item.accessibilityLabel) {
        return item.accessibilityLabel;
    }

    if (isToolbarCommandItem(item)) {
        return DEFAULT_TOOLBAR_ACCESSIBILITY_LABELS[item.command];
    }

    if (typeof item.label === 'string' || typeof item.label === 'number') {
        return String(item.label);
    }

    return 'Toolbar action';
};

const getToolbarButtonKey = (item: MarkdownToolbarButtonItem, index: number): string => (isToolbarCommandItem(item) ? `command:${item.command}:${index}` : `action:${index}`);

const renderToolbarLabel = (label: MarkdownToolbarItem['label']): React.ReactNode => (typeof label === 'string' || typeof label === 'number' ? <Text style={styles.toolbarButtonText}>{label}</Text> : <View style={styles.toolbarButtonContent}>{label}</View>);

const MarkdownTextInput = React.forwardRef<TextInput, MarkdownTextInputProps>(function MarkdownTextInput({onChangeText, onCommand, onSelectionChange, inputComponent: InputComponent, selection, style, toolbarItems = DEFAULT_TEXT_INPUT_TOOLBAR_ITEMS, compactMaxHeight, enableShortcuts = true, multiline = true, numberOfLines, resolveCommandPayload, value, ...textInputProps}, ref) {
    const [internalSelection, setInternalSelection] = useState(() => normalizeSelection(value, selection));
    const [contentHeight, setContentHeight] = useState<number | null>(null);
    const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
    const pendingSelectionValueRef = useRef<string | null>(null);

    const normalizedSelection = useMemo(() => normalizeSelection(value, selection ?? internalSelection), [internalSelection, selection, value]);
    const disabled = textInputProps.editable === false || textInputProps.readOnly === true;
    const latest = useCommittedValue({disabled, normalizedSelection, onChangeText, onCommand, resolveCommandPayload, selection, value});

    const handleSelectionChange = (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>): void => {
        const pendingSelectionValue = pendingSelectionValueRef.current;

        if (pendingSelectionValue && pendingSelectionValue !== value) {
            onSelectionChange?.(event);
            return;
        }

        if (pendingSelectionValue === value) {
            pendingSelectionValueRef.current = null;
        }

        if (!selection) {
            setInternalSelection(event.nativeEvent.selection);
        }

        onSelectionChange?.(event);
    };

    const handleCommandPress = async (command: MarkdownCommand): Promise<void> => {
        const initial = latest.current;
        if (!initial || initial.disabled) {
            return;
        }
        setOpenMenuIndex(null);

        const resolvedPayload = await initial.resolveCommandPayload?.(command);
        const current = latest.current;

        if (resolvedPayload === null || !current || current.disabled) {
            return;
        }

        const payload = resolvedPayload ?? {command};

        const result = executeCommand(current.value, current.normalizedSelection, payload);

        if (!current.selection) {
            pendingSelectionValueRef.current = result.value;
            setInternalSelection(result.selection);
        }

        current.onChangeText(result.value);
        current.onCommand?.(payload, result);
    };

    const handleToolbarButtonPress = async (item: MarkdownToolbarButtonItem): Promise<void> => {
        const current = latest.current;
        if (!current || current.disabled) {
            return;
        }
        if (isToolbarCommandItem(item)) {
            await handleCommandPress(item.command);
            return;
        }

        setOpenMenuIndex(null);

        const result = applyToolbarAction(current.value, current.normalizedSelection, item.action);

        if (!current.selection) {
            pendingSelectionValueRef.current = result.value;
            setInternalSelection(result.selection);
        }

        current.onChangeText(result.value);
    };

    const handleContentSizeChange = (event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>): void => {
        setContentHeight(event.nativeEvent.contentSize.height);
        textInputProps.onContentSizeChange?.(event);
    };

    const computedInputStyle = useMemo(() => [styles.input, compactMaxHeight !== undefined && contentHeight !== null ? {height: Math.min(Math.max(contentHeight, 44), compactMaxHeight), maxHeight: compactMaxHeight} : null, style], [compactMaxHeight, contentHeight, style]);

    const handleChangeText = (nextValue: string): void => {
        if (enableShortcuts) {
            const shortcutResult = applyMarkdownShortcut({nextValue, previousSelection: normalizedSelection, previousValue: value});

            if (shortcutResult) {
                if (!selection) {
                    pendingSelectionValueRef.current = shortcutResult.value;
                    setInternalSelection(shortcutResult.selection);
                }

                onChangeText(shortcutResult.value);
                return;
            }
        }

        onChangeText(nextValue);
    };

    const inputProps: MarkdownManagedTextInputProps = {...textInputProps, multiline, numberOfLines, onChangeText: handleChangeText, onContentSizeChange: handleContentSizeChange, onSelectionChange: handleSelectionChange, selection: normalizedSelection, style: computedInputStyle, value};

    return (
        <View style={styles.container}>
            {toolbarItems.length > 0 ? (
                <View style={styles.toolbar}>
                    {toolbarItems.map((item, index) => {
                        if (isToolbarMenuItem(item)) {
                            const isMenuOpen = openMenuIndex === index;

                            return (
                                <View key={`menu:${index}`} style={styles.toolbarMenuContainer}>
                                    <Pressable accessibilityLabel={getToolbarMenuAccessibilityLabel(item)} accessibilityRole="button" accessibilityState={{disabled, expanded: isMenuOpen}} disabled={disabled} onPress={() => setOpenMenuIndex(currentIndex => (currentIndex === index ? null : index))} style={[styles.toolbarButton, isMenuOpen ? styles.toolbarButtonActive : null]}>
                                        {renderToolbarLabel(item.label)}
                                    </Pressable>
                                    {isMenuOpen ? (
                                        <View style={styles.toolbarMenu}>
                                            {item.items.map((menuItem, menuItemIndex) => (
                                                <Pressable
                                                    accessibilityLabel={getToolbarButtonAccessibilityLabel(menuItem)}
                                                    accessibilityRole="button"
                                                    accessibilityState={{disabled}}
                                                    disabled={disabled}
                                                    key={getToolbarButtonKey(menuItem, menuItemIndex)}
                                                    onPress={() => {
                                                        handleToolbarButtonPress(menuItem);
                                                    }}
                                                    style={styles.toolbarMenuButton}>
                                                    {renderToolbarLabel(menuItem.label)}
                                                </Pressable>
                                            ))}
                                        </View>
                                    ) : null}
                                </View>
                            );
                        }

                        return (
                            <Pressable
                                accessibilityLabel={getToolbarButtonAccessibilityLabel(item)}
                                accessibilityRole="button"
                                accessibilityState={{disabled}}
                                disabled={disabled}
                                key={getToolbarButtonKey(item, index)}
                                onPress={() => {
                                    handleToolbarButtonPress(item);
                                }}
                                style={styles.toolbarButton}>
                                {renderToolbarLabel(item.label)}
                            </Pressable>
                        );
                    })}
                </View>
            ) : null}
            {InputComponent ? <InputComponent {...inputProps} ref={ref} /> : <TextInput {...inputProps} ref={ref} />}
        </View>
    );
});

MarkdownTextInput.displayName = 'MarkdownTextInput';

export default MarkdownTextInput;

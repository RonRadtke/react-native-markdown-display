import React, {useMemo, useRef, useState} from 'react';
import {type NativeSyntheticEvent, Pressable, Text, TextInput, type TextInputContentSizeChangeEventData, type TextInputSelectionChangeEventData, View,} from 'react-native';

import {applyBlockFormat, applyInlineFormat, applyLinkFormat, applyTableFormat, applyToolbarAction,} from '../commands/formatMarkdown';
import styles from './style';
import {applyMarkdownShortcut} from '../utils/shortcuts';
import {normalizeSelection} from '../utils/selection';

import type {MarkdownCommand, MarkdownCommandResult, MarkdownManagedTextInputProps, MarkdownTextInputCommandPayload, MarkdownTextInputProps, MarkdownToolbarButtonItem, MarkdownToolbarCommandItem, MarkdownToolbarItem, MarkdownToolbarMenuItem,} from '../types';

const DEFAULT_TOOLBAR_ITEMS: readonly MarkdownToolbarCommandItem[] = [
    {accessibilityLabel: 'Bold', command: 'bold', label: 'B'},
    {accessibilityLabel: 'Italic', command: 'italic', label: 'I'},
    {accessibilityLabel: 'Inline code', command: 'inline-code', label: '</>'},
];

const DEFAULT_TOOLBAR_ACCESSIBILITY_LABELS: Record<
    MarkdownCommand,
    string
> = {
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    strikethrough: 'Strikethrough',
    'inline-code': 'Inline code',
    'heading-one': 'Heading one',
    'heading-two': 'Heading two',
    'heading-three': 'Heading three',
    blockquote: 'Block quote',
    'bullet-list': 'Bullet list',
    'ordered-list': 'Ordered list',
    'code-block': 'Code block',
    link: 'Insert link',
    table: 'Insert table',
};

const isToolbarMenuItem = (
    item: MarkdownToolbarItem,
): item is MarkdownToolbarMenuItem => 'items' in item;

const isToolbarCommandItem = (
    item: MarkdownToolbarButtonItem,
): item is MarkdownToolbarCommandItem => 'command' in item;

const getToolbarMenuAccessibilityLabel = (
    item: MarkdownToolbarMenuItem,
): string =>
    item.accessibilityLabel ??
    (typeof item.label === 'string' || typeof item.label === 'number'
        ? `${item.label} menu`
        : 'Toolbar menu');

const getToolbarButtonAccessibilityLabel = (
    item: MarkdownToolbarButtonItem,
): string => {
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

const getToolbarButtonKey = (
    item: MarkdownToolbarButtonItem,
    index: number,
): string =>
    isToolbarCommandItem(item)
        ? `command:${item.command}:${index}`
        : `action:${index}`;

const renderToolbarLabel = (label: MarkdownToolbarItem['label']): React.ReactNode =>
    typeof label === 'string' || typeof label === 'number' ? (
        <Text style={styles.toolbarButtonText}>{label}</Text>
    ) : (
        <View style={styles.toolbarButtonContent}>{label}</View>
    );

const executeCommand = (
    value: string,
    selection: MarkdownTextInputProps['selection'],
    payload: MarkdownTextInputCommandPayload,
): MarkdownCommandResult => {
    switch (payload.command) {
        case 'bold':
        case 'italic':
        case 'underline':
        case 'strikethrough':
        case 'inline-code':
            return applyInlineFormat(value, selection, payload.command);
        case 'heading-one':
        case 'heading-two':
        case 'heading-three':
        case 'blockquote':
        case 'bullet-list':
        case 'ordered-list':
        case 'code-block':
            return applyBlockFormat(value, selection, payload.command);
        case 'link':
            return applyLinkFormat(value, selection, payload.link);
        case 'table':
            return applyTableFormat(value, selection, payload.table);
        default: {
            const exhaustiveCheck: never = payload.command;
            throw new Error(
                `Unsupported markdown command: ${String(exhaustiveCheck)}`,
            );
        }
    }
};

const MarkdownTextInput = React.forwardRef<TextInput, MarkdownTextInputProps>(
    function MarkdownTextInput(
        {
            onChangeText,
            onCommand,
            onSelectionChange,
            inputComponent: InputComponent,
            selection,
            style,
            toolbarItems = DEFAULT_TOOLBAR_ITEMS,
            compactMaxHeight,
            enableShortcuts = true,
            multiline = true,
            numberOfLines,
            resolveCommandPayload,
            value,
            ...textInputProps
        },
        ref,
    ) {
        const [internalSelection, setInternalSelection] = useState(() =>
            normalizeSelection(value, selection),
        );
        const [contentHeight, setContentHeight] = useState<number | null>(null);
        const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
        const pendingSelectionValueRef = useRef<string | null>(null);

        const normalizedSelection = useMemo(
            () => normalizeSelection(value, selection ?? internalSelection),
            [internalSelection, selection, value],
        );

        const handleSelectionChange = (
            event: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
        ): void => {
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

        const handleCommandPress = async (
            command: MarkdownCommand,
        ): Promise<void> => {
            setOpenMenuIndex(null);

            const resolvedPayload = await resolveCommandPayload?.(command);

            if (resolvedPayload === null) {
                return;
            }

            const payload = resolvedPayload ?? {command};

            const result = executeCommand(value, normalizedSelection, payload);

            if (!selection) {
                pendingSelectionValueRef.current = result.value;
                setInternalSelection(result.selection);
            }

            onChangeText(result.value);
            onCommand?.(payload, result);
        };

        const handleToolbarButtonPress = async (
            item: MarkdownToolbarButtonItem,
        ): Promise<void> => {
            if (isToolbarCommandItem(item)) {
                await handleCommandPress(item.command);
                return;
            }

            setOpenMenuIndex(null);

            const result = applyToolbarAction(
                value,
                normalizedSelection,
                item.action,
            );

            if (!selection) {
                pendingSelectionValueRef.current = result.value;
                setInternalSelection(result.selection);
            }

            onChangeText(result.value);
        };

        const handleContentSizeChange = (
            event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
        ): void => {
            setContentHeight(event.nativeEvent.contentSize.height);
            textInputProps.onContentSizeChange?.(event);
        };

        const computedInputStyle = useMemo(
            () => [
                styles.input,
                compactMaxHeight !== undefined && contentHeight !== null
                    ? {
                        height: Math.min(Math.max(contentHeight, 44), compactMaxHeight),
                        maxHeight: compactMaxHeight,
                    }
                    : null,
                style,
            ],
            [compactMaxHeight, contentHeight, style],
        );

        const handleChangeText = (nextValue: string): void => {
            if (enableShortcuts) {
                const shortcutResult = applyMarkdownShortcut({
                    nextValue,
                    previousSelection: normalizedSelection,
                    previousValue: value,
                });

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

        const inputProps: MarkdownManagedTextInputProps = {
            ...textInputProps,
            multiline,
            numberOfLines,
            onChangeText: handleChangeText,
            onContentSizeChange: handleContentSizeChange,
            onSelectionChange: handleSelectionChange,
            selection: normalizedSelection,
            style: computedInputStyle,
            value,
        };

        return (
            <View style={styles.container}>
                {toolbarItems.length > 0 ? (
                    <View style={styles.toolbar}>
                        {toolbarItems.map((item, index) => {
                            if (isToolbarMenuItem(item)) {
                                const isMenuOpen = openMenuIndex === index;

                                return (
                                    <View
                                        key={`menu:${index}`}
                                        style={styles.toolbarMenuContainer}
                                    >
                                        <Pressable
                                            accessibilityLabel={getToolbarMenuAccessibilityLabel(
                                                item,
                                            )}
                                            accessibilityRole="button"
                                            accessibilityState={{expanded: isMenuOpen}}
                                            onPress={() =>
                                                setOpenMenuIndex((currentIndex) =>
                                                    currentIndex === index
                                                        ? null
                                                        : index,
                                                )
                                            }
                                            style={[
                                                styles.toolbarButton,
                                                isMenuOpen
                                                    ? styles.toolbarButtonActive
                                                    : null,
                                            ]}
                                        >
                                            {renderToolbarLabel(item.label)}
                                        </Pressable>
                                        {isMenuOpen ? (
                                            <View style={styles.toolbarMenu}>
                                                {item.items.map((menuItem, menuItemIndex) => (
                                                    <Pressable
                                                        accessibilityLabel={getToolbarButtonAccessibilityLabel(
                                                            menuItem,
                                                        )}
                                                        accessibilityRole="button"
                                                        key={getToolbarButtonKey(
                                                            menuItem,
                                                            menuItemIndex,
                                                        )}
                                                        onPress={() => {
                                                            handleToolbarButtonPress(menuItem);
                                                        }}
                                                        style={styles.toolbarMenuButton}
                                                    >
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
                                    accessibilityLabel={getToolbarButtonAccessibilityLabel(
                                        item,
                                    )}
                                    accessibilityRole="button"
                                    key={getToolbarButtonKey(item, index)}
                                    onPress={() => {
                                        handleToolbarButtonPress(item);
                                    }}
                                    style={styles.toolbarButton}
                                >
                                    {renderToolbarLabel(item.label)}
                                </Pressable>
                            );
                        })}
                    </View>
                ) : null}
                {InputComponent ? (
                    <InputComponent {...inputProps} ref={ref}/>
                ) : (
                    <TextInput {...inputProps} ref={ref}/>
                )}
            </View>
        );
    },
);

MarkdownTextInput.displayName = 'MarkdownTextInput';

export default MarkdownTextInput;

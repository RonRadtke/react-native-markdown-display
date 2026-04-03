import React, {useMemo, useRef, useState} from 'react';
import {type NativeSyntheticEvent, Pressable, StyleSheet, Text, TextInput, type TextInputContentSizeChangeEventData, type TextInputSelectionChangeEventData, View,} from 'react-native';

import {applyBlockFormat, applyInlineFormat, applyLinkFormat, applyTableFormat,} from './commands/formatMarkdown';
import {applyMarkdownShortcut} from './utils/shortcuts';
import {normalizeSelection} from './utils/selection';

import type {MarkdownCommand, MarkdownCommandResult, MarkdownManagedTextInputProps, MarkdownTextInputCommandPayload, MarkdownTextInputProps, MarkdownToolbarCommandItem, MarkdownToolbarItem, MarkdownToolbarMenuItem,} from './types';

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

const executeCommand = (
    value: string,
    selection: MarkdownTextInputProps['selection'],
    payload: MarkdownTextInputCommandPayload,
): MarkdownCommandResult => {
    switch (payload.command) {
        case 'bold':
        case 'italic':
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
        const [openMenuLabel, setOpenMenuLabel] = useState<string | null>(null);
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
            setOpenMenuLabel(null);

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
                        {toolbarItems.map((item) => {
                            if (isToolbarMenuItem(item)) {
                                const isMenuOpen = openMenuLabel === item.label;

                                return (
                                    <View
                                        key={`menu:${item.label}`}
                                        style={styles.toolbarMenuContainer}
                                    >
                                        <Pressable
                                            accessibilityLabel={
                                                item.accessibilityLabel ??
                                                `${item.label} menu`
                                            }
                                            accessibilityRole="button"
                                            accessibilityState={{expanded: isMenuOpen}}
                                            onPress={() =>
                                                setOpenMenuLabel((currentLabel) =>
                                                    currentLabel === item.label
                                                        ? null
                                                        : item.label,
                                                )
                                            }
                                            style={[
                                                styles.toolbarButton,
                                                isMenuOpen
                                                    ? styles.toolbarButtonActive
                                                    : null,
                                            ]}
                                        >
                                            <Text style={styles.toolbarButtonText}>
                                                {item.label}
                                            </Text>
                                        </Pressable>
                                        {isMenuOpen ? (
                                            <View style={styles.toolbarMenu}>
                                                {item.items.map((menuItem) => (
                                                    <Pressable
                                                        accessibilityLabel={
                                                            menuItem.accessibilityLabel ??
                                                            DEFAULT_TOOLBAR_ACCESSIBILITY_LABELS[
                                                            menuItem.command
                                                            ]
                                                        }
                                                        accessibilityRole="button"
                                                        key={menuItem.command}
                                                        onPress={() => {
                                                            handleCommandPress(
                                                                menuItem.command,
                                                            );
                                                        }}
                                                        style={styles.toolbarMenuButton}
                                                    >
                                                        <Text
                                                            style={
                                                                styles.toolbarButtonText
                                                            }
                                                        >
                                                            {menuItem.label}
                                                        </Text>
                                                    </Pressable>
                                                ))}
                                            </View>
                                        ) : null}
                                    </View>
                                );
                            }

                            return (
                                <Pressable
                                    accessibilityLabel={
                                        item.accessibilityLabel ??
                                        DEFAULT_TOOLBAR_ACCESSIBILITY_LABELS[item.command]
                                    }
                                    accessibilityRole="button"
                                    key={item.command}
                                    onPress={() => {
                                        handleCommandPress(item.command);
                                    }}
                                    style={styles.toolbarButton}
                                >
                                    <Text style={styles.toolbarButtonText}>{item.label}</Text>
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

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    input: {
        borderColor: '#C7CCD1',
        borderRadius: 8,
        borderWidth: 1,
        minHeight: 44,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    toolbar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    toolbarButton: {
        borderColor: '#C7CCD1',
        borderRadius: 6,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    toolbarButtonActive: {
        backgroundColor: '#EFF4F8',
        borderColor: '#0A66C2',
    },
    toolbarButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    toolbarMenu: {
        backgroundColor: '#FFFFFF',
        borderColor: '#C7CCD1',
        borderRadius: 8,
        borderWidth: 1,
        elevation: 3,
        gap: 6,
        left: 0,
        minWidth: 64,
        padding: 6,
        position: 'absolute',
        top: 38,
        zIndex: 1,
    },
    toolbarMenuButton: {
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    toolbarMenuContainer: {
        position: 'relative',
    },
});

MarkdownTextInput.displayName = 'MarkdownTextInput';

export default MarkdownTextInput;

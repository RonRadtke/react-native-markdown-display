import React, {useMemo, useRef, useState} from 'react';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {Pressable, type StyleProp, Text, TextInput, type TextStyle, View} from 'react-native';

import {DEFAULT_COMPACT_TOOLBAR_ITEMS, DEFAULT_EXPANDED_TOOLBAR_ITEMS} from '../defaultToolbarItems';
import MarkdownPreview from '../MarkdownPreview';
import MarkdownTextInput from '../MarkdownTextInput';
import styles from './style';

import type {MarkdownComposerMode, MarkdownComposerProps, MarkdownTextInputCommandPayload,} from '../types';

const DEFAULT_COMPACT_MAX_HEIGHT = 110;
const DEFAULT_LINK_URL = 'https://';
const MAX_TABLE_COLUMNS = 10;
const MAX_TABLE_ROWS = 20;
const DEFAULT_CONTROL_ICON_SIZE = 18;
type ComposerIconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const createComposerControlIcon = (
    name: ComposerIconName,
    color: string,
): React.ReactElement => (
    <MaterialDesignIcons
        accessible={false}
        color={color}
        name={name}
        size={DEFAULT_CONTROL_ICON_SIZE}
    />
);

const DEFAULT_PREVIEW_TOGGLE_LABELS = {
    hide: createComposerControlIcon('eye-off', '#2F5E8D'),
    show: createComposerControlIcon('eye', '#2F5E8D'),
} as const;
const DEFAULT_EXPAND_BUTTON_LABELS = {
    compact: createComposerControlIcon('arrow-expand', '#FFFFFF'),
    expanded: createComposerControlIcon('arrow-collapse', '#FFFFFF'),
} as const;

interface LinkPromptState {
    command: 'link';
    title: string;
    url: string;
}

interface TablePromptState {
    columns: string;
    command: 'table';
    rows: string;
}

type ComposerPromptState = LinkPromptState | TablePromptState | null;
type PromptResolver = (payload: MarkdownTextInputCommandPayload | null) => void;

const normalizeUrl = (value: string): string => {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
        return DEFAULT_LINK_URL;
    }

    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmedValue)) {
        return trimmedValue;
    }

    if (/^mailto:/i.test(trimmedValue) || /^tel:/i.test(trimmedValue)) {
        return trimmedValue;
    }

    return `https://${trimmedValue.replace(/^\/+/, '')}`;
};

const parsePositiveInteger = (value: string): number | null => {
    const parsedValue = Number.parseInt(value, 10);

    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

const renderControlLabel = (
    label: React.ReactNode,
    textStyle: StyleProp<TextStyle>,
): React.ReactNode =>
    typeof label === 'string' || typeof label === 'number' ? (
        <Text style={textStyle}>{label}</Text>
    ) : (
        <View style={styles.controlContent}>{label}</View>
    );

const getDefaultCommandPayload = (
    command: MarkdownTextInputCommandPayload['command'],
): MarkdownTextInputCommandPayload => {
    if (command === 'table') {
        return {
            command,
            table: {
                columns: 3,
                rows: 2,
            },
        };
    }

    if (command === 'link') {
        return {
            command,
            link: {
                url: DEFAULT_LINK_URL,
            },
        };
    }

    return {command};
};

const MarkdownComposer = React.forwardRef<TextInput, MarkdownComposerProps>(
    function MarkdownComposer(
        {
            compactToolbarItems,
            composerStyle,
            expandedToolbarItems = DEFAULT_EXPANDED_TOOLBAR_ITEMS,
            initialMode = 'compact',
            minimizedToolbarItems,
            onModeChange,
            previewEnabled = false,
            previewEmptyState,
            previewLabel,
            previewProps,
            previewToggleLabels = DEFAULT_PREVIEW_TOGGLE_LABELS,
            resolveCommandPayload,
            renderExpandButtonLabel,
            style,
            textInputStyle,
            value,
            ...textInputProps
        },
        ref,
    ) {
        const [mode, setMode] = useState<MarkdownComposerMode>(initialMode);
        const [promptState, setPromptState] = useState<ComposerPromptState>(null);
        const [isPreviewVisible, setIsPreviewVisible] = useState(false);
        const promptResolverRef = useRef<PromptResolver | null>(null);
        const resolvedCompactToolbarItems =
            minimizedToolbarItems ??
            compactToolbarItems ??
            DEFAULT_COMPACT_TOOLBAR_ITEMS;

        const promptError = useMemo(() => {
            if (!promptState) {
                return null;
            }

            if (promptState.command === 'link') {
                const url = promptState.url.trim();

                if (url.length === 0) {
                    return null;
                }

                if (/\s/.test(url)) {
                    return 'URLs cannot contain spaces.';
                }

                return null;
            }

            const parsedColumns = parsePositiveInteger(promptState.columns);
            const parsedRows = parsePositiveInteger(promptState.rows);

            if (parsedColumns === null || parsedRows === null) {
                return 'Columns and rows must be positive numbers.';
            }

            if (parsedColumns > MAX_TABLE_COLUMNS || parsedRows > MAX_TABLE_ROWS) {
                return `Tables are limited to ${MAX_TABLE_COLUMNS} columns and ${MAX_TABLE_ROWS} rows.`;
            }

            return null;
        }, [promptState]);

        const toolbarItems = useMemo(
            () =>
                mode === 'compact'
                    ? resolvedCompactToolbarItems
                    : expandedToolbarItems,
            [expandedToolbarItems, mode, resolvedCompactToolbarItems],
        );

        const handleResolveCommandPayload = async (
            command: MarkdownTextInputCommandPayload['command'],
        ): Promise<MarkdownTextInputCommandPayload | null> => {
            const resolvedPayload = await resolveCommandPayload?.(command);

            if (resolvedPayload === null) {
                return null;
            }

            if (resolvedPayload) {
                return resolvedPayload;
            }

            if (command === 'link') {
                return new Promise<MarkdownTextInputCommandPayload | null>(
                    (resolve) => {
                        promptResolverRef.current = resolve;
                        setPromptState({
                            command,
                            title: '',
                            url: DEFAULT_LINK_URL,
                        });
                    },
                );
            }

            if (command === 'table') {
                return new Promise<MarkdownTextInputCommandPayload | null>(
                    (resolve) => {
                        promptResolverRef.current = resolve;
                        setPromptState({
                            command,
                            columns: '3',
                            rows: '2',
                        });
                    },
                );
            }

            return getDefaultCommandPayload(command);
        };

        const closePrompt = (): void => {
            setPromptState(null);
            promptResolverRef.current = null;
        };

        const handleCancelPrompt = (): void => {
            promptResolverRef.current?.(null);
            closePrompt();
        };

        const handleApplyPrompt = (): void => {
            if (!promptState || promptError) {
                return;
            }

            if (promptState.command === 'link') {
                promptResolverRef.current?.({
                    command: 'link',
                    link: {
                        ...(promptState.title.trim().length > 0
                            ? {title: promptState.title.trim()}
                            : {}),
                        url: normalizeUrl(promptState.url),
                    },
                });
                closePrompt();
                return;
            }

            const columns = Number.parseInt(promptState.columns, 10);
            const rows = Number.parseInt(promptState.rows, 10);

            promptResolverRef.current?.({
                command: 'table',
                table: {
                    columns:
                        Number.isFinite(columns) && columns > 0
                            ? clamp(columns, 1, MAX_TABLE_COLUMNS)
                            : 3,
                    rows:
                        Number.isFinite(rows) && rows > 0
                            ? clamp(rows, 1, MAX_TABLE_ROWS)
                            : 2,
                },
            });
            closePrompt();
        };

        const toggleMode = (): void => {
            const nextMode: MarkdownComposerMode =
                mode === 'compact' ? 'expanded' : 'compact';

            setMode(nextMode);
            onModeChange?.(nextMode);
        };

        return (
            <View style={[styles.container, composerStyle]}>
                <MarkdownTextInput
                    {...textInputProps}
                    enableShortcuts
                    multiline
                    numberOfLines={mode === 'expanded' ? 8 : 1}
                    ref={ref}
                    resolveCommandPayload={handleResolveCommandPayload}
                    style={[styles.textInput, style, textInputStyle]}
                    toolbarItems={toolbarItems}
                    value={value}
                    {...(mode === 'compact'
                        ? {compactMaxHeight: DEFAULT_COMPACT_MAX_HEIGHT}
                        : {})}
                />
                {promptState ? (
                    <View style={styles.promptCard}>
                        <Text style={styles.promptTitle}>
                            {promptState.command === 'link' ? 'Insert link' : 'Insert table'}
                        </Text>
                        {promptState.command === 'link' ? (
                            <>
                                <TextInput
                                    accessibilityLabel="Link text"
                                    onChangeText={(title) =>
                                        setPromptState((currentState) =>
                                            currentState?.command === 'link'
                                                ? {...currentState, title}
                                                : currentState,
                                        )
                                    }
                                    placeholder="Link text"
                                    style={styles.promptInput}
                                    value={promptState.title}
                                />
                                <TextInput
                                    accessibilityLabel="Link URL"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="url"
                                    onChangeText={(url) =>
                                        setPromptState((currentState) =>
                                            currentState?.command === 'link'
                                                ? {...currentState, url}
                                                : currentState,
                                        )
                                    }
                                    placeholder="https://example.com"
                                    style={styles.promptInput}
                                    value={promptState.url}
                                />
                            </>
                        ) : (
                            <>
                                <TextInput
                                    accessibilityLabel="Table columns"
                                    keyboardType="number-pad"
                                    onChangeText={(columns) =>
                                        setPromptState((currentState) =>
                                            currentState?.command === 'table'
                                                ? {...currentState, columns}
                                                : currentState,
                                        )
                                    }
                                    placeholder="Columns"
                                    style={styles.promptInput}
                                    value={promptState.columns}
                                />
                                <TextInput
                                    accessibilityLabel="Table rows"
                                    keyboardType="number-pad"
                                    onChangeText={(rows) =>
                                        setPromptState((currentState) =>
                                            currentState?.command === 'table'
                                                ? {...currentState, rows}
                                                : currentState,
                                        )
                                    }
                                    placeholder="Rows"
                                    style={styles.promptInput}
                                    value={promptState.rows}
                                />
                            </>
                        )}
                        {promptError ? (
                            <Text style={styles.promptError}>{promptError}</Text>
                        ) : null}
                        <View style={styles.promptActions}>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityState={{disabled: false}}
                                onPress={handleCancelPrompt}
                                style={[styles.promptButton, styles.promptButtonSecondary]}
                            >
                                <Text style={styles.promptButtonSecondaryText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityState={{disabled: promptError !== null}}
                                onPress={handleApplyPrompt}
                                disabled={promptError !== null}
                                style={[styles.promptButton, styles.promptButtonPrimary]}
                            >
                                <Text style={styles.promptButtonPrimaryText}>Apply</Text>
                            </Pressable>
                        </View>
                    </View>
                ) : null}
                <View style={styles.footer}>
                    {previewEnabled ? (
                        <Pressable
                            accessibilityLabel={
                                isPreviewVisible ? 'Hide preview' : 'Show preview'
                            }
                            accessibilityRole="button"
                            accessibilityState={{expanded: isPreviewVisible}}
                            onPress={() =>
                                setIsPreviewVisible((currentValue) => !currentValue)
                            }
                            style={styles.previewToggle}
                        >
                            {renderControlLabel(
                                isPreviewVisible
                                    ? previewToggleLabels.hide
                                    : previewToggleLabels.show,
                                styles.previewToggleText,
                            )}
                        </Pressable>
                    ) : null}
                    <Pressable
                        accessibilityLabel={
                            mode === 'compact'
                                ? 'Expand composer'
                                : 'Collapse composer'
                        }
                        accessibilityRole="button"
                        accessibilityState={{expanded: mode === 'expanded'}}
                        onPress={toggleMode}
                        style={styles.expandButton}
                    >
                        {renderControlLabel(
                            renderExpandButtonLabel?.(mode) ??
                                DEFAULT_EXPAND_BUTTON_LABELS[mode],
                            styles.expandButtonText,
                        )}
                    </Pressable>
                </View>
                {previewEnabled && isPreviewVisible ? (
                    <MarkdownPreview
                        {...previewProps}
                        {...(previewEmptyState ? {emptyState: previewEmptyState} : {})}
                        {...(previewLabel ? {label: previewLabel} : {})}
                        previewContainerStyle={[
                            styles.preview,
                            previewProps?.previewContainerStyle,
                        ]}
                        value={value}
                    />
                ) : null}
            </View>
        );
    },
);

MarkdownComposer.displayName = 'MarkdownComposer';

export default MarkdownComposer;

import React, {useMemo, useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';

import MarkdownPreview from './MarkdownPreview';
import MarkdownTextInput from './MarkdownTextInput';

import type {MarkdownComposerMode, MarkdownComposerProps, MarkdownTextInputCommandPayload,} from './types';

const DEFAULT_COMPACT_TOOLBAR = [
    {accessibilityLabel: 'Bold', command: 'bold', label: 'B'},
    {accessibilityLabel: 'Italic', command: 'italic', label: 'I'},
    {accessibilityLabel: 'Insert link', command: 'link', label: 'Link'},
] as const;

const DEFAULT_EXPANDED_TOOLBAR = [
    ...DEFAULT_COMPACT_TOOLBAR,
    {accessibilityLabel: 'Strikethrough', command: 'strikethrough', label: 'S'},
    {accessibilityLabel: 'Heading two', command: 'heading-two', label: 'H2'},
    {accessibilityLabel: 'Bullet list', command: 'bullet-list', label: 'List'},
    {accessibilityLabel: 'Numbered list', command: 'ordered-list', label: '1.'},
    {accessibilityLabel: 'Code block', command: 'code-block', label: 'Code'},
    {accessibilityLabel: 'Insert table', command: 'table', label: 'Table'},
] as const;

const DEFAULT_COMPACT_MAX_HEIGHT = 110;
const DEFAULT_LINK_URL = 'https://';
const MAX_TABLE_COLUMNS = 10;
const MAX_TABLE_ROWS = 20;
const DEFAULT_PREVIEW_TOGGLE_LABELS = {
    hide: 'Hide preview',
    show: 'Show preview',
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
            compactToolbarItems = DEFAULT_COMPACT_TOOLBAR,
            composerStyle,
            expandedToolbarItems = DEFAULT_EXPANDED_TOOLBAR,
            initialMode = 'compact',
            onModeChange,
            previewEnabled = false,
            previewEmptyState,
            previewLabel,
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
        const [isPreviewVisible, setIsPreviewVisible] = useState(previewEnabled);
        const promptResolverRef = useRef<PromptResolver | null>(null);

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
            () => (mode === 'compact' ? compactToolbarItems : expandedToolbarItems),
            [compactToolbarItems, expandedToolbarItems, mode],
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
                    {previewEnabled && mode === 'expanded' ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityState={{expanded: isPreviewVisible}}
                            onPress={() =>
                                setIsPreviewVisible((currentValue) => !currentValue)
                            }
                            style={styles.previewToggle}
                        >
                            <Text style={styles.previewToggleText}>
                                {isPreviewVisible
                                    ? previewToggleLabels.hide
                                    : previewToggleLabels.show}
                            </Text>
                        </Pressable>
                    ) : null}
                    <Pressable
                        accessibilityRole="button"
                        accessibilityState={{expanded: mode === 'expanded'}}
                        onPress={toggleMode}
                        style={styles.expandButton}
                    >
                        <Text style={styles.expandButtonText}>
                            {renderExpandButtonLabel?.(mode) ??
                                (mode === 'compact' ? 'Expand' : 'Collapse')}
                        </Text>
                    </Pressable>
                </View>
                {previewEnabled && mode === 'expanded' && isPreviewVisible ? (
                    <MarkdownPreview
                        {...(previewEmptyState ? {emptyState: previewEmptyState} : {})}
                        {...(previewLabel ? {label: previewLabel} : {})}
                        value={value}
                    />
                ) : null}
            </View>
        );
    },
);

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    expandButton: {
        alignSelf: 'flex-end',
        paddingVertical: 8,
    },
    expandButtonText: {
        color: '#0A66C2',
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        width: '100%',
    },
    previewToggle: {
        paddingVertical: 8,
    },
    previewToggleText: {
        color: '#5D6B79',
        fontSize: 14,
        fontWeight: '600',
    },
    promptError: {
        color: '#B42318',
        marginTop: 8,
    },
    promptActions: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'flex-end',
        marginTop: 12,
    },
    promptButton: {
        borderRadius: 6,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    promptButtonPrimary: {
        backgroundColor: '#0A66C2',
        borderColor: '#0A66C2',
    },
    promptButtonPrimaryText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    promptButtonSecondary: {
        borderColor: '#C7CCD1',
    },
    promptButtonSecondaryText: {
        color: '#2B3137',
        fontWeight: '600',
    },
    promptCard: {
        backgroundColor: '#F8FAFC',
        borderColor: '#D8E0E8',
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 12,
        padding: 12,
    },
    promptInput: {
        backgroundColor: '#FFFFFF',
        borderColor: '#C7CCD1',
        borderRadius: 6,
        borderWidth: 1,
        marginTop: 8,
        minHeight: 40,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    promptTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    textInput: {
        width: '100%',
    },
});

MarkdownComposer.displayName = 'MarkdownComposer';

export default MarkdownComposer;

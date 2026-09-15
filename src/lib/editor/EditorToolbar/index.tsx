import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';

import styles from './style';

import type {
    MarkdownCommand,
    MarkdownToolbarAction,
    MarkdownToolbarButtonItem,
    MarkdownToolbarCommandItem,
    MarkdownToolbarItem,
    MarkdownToolbarMenuItem,
} from '../types';

const DEFAULT_TOOLBAR_ACCESSIBILITY_LABELS: Record<MarkdownCommand, string> = {
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

const renderToolbarLabel = (
    label: MarkdownToolbarItem['label'],
): React.ReactNode =>
    typeof label === 'string' || typeof label === 'number' ? (
        <Text style={styles.toolbarButtonText}>{label}</Text>
    ) : (
        <View style={styles.toolbarButtonContent}>{label}</View>
    );

export interface EditorToolbarProps {
    /** Inline commands currently active at the selection, highlighted as toggled on. */
    activeCommands?: ReadonlySet<MarkdownCommand> | undefined;
    disabled?: boolean;
    items: readonly MarkdownToolbarItem[];
    onAction: (action: MarkdownToolbarAction) => void;
    onCommand: (command: MarkdownCommand) => void;
}

/**
 * Shared toolbar used by the markdown editor. Renders command buttons, custom
 * insert/wrap actions, and grouped dropdown menus.
 */
function EditorToolbar({
    activeCommands,
    disabled = false,
    items,
    onAction,
    onCommand,
}: EditorToolbarProps): React.JSX.Element | null {
    const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

    if (items.length === 0) {
        return null;
    }

    const handleButtonPress = (item: MarkdownToolbarButtonItem): void => {
        if (disabled) {
            return;
        }

        setOpenMenuIndex(null);

        if (isToolbarCommandItem(item)) {
            onCommand(item.command);
            return;
        }

        onAction(item.action);
    };

    const isCommandActive = (item: MarkdownToolbarButtonItem): boolean =>
        isToolbarCommandItem(item) &&
        activeCommands !== undefined &&
        activeCommands.has(item.command);

    return (
        <View style={styles.toolbar}>
            {items.map((item, index) => {
                if (isToolbarMenuItem(item)) {
                    const isMenuOpen = openMenuIndex === index;

                    return (
                        <View
                            key={`menu:${index}`}
                            style={styles.toolbarMenuContainer}
                        >
                            <Pressable
                                accessibilityLabel={getToolbarMenuAccessibilityLabel(item)}
                                accessibilityRole="button"
                                accessibilityState={{disabled, expanded: isMenuOpen}}
                                disabled={disabled}
                                onPress={() =>
                                    setOpenMenuIndex((currentIndex) =>
                                        currentIndex === index ? null : index,
                                    )
                                }
                                style={[
                                    styles.toolbarButton,
                                    isMenuOpen ? styles.toolbarButtonActive : null,
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
                                            accessibilityState={{disabled}}
                                            disabled={disabled}
                                            key={getToolbarButtonKey(menuItem, menuItemIndex)}
                                            onPress={() => handleButtonPress(menuItem)}
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
                        accessibilityLabel={getToolbarButtonAccessibilityLabel(item)}
                        accessibilityRole="button"
                        accessibilityState={{disabled, selected: isCommandActive(item)}}
                        disabled={disabled}
                        key={getToolbarButtonKey(item, index)}
                        onPress={() => handleButtonPress(item)}
                        style={[
                            styles.toolbarButton,
                            isCommandActive(item) ? styles.toolbarButtonActive : null,
                        ]}
                    >
                        {renderToolbarLabel(item.label)}
                    </Pressable>
                );
            })}
        </View>
    );
}

export default EditorToolbar;

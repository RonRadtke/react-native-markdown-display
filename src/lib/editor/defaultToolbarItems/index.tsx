import React from 'react';
import {MaterialIcons} from '@react-native-vector-icons/material-icons';

import type {MarkdownToolbarCommandItem} from '../types';

const DEFAULT_TOOLBAR_ICON_SIZE = 18;
type ToolbarIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const createToolbarIcon = (name: ToolbarIconName): React.ReactElement => (
    <MaterialIcons
        accessible={false}
        name={name}
        size={DEFAULT_TOOLBAR_ICON_SIZE}
    />
);

export const DEFAULT_TEXT_INPUT_TOOLBAR_ITEMS: readonly MarkdownToolbarCommandItem[] = [
    {
        accessibilityLabel: 'Bold',
        command: 'bold',
        label: createToolbarIcon('format-bold'),
    },
    {
        accessibilityLabel: 'Italic',
        command: 'italic',
        label: createToolbarIcon('format-italic'),
    },
    {
        accessibilityLabel: 'Inline code',
        command: 'inline-code',
        label: createToolbarIcon('code'),
    },
];

export const DEFAULT_COMPACT_TOOLBAR_ITEMS: readonly MarkdownToolbarCommandItem[] = [
    ...DEFAULT_TEXT_INPUT_TOOLBAR_ITEMS,
    {
        accessibilityLabel: 'Insert link',
        command: 'link',
        label: createToolbarIcon('add-link'),
    },
];

export const DEFAULT_HEADING_TOOLBAR_ITEMS: readonly MarkdownToolbarCommandItem[] = [
    {
        accessibilityLabel: 'Heading one',
        command: 'heading-one',
        label: createToolbarIcon('looks-one'),
    },
    {
        accessibilityLabel: 'Heading two',
        command: 'heading-two',
        label: createToolbarIcon('looks-two'),
    },
    {
        accessibilityLabel: 'Heading three',
        command: 'heading-three',
        label: createToolbarIcon('looks-3'),
    },
];

export const DEFAULT_EXPANDED_TOOLBAR_ITEMS = [
    ...DEFAULT_COMPACT_TOOLBAR_ITEMS,
    {
        accessibilityLabel: 'Strikethrough',
        command: 'strikethrough',
        label: createToolbarIcon('format-strikethrough'),
    },
    {
        accessibilityLabel: 'Insert heading',
        items: DEFAULT_HEADING_TOOLBAR_ITEMS,
        label: createToolbarIcon('title'),
    },
    {
        accessibilityLabel: 'Quote',
        command: 'blockquote',
        label: createToolbarIcon('format-quote'),
    },
    {
        accessibilityLabel: 'Bullet list',
        command: 'bullet-list',
        label: createToolbarIcon('format-list-bulleted'),
    },
    {
        accessibilityLabel: 'Numbered list',
        command: 'ordered-list',
        label: createToolbarIcon('format-list-numbered'),
    },
    {
        accessibilityLabel: 'Code block',
        command: 'code-block',
        label: createToolbarIcon('data-object'),
    },
    {
        accessibilityLabel: 'Insert table',
        command: 'table',
        label: createToolbarIcon('table-chart'),
    },
] as const;

export const createDefaultToolbarIcon = createToolbarIcon;

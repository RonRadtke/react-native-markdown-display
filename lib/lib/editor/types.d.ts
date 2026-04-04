import type { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react';
import type { NativeSyntheticEvent, StyleProp, TextInput, TextInputProps, TextInputSelectionChangeEventData, TextStyle, ViewStyle } from 'react-native';
import type AstRenderer from '../view/AstRenderer';
import type { MarkdownParser, MarkdownStyleMap, OnLinkPress, RenderRules, TextComponent } from '../view/types';
export interface MarkdownSelection {
    start: number;
    end: number;
}
export interface MarkdownCommandResult {
    selection: MarkdownSelection;
    value: string;
}
export interface MarkdownManagedTextInputProps extends Omit<TextInputProps, 'onChangeText' | 'onSelectionChange' | 'selection' | 'value'> {
    onChangeText: (value: string) => void;
    onSelectionChange?: (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => void;
    selection: MarkdownSelection;
    value: string;
}
export type MarkdownInputComponent = ForwardRefExoticComponent<MarkdownManagedTextInputProps & RefAttributes<TextInput>>;
export type MarkdownInlineFormat = 'bold' | 'italic' | 'strikethrough' | 'inline-code';
export type MarkdownBlockFormat = 'heading-one' | 'heading-two' | 'heading-three' | 'blockquote' | 'bullet-list' | 'ordered-list' | 'code-block';
export type MarkdownCommand = MarkdownInlineFormat | MarkdownBlockFormat | 'link' | 'table';
export interface MarkdownLinkPayload {
    title?: string;
    url?: string;
}
export interface MarkdownTablePayload {
    columns?: number;
    rows?: number;
}
export interface MarkdownTextInputCommandPayload {
    command: MarkdownCommand;
    link?: MarkdownLinkPayload;
    table?: MarkdownTablePayload;
}
export type MarkdownCommandPayloadResolver = (command: MarkdownCommand) => MarkdownTextInputCommandPayload | Promise<MarkdownTextInputCommandPayload | null> | null;
interface MarkdownToolbarBaseItem {
    accessibilityLabel?: string;
    label: ReactNode;
}
export interface MarkdownToolbarCommandItem extends MarkdownToolbarBaseItem {
    command: MarkdownCommand;
}
export interface MarkdownToolbarMenuItem extends MarkdownToolbarBaseItem {
    items: readonly MarkdownToolbarCommandItem[];
}
export type MarkdownToolbarItem = MarkdownToolbarCommandItem | MarkdownToolbarMenuItem;
export interface MarkdownRenderOptions {
    allowedImageHandlers?: string[];
    debugPrintTree?: boolean;
    defaultImageHandler?: string | null;
    markdownit?: MarkdownParser;
    maxTopLevelChildren?: number | null;
    mergeStyle?: boolean;
    onLinkPress?: OnLinkPress;
    renderer?: AstRenderer | null;
    rules?: RenderRules | null;
    style?: MarkdownStyleMap | null;
    textcomponent?: TextComponent;
    topLevelMaxExceededItem?: ReactNode;
}
export interface MarkdownTextInputProps extends Omit<TextInputProps, 'onChangeText' | 'onSelectionChange' | 'value'> {
    compactMaxHeight?: number;
    enableShortcuts?: boolean;
    inputComponent?: MarkdownInputComponent;
    onChangeText: (value: string) => void;
    onCommand?: (payload: MarkdownTextInputCommandPayload, result: MarkdownCommandResult) => void;
    onSelectionChange?: (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => void;
    resolveCommandPayload?: MarkdownCommandPayloadResolver;
    selection?: MarkdownSelection;
    toolbarItems?: readonly MarkdownToolbarItem[];
    value: string;
}
export type MarkdownComposerMode = 'compact' | 'expanded';
export interface MarkdownComposerProps extends Omit<MarkdownTextInputProps, 'multiline' | 'numberOfLines' | 'toolbarItems'> {
    compactToolbarItems?: readonly MarkdownToolbarItem[];
    composerStyle?: StyleProp<ViewStyle>;
    expandedToolbarItems?: readonly MarkdownToolbarItem[];
    initialMode?: MarkdownComposerMode;
    minimizedToolbarItems?: readonly MarkdownToolbarItem[];
    onModeChange?: (mode: MarkdownComposerMode) => void;
    previewEnabled?: boolean;
    previewEmptyState?: string;
    previewLabel?: ReactNode;
    previewProps?: Omit<MarkdownPreviewProps, 'value'>;
    previewToggleLabels?: {
        hide: ReactNode;
        show: ReactNode;
    };
    renderExpandButtonLabel?: (mode: MarkdownComposerMode) => ReactNode;
    textInputStyle?: StyleProp<TextStyle>;
}
export interface MarkdownPreviewProps extends MarkdownRenderOptions {
    emptyState?: string;
    label?: ReactNode;
    previewContainerStyle?: StyleProp<ViewStyle>;
    value: string;
}
export {};
//# sourceMappingURL=types.d.ts.map
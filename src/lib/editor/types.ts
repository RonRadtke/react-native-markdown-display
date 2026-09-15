import type {ForwardRefExoticComponent, ReactNode, RefAttributes} from 'react';
import type {NativeSyntheticEvent, StyleProp, TextInput, TextInputProps, TextInputSelectionChangeEventData, TextStyle, ViewStyle,} from 'react-native';
import type AstRenderer from '../view/AstRenderer';
import type {MarkdownParser, MarkdownStyleMap, OnLinkPress, RenderRules, TextComponent,} from '../view/types';

export interface MarkdownSelection {
    start: number;
    end: number;
}

export interface MarkdownCommandResult {
    selection: MarkdownSelection;
    value: string;
}

export interface MarkdownManagedTextInputProps extends Omit<
    TextInputProps,
    'onChangeText' | 'onSelectionChange' | 'selection' | 'value'
> {
    onChangeText: (value: string) => void;
    onSelectionChange?: (
        event: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
    ) => void;
    selection: MarkdownSelection;
    value: string;
}

export type MarkdownInputComponent = ForwardRefExoticComponent<
    MarkdownManagedTextInputProps & RefAttributes<TextInput>
>;

export type MarkdownInlineFormat =
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikethrough'
    | 'inline-code';

export type MarkdownBlockFormat =
    | 'heading-one'
    | 'heading-two'
    | 'heading-three'
    | 'blockquote'
    | 'bullet-list'
    | 'ordered-list'
    | 'code-block';

export type MarkdownCommand =
    | MarkdownInlineFormat
    | MarkdownBlockFormat
    | 'link'
    | 'table';

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

/** Resolved commands use the editor's current value and selection when they finish. */
export type MarkdownCommandPayloadResolver = (
    command: MarkdownCommand,
) =>
    | MarkdownTextInputCommandPayload
    | Promise<MarkdownTextInputCommandPayload | null>
    | null;

interface MarkdownToolbarBaseItem {
    accessibilityLabel?: string;
    label: ReactNode;
}

export interface MarkdownToolbarCommandItem extends MarkdownToolbarBaseItem {
    command: MarkdownCommand;
}

export interface MarkdownToolbarInsertAction {
    markdown: string;
    selectionEndOffset?: number;
    selectionStartOffset?: number;
    type: 'insert';
}

export interface MarkdownToolbarWrapAction {
    placeholder?: string;
    prefix: string;
    suffix?: string;
    type: 'wrap';
}

export type MarkdownToolbarAction =
    | MarkdownToolbarInsertAction
    | MarkdownToolbarWrapAction;

export interface MarkdownToolbarActionItem extends MarkdownToolbarBaseItem {
    action: MarkdownToolbarAction;
}

export type MarkdownToolbarButtonItem =
    | MarkdownToolbarActionItem
    | MarkdownToolbarCommandItem;

export interface MarkdownToolbarMenuItem extends MarkdownToolbarBaseItem {
    items: readonly MarkdownToolbarButtonItem[];
}

export type MarkdownToolbarItem =
    | MarkdownToolbarButtonItem
    | MarkdownToolbarMenuItem;

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

export interface MarkdownTextInputProps extends Omit<
    TextInputProps,
    'onChangeText' | 'onSelectionChange' | 'value'
> {
    compactMaxHeight?: number;
    enableShortcuts?: boolean;
    inputComponent?: MarkdownInputComponent;
    onChangeText: (value: string) => void;
    onCommand?: (
        payload: MarkdownTextInputCommandPayload,
        result: MarkdownCommandResult,
    ) => void;
    onSelectionChange?: (
        event: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
    ) => void;
    resolveCommandPayload?: MarkdownCommandPayloadResolver;
    selection?: MarkdownSelection;
    toolbarItems?: readonly MarkdownToolbarItem[];
    value: string;
}

export type MarkdownComposerMode = 'compact' | 'expanded';

export interface MarkdownComposerProps extends Omit<
    MarkdownTextInputProps,
    'multiline' | 'numberOfLines' | 'toolbarItems'
> {
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

export type MarkdownWysiwygFormat =
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikethrough'
    | 'inline-code';

export type MarkdownWysiwygFormatStyles = Partial<
    Record<MarkdownWysiwygFormat, StyleProp<TextStyle>>
>;

export interface MarkdownWysiwygEditorProps extends Omit<
    TextInputProps,
    'children' | 'onChangeText' | 'onSelectionChange' | 'selection' | 'style' | 'value'
> {
    editorStyle?: StyleProp<ViewStyle>;
    /** Per-format text styles applied to rendered inline spans. */
    formatStyles?: MarkdownWysiwygFormatStyles | undefined;
    /** Receives markdown source after an edit to the rendered display text. */
    onChangeText: (value: string) => void;
    /** Reports the caret/selection in display (marker-free) coordinates. */
    onSelectionChange?: (selection: MarkdownSelection) => void;
    /** Controlled display selection, also used to locate edits in repeated text. */
    selection?: MarkdownSelection;
    textStyle?: StyleProp<TextStyle>;
    /** Controlled markdown source. Rejected edits restore the native text and caret. */
    value: string;
}

export type MarkdownEditorMode = 'plaintext' | 'wysiwyg';

export interface MarkdownEditorProps extends Omit<
    TextInputProps,
    'children' | 'onChangeText' | 'onSelectionChange' | 'selection' | 'style' | 'value'
> {
    containerStyle?: StyleProp<ViewStyle>;
    editorStyle?: StyleProp<ViewStyle>;
    formatStyles?: MarkdownWysiwygFormatStyles | undefined;
    /** Controlled editing mode. Changes preserve the selection across coordinate spaces. */
    mode?: MarkdownEditorMode;
    onChangeText: (value: string) => void;
    onModeChange?: (mode: MarkdownEditorMode) => void;
    resolveCommandPayload?: MarkdownCommandPayloadResolver;
    /** Render a built-in plain-text/rich mode toggle. Defaults to true. */
    showModeToggle?: boolean;
    textStyle?: StyleProp<TextStyle>;
    toolbarItems?: readonly MarkdownToolbarItem[];
    value: string;
}

export interface MarkdownPreviewProps extends MarkdownRenderOptions {
    emptyState?: string;
    label?: ReactNode;
    previewContainerStyle?: StyleProp<ViewStyle>;
    value: string;
}

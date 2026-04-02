import type {ReactNode} from 'react';
import type {
  NativeSyntheticEvent,
  StyleProp,
  TextInputProps,
  TextInputSelectionChangeEventData,
  TextStyle,
  ViewStyle,
} from 'react-native';
import type {MarkdownStyleMap} from '../lib/types';

export interface MarkdownSelection {
  start: number;
  end: number;
}

export interface MarkdownCommandResult {
  selection: MarkdownSelection;
  value: string;
}

export type MarkdownInlineFormat =
  | 'bold'
  | 'italic'
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

export interface MarkdownToolbarItem {
  command: MarkdownCommand;
  label: string;
}

export interface MarkdownTextInputProps
  extends Omit<TextInputProps, 'onChangeText' | 'onSelectionChange' | 'value'> {
  enableShortcuts?: boolean;
  onChangeText: (value: string) => void;
  onCommand?: (
    payload: MarkdownTextInputCommandPayload,
    result: MarkdownCommandResult,
  ) => void;
  onSelectionChange?: (
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => void;
  selection?: MarkdownSelection;
  toolbarItems?: readonly MarkdownToolbarItem[];
  value: string;
}

export type MarkdownComposerMode = 'compact' | 'expanded';

export interface MarkdownComposerProps
  extends Omit<
    MarkdownTextInputProps,
    'multiline' | 'numberOfLines' | 'toolbarItems'
  > {
  compactToolbarItems?: readonly MarkdownToolbarItem[];
  composerStyle?: StyleProp<ViewStyle>;
  expandedToolbarItems?: readonly MarkdownToolbarItem[];
  initialMode?: MarkdownComposerMode;
  onModeChange?: (mode: MarkdownComposerMode) => void;
  previewEnabled?: boolean;
  previewEmptyState?: string;
  previewLabel?: ReactNode;
  renderExpandButtonLabel?: (mode: MarkdownComposerMode) => ReactNode;
  textInputStyle?: StyleProp<TextStyle>;
}

export interface MarkdownPreviewProps {
  emptyState?: string;
  label?: ReactNode;
  previewContainerStyle?: StyleProp<ViewStyle>;
  style?: MarkdownStyleMap | null;
  value: string;
}

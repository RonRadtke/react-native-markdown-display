import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';

import MarkdownPreview from './MarkdownPreview';
import MarkdownTextInput from './MarkdownTextInput';

import type {MarkdownComposerMode, MarkdownComposerProps} from './types';

const DEFAULT_COMPACT_TOOLBAR = [
  {command: 'bold', label: 'B'},
  {command: 'italic', label: 'I'},
  {command: 'link', label: 'Link'},
] as const;

const DEFAULT_EXPANDED_TOOLBAR = [
  ...DEFAULT_COMPACT_TOOLBAR,
  {command: 'heading-two', label: 'H2'},
  {command: 'bullet-list', label: 'List'},
  {command: 'code-block', label: 'Code'},
  {command: 'table', label: 'Table'},
] as const;

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
      renderExpandButtonLabel,
      style,
      textInputStyle,
      value,
      ...textInputProps
    },
    ref,
  ) {
    const [mode, setMode] = useState<MarkdownComposerMode>(initialMode);

    const toolbarItems = useMemo(
      () => (mode === 'compact' ? compactToolbarItems : expandedToolbarItems),
      [compactToolbarItems, expandedToolbarItems, mode],
    );

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
          multiline={mode === 'expanded'}
          numberOfLines={mode === 'expanded' ? 8 : 1}
          ref={ref}
          style={[styles.textInput, style, textInputStyle]}
          toolbarItems={toolbarItems}
          value={value}
        />
        {previewEnabled && mode === 'expanded' ? (
          <MarkdownPreview
            {...(previewEmptyState ? {emptyState: previewEmptyState} : {})}
            {...(previewLabel ? {label: previewLabel} : {})}
            value={value}
          />
        ) : null}
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={toggleMode}
            style={styles.expandButton}
          >
            <Text style={styles.expandButtonText}>
              {renderExpandButtonLabel?.(mode) ??
                (mode === 'compact' ? 'Expand' : 'Collapse')}
            </Text>
          </Pressable>
        </View>
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
    alignItems: 'flex-end',
    marginTop: 8,
  },
  textInput: {
    width: '100%',
  },
});

MarkdownComposer.displayName = 'MarkdownComposer';

export default MarkdownComposer;

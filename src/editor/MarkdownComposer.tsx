import React, {useMemo, useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';

import MarkdownPreview from './MarkdownPreview';
import MarkdownTextInput from './MarkdownTextInput';

import type {
  MarkdownComposerMode,
  MarkdownComposerProps,
  MarkdownTextInputCommandPayload,
} from './types';

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

const DEFAULT_COMPACT_MAX_HEIGHT = 110;
const DEFAULT_LINK_URL = 'https://';

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
    const promptResolverRef = useRef<PromptResolver | null>(null);

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
        return new Promise<MarkdownTextInputCommandPayload | null>((resolve) => {
          promptResolverRef.current = resolve;
          setPromptState({
            command,
            title: '',
            url: DEFAULT_LINK_URL,
          });
        });
      }

      if (command === 'table') {
        return new Promise<MarkdownTextInputCommandPayload | null>((resolve) => {
          promptResolverRef.current = resolve;
          setPromptState({
            command,
            columns: '3',
            rows: '2',
          });
        });
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
      if (!promptState) {
        return;
      }

      if (promptState.command === 'link') {
        promptResolverRef.current?.({
          command: 'link',
          link: {
            ...(promptState.title.trim().length > 0
              ? {title: promptState.title.trim()}
              : {}),
            url:
              promptState.url.trim().length > 0
                ? promptState.url.trim()
                : DEFAULT_LINK_URL,
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
          columns: Number.isFinite(columns) && columns > 0 ? columns : 3,
          rows: Number.isFinite(rows) && rows > 0 ? rows : 2,
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
            <View style={styles.promptActions}>
              <Pressable
                accessibilityRole="button"
                onPress={handleCancelPrompt}
                style={[styles.promptButton, styles.promptButtonSecondary]}
              >
                <Text style={styles.promptButtonSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleApplyPrompt}
                style={[styles.promptButton, styles.promptButtonPrimary]}
              >
                <Text style={styles.promptButtonPrimaryText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
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

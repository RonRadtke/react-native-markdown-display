import React, {useEffect, useMemo, useState} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from 'react-native';

import {
  applyBlockFormat,
  applyInlineFormat,
  applyLinkFormat,
  applyTableFormat,
} from './commands/formatMarkdown';
import {applyMarkdownShortcut} from './utils/shortcuts';
import {normalizeSelection} from './utils/selection';

import type {
  MarkdownCommandResult,
  MarkdownTextInputCommandPayload,
  MarkdownTextInputProps,
  MarkdownToolbarItem,
} from './types';

const DEFAULT_TOOLBAR_ITEMS: readonly MarkdownToolbarItem[] = [
  {command: 'bold', label: 'B'},
  {command: 'italic', label: 'I'},
  {command: 'inline-code', label: '</>'},
];

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
      throw new Error(`Unsupported markdown command: ${String(exhaustiveCheck)}`);
    }
  }
};

const MarkdownTextInput = React.forwardRef<TextInput, MarkdownTextInputProps>(
  function MarkdownTextInput(
    {
      onChangeText,
      onCommand,
      onSelectionChange,
      selection,
      style,
      toolbarItems = DEFAULT_TOOLBAR_ITEMS,
      enableShortcuts = true,
      multiline = true,
      numberOfLines,
      value,
      ...textInputProps
    },
    ref,
  ) {
    const [internalSelection, setInternalSelection] = useState(() =>
      normalizeSelection(value, selection),
    );

    useEffect(() => {
      if (selection) {
        setInternalSelection(normalizeSelection(value, selection));
      }
    }, [selection, value]);

    const normalizedSelection = useMemo(
      () => normalizeSelection(value, selection ?? internalSelection),
      [internalSelection, selection, value],
    );

    const handleSelectionChange = (
      event: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
    ): void => {
      setInternalSelection(event.nativeEvent.selection);
      onSelectionChange?.(event);
    };

    const handleCommandPress = (
      payload: MarkdownTextInputCommandPayload,
    ): void => {
      const result = executeCommand(value, normalizedSelection, payload);

      if (!selection) {
        setInternalSelection(result.selection);
      }

      onChangeText(result.value);
      onCommand?.(payload, result);
    };

    const handleChangeText = (nextValue: string): void => {
      if (enableShortcuts) {
        const shortcutResult = applyMarkdownShortcut({
          nextValue,
          previousSelection: normalizedSelection,
          previousValue: value,
        });

        if (shortcutResult) {
          if (!selection) {
            setInternalSelection(shortcutResult.selection);
          }

          onChangeText(shortcutResult.value);
          return;
        }
      }

      onChangeText(nextValue);
    };

    return (
      <View style={styles.container}>
        <View style={styles.toolbar}>
          {toolbarItems.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item.command}
              onPress={() => handleCommandPress({command: item.command})}
              style={styles.toolbarButton}
            >
              <Text style={styles.toolbarButtonText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          {...textInputProps}
          multiline={multiline}
          numberOfLines={numberOfLines}
          ref={ref}
          onChangeText={handleChangeText}
          onSelectionChange={handleSelectionChange}
          selection={normalizedSelection}
          style={[styles.input, style]}
          value={value}
        />
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
  toolbarButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

MarkdownTextInput.displayName = 'MarkdownTextInput';

export default MarkdownTextInput;

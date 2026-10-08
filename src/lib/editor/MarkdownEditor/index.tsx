import React, {useMemo, useState} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';

import EditorToolbar from '../EditorToolbar';
import {applyToolbarAction} from '../commands/formatMarkdown';
import {executeCommand, isInlineCommand} from '../commands/executeCommand';
import {DEFAULT_EXPANDED_TOOLBAR_ITEMS} from '../defaultToolbarItems';
import MarkdownTextInput from '../MarkdownTextInput';
import MarkdownWysiwygEditor from '../MarkdownWysiwygEditor';
import styles from './style';
import {normalizeSelection} from '../utils/selection';
import {useCommittedValue} from '../utils/useCommittedValue';
import {applyInlineFormatWysiwyg} from '../utils/wysiwygEdit';
import {buildWysiwygModel, displaySelectionToSource, getFormatsAtDisplayOffset, sourceOffsetToDisplay} from '../utils/wysiwygModel';

import type {MarkdownCommand, MarkdownCommandResult, MarkdownEditorMode, MarkdownEditorProps, MarkdownSelection, MarkdownToolbarAction} from '../types';

const MODE_LABELS: Record<MarkdownEditorMode, string> = {plaintext: 'Plain text', wysiwyg: 'Rich text'};

const MODE_ORDER: readonly MarkdownEditorMode[] = ['plaintext', 'wysiwyg'];

const MarkdownEditor = React.forwardRef<TextInput, MarkdownEditorProps>(function MarkdownEditor({containerStyle, editorStyle, formatStyles, mode: controlledMode, onChangeText, onModeChange, resolveCommandPayload, showModeToggle = true, textStyle, toolbarItems = DEFAULT_EXPANDED_TOOLBAR_ITEMS, value, ...textInputProps}, ref) {
    const [internalMode, setInternalMode] = useState<MarkdownEditorMode>('plaintext');
    const mode = controlledMode ?? internalMode;
    const model = useMemo(() => buildWysiwygModel(value), [value]);
    const [selectionState, setSelectionState] = useState<{mode: MarkdownEditorMode; selection: MarkdownSelection}>(() => ({mode, selection: normalizeSelection(mode === 'wysiwyg' ? model.display : value, undefined)}));
    const selection = useMemo(() => {
        if (selectionState.mode === mode) {
            return normalizeSelection(mode === 'wysiwyg' ? model.display : value, selectionState.selection);
        }

        if (mode === 'plaintext') {
            return displaySelectionToSource(model, selectionState.selection);
        }

        const sourceRange = normalizeSelection(value, selectionState.selection);
        return {start: sourceOffsetToDisplay(model, sourceRange.start), end: sourceOffsetToDisplay(model, sourceRange.end)};
    }, [mode, model, selectionState, value]);
    const disabled = textInputProps.editable === false || textInputProps.readOnly === true;
    const latest = useCommittedValue({disabled, mode, onChangeText, resolveCommandPayload, selection, value});

    const activeCommands = useMemo<ReadonlySet<MarkdownCommand> | undefined>(() => {
        if (mode !== 'wysiwyg') {
            return undefined;
        }

        const formats = getFormatsAtDisplayOffset(model, selection.start);

        return new Set<MarkdownCommand>(formats);
    }, [selection.start, mode, model]);

    const changeMode = (nextMode: MarkdownEditorMode): void => {
        if (nextMode === mode) {
            return;
        }

        if (controlledMode === undefined) {
            setInternalMode(nextMode);
        }

        onModeChange?.(nextMode);
    };

    const applyCommand = async (command: MarkdownCommand): Promise<void> => {
        const initial = latest.current;

        if (!initial || initial.disabled) {
            return;
        }

        const resolvedPayload = await initial.resolveCommandPayload?.(command);
        const current = latest.current;

        if (resolvedPayload === null || !current || current.disabled) {
            return;
        }

        const payload = resolvedPayload ?? {command};

        if (current.mode === 'wysiwyg') {
            if (isInlineCommand(payload.command)) {
                const result = applyInlineFormatWysiwyg(current.value, current.selection, payload.command);

                setSelectionState({mode: current.mode, selection: result.selection});
                current.onChangeText(result.value);
                return;
            }

            const currentModel = buildWysiwygModel(current.value);
            const sourceRange = displaySelectionToSource(currentModel, current.selection);
            const result = executeCommand(current.value, sourceRange, payload);
            const nextModel = buildWysiwygModel(result.value);

            setSelectionState({mode: current.mode, selection: {end: sourceOffsetToDisplay(nextModel, result.selection.end), start: sourceOffsetToDisplay(nextModel, result.selection.start)}});
            current.onChangeText(result.value);
            return;
        }

        const result = executeCommand(current.value, current.selection, payload);

        setSelectionState({mode: current.mode, selection: result.selection});
        current.onChangeText(result.value);
    };

    const applyAction = (action: MarkdownToolbarAction): void => {
        const current = latest.current;

        if (!current || current.disabled) {
            return;
        }

        let result: MarkdownCommandResult;

        if (current.mode === 'wysiwyg') {
            const currentModel = buildWysiwygModel(current.value);
            const sourceRange = displaySelectionToSource(currentModel, current.selection);
            result = applyToolbarAction(current.value, sourceRange, action);
            const nextModel = buildWysiwygModel(result.value);

            result.selection = {end: sourceOffsetToDisplay(nextModel, result.selection.end), start: sourceOffsetToDisplay(nextModel, result.selection.start)};
        } else {
            result = applyToolbarAction(current.value, current.selection, action);
        }

        setSelectionState({mode: current.mode, selection: result.selection});
        current.onChangeText(result.value);
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {showModeToggle ? (
                <View accessibilityRole="tablist" style={styles.modeToggle}>
                    {MODE_ORDER.map(modeOption => {
                        const isActive = mode === modeOption;

                        return (
                            <Pressable accessibilityLabel={MODE_LABELS[modeOption]} accessibilityRole="tab" accessibilityState={{selected: isActive}} key={modeOption} onPress={() => changeMode(modeOption)} style={[styles.modeButton, isActive ? styles.modeButtonActive : null]}>
                                <Text style={[styles.modeButtonText, isActive ? styles.modeButtonTextActive : null]}>{MODE_LABELS[modeOption]}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            ) : null}
            <EditorToolbar activeCommands={activeCommands} disabled={disabled} items={toolbarItems} onAction={applyAction} onCommand={applyCommand} />
            {mode === 'wysiwyg' ? <MarkdownWysiwygEditor {...textInputProps} editorStyle={[styles.surface, editorStyle]} formatStyles={formatStyles} onChangeText={onChangeText} onSelectionChange={nextSelection => setSelectionState({mode: 'wysiwyg', selection: nextSelection})} ref={ref} selection={selection} textStyle={textStyle} value={value} /> : <MarkdownTextInput {...textInputProps} onChangeText={onChangeText} onSelectionChange={event => setSelectionState({mode: 'plaintext', selection: event.nativeEvent.selection})} ref={ref} selection={selection} style={[styles.surface, editorStyle, textStyle]} toolbarItems={[]} value={value} />}
        </View>
    );
});

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;

import React, {useCallback, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {type NativeSyntheticEvent, type StyleProp, Text, TextInput, type TextInputSelectionChangeEventData, type TextStyle} from 'react-native';

import styles from './style';
import {normalizeSelection} from '../utils/selection';
import {applyDisplayEdit} from '../utils/wysiwygEdit';
import {buildWysiwygModel, type WysiwygBlock, type WysiwygInlineFormat, type WysiwygSegment} from '../utils/wysiwygModel';

import type {MarkdownSelection, MarkdownWysiwygEditorProps, MarkdownWysiwygFormatStyles} from '../types';

const setForwardedRef = (forwardedRef: React.ForwardedRef<TextInput>, value: TextInput | null): void => {
    if (typeof forwardedRef === 'function') {
        forwardedRef(value);
        return;
    }

    if (forwardedRef) {
        forwardedRef.current = value;
    }
};

const getDefaultFormatStyle = (format: WysiwygInlineFormat, hasUnderline: boolean, hasStrikethrough: boolean): StyleProp<TextStyle> => {
    switch (format) {
        case 'bold':
            return styles.bold;
        case 'italic':
            return styles.italic;
        case 'inline-code':
            return styles.code;
        case 'underline':
            return hasStrikethrough ? styles.underlineStrikethrough : styles.underline;
        case 'strikethrough':
            return hasUnderline ? null : styles.strikethrough;
        default:
            return null;
    }
};

const getBlockStyle = (block: WysiwygBlock): StyleProp<TextStyle> => {
    switch (block) {
        case 'heading-one':
            return styles.headingOne;
        case 'heading-two':
            return styles.headingTwo;
        case 'heading-three':
            return styles.headingThree;
        case 'list-marker':
            return styles.listMarker;
        default:
            return null;
    }
};

const getSegmentStyle = (segment: WysiwygSegment, formatStyles: MarkdownWysiwygFormatStyles | undefined): StyleProp<TextStyle>[] => {
    const hasUnderline = segment.formats.includes('underline');
    const hasStrikethrough = segment.formats.includes('strikethrough');

    return [getBlockStyle(segment.block), ...segment.formats.flatMap(format => [getDefaultFormatStyle(format, hasUnderline, hasStrikethrough), formatStyles?.[format] ?? null])];
};

const MarkdownWysiwygEditor = React.forwardRef<TextInput, MarkdownWysiwygEditorProps>(function MarkdownWysiwygEditor({editorStyle, formatStyles, onChangeText, onSelectionChange, selection, textStyle, value, ...textInputProps}, ref) {
    const model = useMemo(() => buildWysiwygModel(value), [value]);
    const inputRef = useRef<TextInput | null>(null);
    // Display caret at which typed markdown just closed a span; typing there continues outside it.
    const caretOutsideRef = useRef<number | null>(null);
    const [nativeState, setNativeState] = useState<{generation: number; restoreFocus: boolean; pending: {display: string; previousDisplay: string; previousSelection: MarkdownSelection; focused: boolean} | null}>({generation: 0, restoreFocus: false, pending: null});
    const [internalSelection, setInternalSelection] = useState<MarkdownSelection>(() => normalizeSelection(model.display, selection));

    const normalizedSelection = useMemo(() => normalizeSelection(model.display, selection ?? internalSelection), [internalSelection, model.display, selection]);

    if (nativeState.pending) {
        const pending = nativeState.pending;
        const rejected = pending.display !== model.display && pending.previousDisplay === model.display;

        // Unchanged attributed children cannot reset native text. Recreate only
        // a rejected edit's native surface; normal accepted typing keeps its host.
        setNativeState({generation: nativeState.generation + (rejected ? 1 : 0), restoreFocus: rejected ? pending.focused : nativeState.restoreFocus, pending: null});
        if (rejected && selection === undefined) {
            setInternalSelection(pending.previousSelection);
        }
    }

    const setInputRef = useCallback(
        (input: TextInput | null): void => {
            inputRef.current = input;
            setForwardedRef(ref, input);
        },
        [ref],
    );

    useLayoutEffect(() => {
        if (nativeState.restoreFocus) {
            inputRef.current?.focus();
        }
    }, [nativeState.generation, nativeState.restoreFocus]);

    const updateSelection = (nextSelection: MarkdownSelection): void => {
        if (!selection) {
            setInternalSelection(nextSelection);
        }

        onSelectionChange?.(nextSelection);
    };

    const handleChangeText = (nextDisplay: string): void => {
        const caretOutside = caretOutsideRef.current !== null && normalizedSelection.start === caretOutsideRef.current && normalizedSelection.end === caretOutsideRef.current;
        const result = applyDisplayEdit(value, nextDisplay, normalizedSelection, {caretOutside});
        const focused = inputRef.current?.isFocused() ?? false;

        caretOutsideRef.current = result.caretOutside ? result.selection.start : null;

        setNativeState(current => ({...current, pending: {display: nextDisplay, previousDisplay: model.display, previousSelection: normalizedSelection, focused}}));

        updateSelection(result.selection);
        onChangeText(result.value);
    };

    const handleSelectionChange = (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>): void => {
        const {start, end} = event.nativeEvent.selection;

        if (caretOutsideRef.current !== null && (start !== caretOutsideRef.current || end !== start)) {
            caretOutsideRef.current = null;
        }

        updateSelection(event.nativeEvent.selection);
    };

    return (
        <TextInput {...textInputProps} key={nativeState.generation} multiline onChangeText={handleChangeText} onSelectionChange={handleSelectionChange} ref={setInputRef} selection={normalizedSelection} style={[styles.input, textStyle, editorStyle]}>
            {model.display.length > 0
                ? model.segments.map((segment, index) => (
                      <Text key={`segment-${index}`} style={getSegmentStyle(segment, formatStyles)}>
                          {segment.text}
                      </Text>
                  ))
                : null}
        </TextInput>
    );
});

MarkdownWysiwygEditor.displayName = 'MarkdownWysiwygEditor';

export default MarkdownWysiwygEditor;

import {normalizeSelection} from './selection';

import type {MarkdownCommandResult, MarkdownSelection} from '../types';

export const insertTextAtSelection = (
    value: string,
    selection: MarkdownSelection | undefined,
    text: string,
): MarkdownCommandResult => {
    const normalizedSelection = normalizeSelection(value, selection);
    const nextValue = `${value.slice(0, normalizedSelection.start)}${text}${value.slice(
        normalizedSelection.end,
    )}`;
    const nextOffset = normalizedSelection.start + text.length;

    return {
        selection: {
            end: nextOffset,
            start: nextOffset,
        },
        value: nextValue,
    };
};

export const removeTextBeforeSelection = (
    value: string,
    selection: MarkdownSelection | undefined,
): MarkdownCommandResult => {
    const normalizedSelection = normalizeSelection(value, selection);

    if (normalizedSelection.start !== normalizedSelection.end) {
        return insertTextAtSelection(value, normalizedSelection, '');
    }

    if (normalizedSelection.start === 0) {
        return {
            selection: normalizedSelection,
            value,
        };
    }

    const nextOffset = normalizedSelection.start - 1;

    return {
        selection: {
            end: nextOffset,
            start: nextOffset,
        },
        value: `${value.slice(0, nextOffset)}${value.slice(normalizedSelection.end)}`,
    };
};

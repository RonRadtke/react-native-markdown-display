import type {MarkdownSelection} from '../types';

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export const normalizeSelection = (value: string, selection: MarkdownSelection | undefined): MarkdownSelection => {
    const max = value.length;

    if (!selection) {
        return {start: max, end: max};
    }

    const start = clamp(selection.start, 0, max);
    const end = clamp(selection.end, 0, max);

    return start <= end ? {start, end} : {start: end, end: start};
};

export const getSelectedText = (value: string, selection: MarkdownSelection | undefined): string => {
    const normalizedSelection = normalizeSelection(value, selection);

    return value.slice(normalizedSelection.start, normalizedSelection.end);
};

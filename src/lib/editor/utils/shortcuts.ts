import type {MarkdownCommandResult, MarkdownSelection} from '../types';

interface ShortcutContext {
    nextValue: string;
    previousSelection: MarkdownSelection;
    previousValue: string;
}

const createResult = (
    value: string,
    selection: MarkdownSelection,
): MarkdownCommandResult => ({
    selection,
    value,
});

const getLineBeforeCursor = (value: string, cursor: number): string => {
    const lineStart = value.lastIndexOf('\n', Math.max(cursor - 1, 0));

    return value.slice(lineStart === -1 ? 0 : lineStart + 1, cursor);
};

const isSingleNewlineInsertion = ({
                                      nextValue,
                                      previousSelection,
                                      previousValue,
                                  }: ShortcutContext): boolean => {
    if (previousSelection.start !== previousSelection.end) {
        return false;
    }

    const cursor = previousSelection.start;

    return (
        nextValue.length === previousValue.length + 1 &&
        nextValue.slice(0, cursor) === previousValue.slice(0, cursor) &&
        nextValue[cursor] === '\n' &&
        nextValue.slice(cursor + 1) === previousValue.slice(cursor)
    );
};

const getContinuation = (line: string): string | null => {
    if (/^>\s+.+$/.test(line)) {
        return '> ';
    }

    const bulletMatch = line.match(/^([-+*])\s+.+$/);

    if (bulletMatch?.[1]) {
        return `${bulletMatch[1]} `;
    }

    const orderedMatch = line.match(/^(\d+)\.\s+.+$/);

    if (orderedMatch?.[1]) {
        return `${String(Number(orderedMatch[1]) + 1)}. `;
    }

    return null;
};

const isExitMarker = (line: string): boolean =>
    /^>\s?$/.test(line) || /^([-+*])\s$/.test(line) || /^\d+\.\s$/.test(line);

export const applyMarkdownShortcut = (
    context: ShortcutContext,
): MarkdownCommandResult | null => {
    if (!isSingleNewlineInsertion(context)) {
        return null;
    }

    const cursor = context.previousSelection.start;
    const line = getLineBeforeCursor(context.previousValue, cursor);

    if (isExitMarker(line)) {
        const lineStart = cursor - line.length;
        const value =
            context.nextValue.slice(0, lineStart) + context.nextValue.slice(cursor);

        return createResult(value, {
            start: lineStart + 1,
            end: lineStart + 1,
        });
    }

    const continuation = getContinuation(line);

    if (!continuation) {
        return null;
    }

    const value =
        context.nextValue.slice(0, cursor + 1) +
        continuation +
        context.nextValue.slice(cursor + 1);
    const nextCursor = cursor + 1 + continuation.length;

    return createResult(value, {
        start: nextCursor,
        end: nextCursor,
    });
};

import type {MarkdownBlockFormat, MarkdownCommandResult, MarkdownInlineFormat, MarkdownLinkPayload, MarkdownSelection, MarkdownTablePayload,} from '../types';
import {normalizeSelection} from '../utils/selection';

const INLINE_MARKERS: Record<MarkdownInlineFormat, string> = {
    bold: '**',
    italic: '_',
    strikethrough: '~~',
    'inline-code': '`',
};

const BLOCK_PREFIXES: Record<Exclude<MarkdownBlockFormat, 'code-block'>, string> = {
    'heading-one': '# ',
    'heading-two': '## ',
    'heading-three': '### ',
    blockquote: '> ',
    'bullet-list': '- ',
    'ordered-list': '1. ',
};

const createResult = (
    value: string,
    selection: MarkdownSelection,
): MarkdownCommandResult => ({
    selection,
    value,
});

const replaceSelection = (
    value: string,
    selection: MarkdownSelection | undefined,
    replacement: string,
    selectionStartOffset = 0,
    selectionEndOffset = replacement.length,
): MarkdownCommandResult => {
    const normalizedSelection = normalizeSelection(value, selection);
    const nextValue =
        value.slice(0, normalizedSelection.start) +
        replacement +
        value.slice(normalizedSelection.end);

    return createResult(nextValue, {
        start: normalizedSelection.start + selectionStartOffset,
        end: normalizedSelection.start + selectionEndOffset,
    });
};

const isWrappedWithMarker = (
    value: string,
    selection: MarkdownSelection,
    marker: string,
): boolean =>
    selection.start >= marker.length &&
    value.slice(selection.start - marker.length, selection.start) === marker &&
    value.slice(selection.end, selection.end + marker.length) === marker;

export const applyInlineFormat = (
    value: string,
    selection: MarkdownSelection | undefined,
    format: MarkdownInlineFormat,
): MarkdownCommandResult => {
    const normalizedSelection = normalizeSelection(value, selection);
    const marker = INLINE_MARKERS[format];

    if (isWrappedWithMarker(value, normalizedSelection, marker)) {
        const nextValue =
            value.slice(0, normalizedSelection.start - marker.length) +
            value.slice(normalizedSelection.start, normalizedSelection.end) +
            value.slice(normalizedSelection.end + marker.length);

        return createResult(nextValue, {
            start: normalizedSelection.start - marker.length,
            end: normalizedSelection.end - marker.length,
        });
    }

    const selectedText = value.slice(
        normalizedSelection.start,
        normalizedSelection.end,
    );
    const fallbackText = selectedText.length > 0 ? selectedText : 'text';
    const replacement = `${marker}${fallbackText}${marker}`;
    const selectionStartOffset = marker.length;
    const selectionEndOffset = marker.length + fallbackText.length;

    return replaceSelection(
        value,
        normalizedSelection,
        replacement,
        selectionStartOffset,
        selectionEndOffset,
    );
};

const getLineSelectionBounds = (
    value: string,
    selection: MarkdownSelection,
): { end: number; start: number } => {
    const lineStart = value.lastIndexOf('\n', Math.max(selection.start - 1, 0));
    const start = lineStart === -1 ? 0 : lineStart + 1;
    const nextBreakIndex = value.indexOf('\n', selection.end);
    const end = nextBreakIndex === -1 ? value.length : nextBreakIndex;

    return {start, end};
};

const toggleLinePrefix = (
    line: string,
    prefix: string,
    index: number,
): string => {
    if (prefix === '1. ') {
        const orderedPrefixMatch = line.match(/^\d+\.\s/);

        if (orderedPrefixMatch) {
            return line.slice(orderedPrefixMatch[0].length);
        }

        return `${index + 1}. ${line}`;
    }

    return line.startsWith(prefix) ? line.slice(prefix.length) : `${prefix}${line}`;
};

export const applyBlockFormat = (
    value: string,
    selection: MarkdownSelection | undefined,
    format: MarkdownBlockFormat,
): MarkdownCommandResult => {
    const normalizedSelection = normalizeSelection(value, selection);

    if (format === 'code-block') {
        const selectedText = value.slice(
            normalizedSelection.start,
            normalizedSelection.end,
        );
        const fallbackText = selectedText.length > 0 ? selectedText : '\n';
        const replacement = `\`\`\`\n${fallbackText}\n\`\`\``;

        return replaceSelection(value, normalizedSelection, replacement, 4, 4 + fallbackText.length);
    }

    const {start, end} = getLineSelectionBounds(value, normalizedSelection);
    const lineSlice = value.slice(start, end);
    const lines = lineSlice.split('\n');
    const prefix = BLOCK_PREFIXES[format];
    const nextLines = lines.map((line, index) => toggleLinePrefix(line, prefix, index));
    const nextSlice = nextLines.join('\n');

    return createResult(
        value.slice(0, start) + nextSlice + value.slice(end),
        {
            start,
            end: start + nextSlice.length,
        },
    );
};

export const applyLinkFormat = (
    value: string,
    selection: MarkdownSelection | undefined,
    payload: MarkdownLinkPayload = {},
): MarkdownCommandResult => {
    const normalizedSelection = normalizeSelection(value, selection);
    const selectedText = value.slice(
        normalizedSelection.start,
        normalizedSelection.end,
    );
    const title = payload.title ?? (selectedText.length > 0 ? selectedText : 'link');
    const url = payload.url ?? 'https://';
    const replacement = `[${title}](${url})`;
    const urlStart = replacement.indexOf(url);

    return replaceSelection(
        value,
        normalizedSelection,
        replacement,
        urlStart,
        urlStart + url.length,
    );
};

export const createMarkdownTable = (
    payload: MarkdownTablePayload = {},
): string => {
    const columns = Math.max(payload.columns ?? 3, 1);
    const rows = Math.max(payload.rows ?? 2, 1);

    const header = `| ${Array.from({length: columns}, (_, index) => `Column ${index + 1}`).join(' | ')} |`;
    const divider = `| ${Array.from({length: columns}, () => '---').join(' | ')} |`;
    const body = Array.from({length: rows}, () =>
        `| ${Array.from({length: columns}, () => 'Value').join(' | ')} |`,
    ).join('\n');

    return `${header}\n${divider}\n${body}`;
};

export const applyTableFormat = (
    value: string,
    selection: MarkdownSelection | undefined,
    payload: MarkdownTablePayload = {},
): MarkdownCommandResult => {
    const table = createMarkdownTable(payload);

    return replaceSelection(value, selection, table);
};

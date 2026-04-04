"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyToolbarAction = exports.applyToolbarWrapAction = exports.applyToolbarInsertAction = exports.applyTableFormat = exports.createMarkdownTable = exports.applyLinkFormat = exports.applyBlockFormat = exports.applyInlineFormat = void 0;
const selection_1 = require("../utils/selection");
const INLINE_MARKERS = {
    bold: '**',
    italic: '_',
    strikethrough: '~~',
    'inline-code': '`',
};
const BLOCK_PREFIXES = {
    'heading-one': '# ',
    'heading-two': '## ',
    'heading-three': '### ',
    blockquote: '> ',
    'bullet-list': '- ',
    'ordered-list': '1. ',
};
const createResult = (value, selection) => ({
    selection,
    value,
});
const replaceSelection = (value, selection, replacement, selectionStartOffset = 0, selectionEndOffset = replacement.length) => {
    const normalizedSelection = (0, selection_1.normalizeSelection)(value, selection);
    const nextValue = value.slice(0, normalizedSelection.start) +
        replacement +
        value.slice(normalizedSelection.end);
    return createResult(nextValue, {
        start: normalizedSelection.start + selectionStartOffset,
        end: normalizedSelection.start + selectionEndOffset,
    });
};
const normalizeOffset = (value, fallbackValue, maxValue) => {
    const nextValue = value !== null && value !== void 0 ? value : fallbackValue;
    return Math.min(Math.max(nextValue, 0), maxValue);
};
const isWrappedWithMarker = (value, selection, marker) => selection.start >= marker.length &&
    value.slice(selection.start - marker.length, selection.start) === marker &&
    value.slice(selection.end, selection.end + marker.length) === marker;
const applyInlineFormat = (value, selection, format) => {
    const normalizedSelection = (0, selection_1.normalizeSelection)(value, selection);
    const marker = INLINE_MARKERS[format];
    if (isWrappedWithMarker(value, normalizedSelection, marker)) {
        const nextValue = value.slice(0, normalizedSelection.start - marker.length) +
            value.slice(normalizedSelection.start, normalizedSelection.end) +
            value.slice(normalizedSelection.end + marker.length);
        return createResult(nextValue, {
            start: normalizedSelection.start - marker.length,
            end: normalizedSelection.end - marker.length,
        });
    }
    const selectedText = value.slice(normalizedSelection.start, normalizedSelection.end);
    const fallbackText = selectedText.length > 0 ? selectedText : 'text';
    const replacement = `${marker}${fallbackText}${marker}`;
    const selectionStartOffset = marker.length;
    const selectionEndOffset = marker.length + fallbackText.length;
    return replaceSelection(value, normalizedSelection, replacement, selectionStartOffset, selectionEndOffset);
};
exports.applyInlineFormat = applyInlineFormat;
const getLineSelectionBounds = (value, selection) => {
    const lineStart = value.lastIndexOf('\n', Math.max(selection.start - 1, 0));
    const start = lineStart === -1 ? 0 : lineStart + 1;
    const nextBreakIndex = value.indexOf('\n', selection.end);
    const end = nextBreakIndex === -1 ? value.length : nextBreakIndex;
    return { start, end };
};
const toggleLinePrefix = (line, prefix, index) => {
    if (prefix === '1. ') {
        const orderedPrefixMatch = line.match(/^\d+\.\s/);
        if (orderedPrefixMatch) {
            return line.slice(orderedPrefixMatch[0].length);
        }
        return `${index + 1}. ${line}`;
    }
    return line.startsWith(prefix) ? line.slice(prefix.length) : `${prefix}${line}`;
};
const applyBlockFormat = (value, selection, format) => {
    const normalizedSelection = (0, selection_1.normalizeSelection)(value, selection);
    if (format === 'code-block') {
        const selectedText = value.slice(normalizedSelection.start, normalizedSelection.end);
        const fallbackText = selectedText.length > 0 ? selectedText : '\n';
        const replacement = `\`\`\`\n${fallbackText}\n\`\`\``;
        return replaceSelection(value, normalizedSelection, replacement, 4, 4 + fallbackText.length);
    }
    const { start, end } = getLineSelectionBounds(value, normalizedSelection);
    const lineSlice = value.slice(start, end);
    const lines = lineSlice.split('\n');
    const prefix = BLOCK_PREFIXES[format];
    const nextLines = lines.map((line, index) => toggleLinePrefix(line, prefix, index));
    const nextSlice = nextLines.join('\n');
    return createResult(value.slice(0, start) + nextSlice + value.slice(end), {
        start,
        end: start + nextSlice.length,
    });
};
exports.applyBlockFormat = applyBlockFormat;
const applyLinkFormat = (value, selection, payload = {}) => {
    var _a, _b;
    const normalizedSelection = (0, selection_1.normalizeSelection)(value, selection);
    const selectedText = value.slice(normalizedSelection.start, normalizedSelection.end);
    const title = (_a = payload.title) !== null && _a !== void 0 ? _a : (selectedText.length > 0 ? selectedText : 'link');
    const url = (_b = payload.url) !== null && _b !== void 0 ? _b : 'https://';
    const replacement = `[${title}](${url})`;
    const urlStart = replacement.indexOf(url);
    return replaceSelection(value, normalizedSelection, replacement, urlStart, urlStart + url.length);
};
exports.applyLinkFormat = applyLinkFormat;
const createMarkdownTable = (payload = {}) => {
    var _a, _b;
    const columns = Math.max((_a = payload.columns) !== null && _a !== void 0 ? _a : 3, 1);
    const rows = Math.max((_b = payload.rows) !== null && _b !== void 0 ? _b : 2, 1);
    const header = `| ${Array.from({ length: columns }, (_, index) => `Column ${index + 1}`).join(' | ')} |`;
    const divider = `| ${Array.from({ length: columns }, () => '---').join(' | ')} |`;
    const body = Array.from({ length: rows }, () => `| ${Array.from({ length: columns }, () => 'Value').join(' | ')} |`).join('\n');
    return `${header}\n${divider}\n${body}`;
};
exports.createMarkdownTable = createMarkdownTable;
const applyTableFormat = (value, selection, payload = {}) => {
    const table = (0, exports.createMarkdownTable)(payload);
    return replaceSelection(value, selection, table);
};
exports.applyTableFormat = applyTableFormat;
const applyToolbarInsertAction = (value, selection, action) => {
    const selectionStartOffset = normalizeOffset(action.selectionStartOffset, action.markdown.length, action.markdown.length);
    const selectionEndOffset = normalizeOffset(action.selectionEndOffset, selectionStartOffset, action.markdown.length);
    return replaceSelection(value, selection, action.markdown, selectionStartOffset, selectionEndOffset);
};
exports.applyToolbarInsertAction = applyToolbarInsertAction;
const applyToolbarWrapAction = (value, selection, action) => {
    var _a, _b;
    const normalizedSelection = (0, selection_1.normalizeSelection)(value, selection);
    const selectedText = value.slice(normalizedSelection.start, normalizedSelection.end);
    const replacementText = selectedText.length > 0
        ? selectedText
        : ((_a = action.placeholder) !== null && _a !== void 0 ? _a : 'text');
    const suffix = (_b = action.suffix) !== null && _b !== void 0 ? _b : action.prefix;
    const replacement = `${action.prefix}${replacementText}${suffix}`;
    return replaceSelection(value, normalizedSelection, replacement, action.prefix.length, action.prefix.length + replacementText.length);
};
exports.applyToolbarWrapAction = applyToolbarWrapAction;
const applyToolbarAction = (value, selection, action) => {
    switch (action.type) {
        case 'insert':
            return (0, exports.applyToolbarInsertAction)(value, selection, action);
        case 'wrap':
            return (0, exports.applyToolbarWrapAction)(value, selection, action);
        default: {
            const exhaustiveCheck = action;
            throw new Error(`Unsupported toolbar action: ${String(exhaustiveCheck)}`);
        }
    }
};
exports.applyToolbarAction = applyToolbarAction;
//# sourceMappingURL=formatMarkdown.js.map
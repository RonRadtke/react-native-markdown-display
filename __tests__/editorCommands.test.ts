import {
    applyBlockFormat,
    applyInlineFormat,
    applyLinkFormat,
    applyTableFormat,
    applyToolbarAction,
    applyToolbarInsertAction,
    applyToolbarWrapAction,
    createMarkdownTable,
    getSelectedText,
    normalizeSelection,
} from '../src';

describe('normalizeSelection', () => {
    test('normalizes inverted selection bounds', () => {
        expect(normalizeSelection('hello', {start: 4, end: 1})).toEqual({
            start: 1,
            end: 4,
        });
    });

    test('returns end-of-string cursor when selection is undefined', () => {
        expect(normalizeSelection('hello', undefined)).toEqual({start: 5, end: 5});
    });

    test('clamps start and end to the valid range', () => {
        expect(normalizeSelection('hi', {start: -1, end: 10})).toEqual({
            start: 0,
            end: 2,
        });
    });

    test('returns zero-length cursor at start for empty value with no selection', () => {
        expect(normalizeSelection('', undefined)).toEqual({start: 0, end: 0});
    });
});

describe('getSelectedText', () => {
    test('returns the selected slice of the value', () => {
        expect(getSelectedText('hello world', {start: 6, end: 11})).toBe('world');
    });

    test('returns an empty string when selection is collapsed', () => {
        expect(getSelectedText('hello', {start: 2, end: 2})).toBe('');
    });

    test('returns an empty string when selection is undefined', () => {
        expect(getSelectedText('hello', undefined)).toBe('');
    });
});

describe('applyInlineFormat', () => {
    test('wraps selected text with bold markers', () => {
        expect(applyInlineFormat('hello world', {start: 6, end: 11}, 'bold')).toEqual({
            value: 'hello **world**',
            selection: {start: 8, end: 13},
        });
    });

    test('wraps selected text with italic markers', () => {
        expect(applyInlineFormat('hello world', {start: 6, end: 11}, 'italic')).toEqual({
            value: 'hello _world_',
            selection: {start: 7, end: 12},
        });
    });

    test('wraps selected text with strikethrough markers', () => {
        expect(applyInlineFormat('hello world', {start: 6, end: 11}, 'strikethrough')).toEqual({
            value: 'hello ~~world~~',
            selection: {start: 8, end: 13},
        });
    });

    test('wraps selected text with inline-code markers', () => {
        expect(applyInlineFormat('hello world', {start: 6, end: 11}, 'inline-code')).toEqual({
            value: 'hello `world`',
            selection: {start: 7, end: 12},
        });
    });

    test('wraps selected text with underline markers', () => {
        expect(applyInlineFormat('hello world', {start: 6, end: 11}, 'underline')).toEqual({
            value: 'hello ++world++',
            selection: {start: 8, end: 13},
        });
    });

    test('inserts placeholder and selects it when no text is selected', () => {
        expect(applyInlineFormat('hello ', {start: 6, end: 6}, 'bold')).toEqual({
            value: 'hello **text**',
            selection: {start: 8, end: 12},
        });
    });

    test('unwraps bold when selection is already inside bold markers', () => {
        expect(applyInlineFormat('hello **world**', {start: 8, end: 13}, 'bold')).toEqual({
            value: 'hello world',
            selection: {start: 6, end: 11},
        });
    });

    test('unwraps italic when selection is already inside italic markers', () => {
        expect(applyInlineFormat('hello _world_', {start: 7, end: 12}, 'italic')).toEqual({
            value: 'hello world',
            selection: {start: 6, end: 11},
        });
    });

    test('unwraps strikethrough when selection is already inside strikethrough markers', () => {
        expect(applyInlineFormat('hello ~~world~~', {start: 8, end: 13}, 'strikethrough')).toEqual({
            value: 'hello world',
            selection: {start: 6, end: 11},
        });
    });

    test('unwraps inline-code when selection is already inside inline-code markers', () => {
        expect(applyInlineFormat('hello `world`', {start: 7, end: 12}, 'inline-code')).toEqual({
            value: 'hello world',
            selection: {start: 6, end: 11},
        });
    });

    test('unwraps underline when selection is already inside underline markers', () => {
        expect(applyInlineFormat('hello ++world++', {start: 8, end: 13}, 'underline')).toEqual({
            value: 'hello world',
            selection: {start: 6, end: 11},
        });
    });
});

describe('applyBlockFormat', () => {
    test('adds heading-one prefix to a line', () => {
        expect(applyBlockFormat('Title', {start: 0, end: 5}, 'heading-one')).toEqual({
            value: '# Title',
            selection: {start: 0, end: 7},
        });
    });

    test('adds heading-three prefix to a line', () => {
        expect(applyBlockFormat('Title', {start: 0, end: 5}, 'heading-three')).toEqual({
            value: '### Title',
            selection: {start: 0, end: 9},
        });
    });

    test('applies heading-two prefix across selected lines', () => {
        expect(
            applyBlockFormat('first line\nsecond line', {start: 0, end: 21}, 'heading-two'),
        ).toEqual({
            value: '## first line\n## second line',
            selection: {start: 0, end: 28},
        });
    });

    test('removes heading prefix when it already exists', () => {
        expect(applyBlockFormat('## Title', {start: 3, end: 8}, 'heading-two')).toEqual({
            value: 'Title',
            selection: {start: 0, end: 5},
        });
    });

    test('adds bullet-list prefix to a line', () => {
        expect(applyBlockFormat('item', {start: 0, end: 4}, 'bullet-list')).toEqual({
            value: '- item',
            selection: {start: 0, end: 6},
        });
    });

    test('removes bullet-list prefix when it already exists', () => {
        expect(applyBlockFormat('- item', {start: 2, end: 6}, 'bullet-list')).toEqual({
            value: 'item',
            selection: {start: 0, end: 4},
        });
    });

    test('adds blockquote prefix to a line', () => {
        expect(applyBlockFormat('text', {start: 0, end: 4}, 'blockquote')).toEqual({
            value: '> text',
            selection: {start: 0, end: 6},
        });
    });

    test('removes blockquote prefix when it already exists', () => {
        expect(applyBlockFormat('> text', {start: 2, end: 6}, 'blockquote')).toEqual({
            value: 'text',
            selection: {start: 0, end: 4},
        });
    });

    test('toggles ordered list prefixes off when they already exist', () => {
        expect(
            applyBlockFormat('1. first\n2. second', {start: 0, end: 18}, 'ordered-list'),
        ).toEqual({
            value: 'first\nsecond',
            selection: {start: 0, end: 12},
        });
    });

    test('wraps selected text in a code block', () => {
        expect(applyBlockFormat('hello world', {start: 0, end: 11}, 'code-block')).toEqual({
            value: '```\nhello world\n```',
            selection: {start: 4, end: 15},
        });
    });

    test('inserts an empty code block with a newline placeholder when no text is selected', () => {
        expect(applyBlockFormat('', {start: 0, end: 0}, 'code-block')).toEqual({
            value: '```\n\n\n```',
            selection: {start: 4, end: 5},
        });
    });

    test('unwraps a code block when the selection is already inside the fences', () => {
        expect(applyBlockFormat('```\nhello world\n```', {start: 4, end: 15}, 'code-block')).toEqual({
            value: 'hello world',
            selection: {start: 0, end: 11},
        });
    });

    test('unwraps a mid-document code block without disturbing surrounding text', () => {
        expect(
            applyBlockFormat('before\n```\ncode\n```\nafter', {start: 11, end: 15}, 'code-block'),
        ).toEqual({
            value: 'before\ncode\nafter',
            selection: {start: 7, end: 11},
        });
    });
});

describe('applyLinkFormat', () => {
    test('wraps selection in a markdown link and selects the url', () => {
        expect(
            applyLinkFormat('visit docs', {start: 6, end: 10}, {url: 'https://example.com'}),
        ).toEqual({
            value: 'visit [docs](https://example.com)',
            selection: {start: 13, end: 32},
        });
    });

    test('uses "link" as the title when no text is selected', () => {
        expect(
            applyLinkFormat('visit ', {start: 6, end: 6}, {url: 'https://example.com'}),
        ).toEqual({
            value: 'visit [link](https://example.com)',
            selection: {start: 13, end: 32},
        });
    });

    test('defaults to https:// when no url is provided', () => {
        const result = applyLinkFormat('docs', {start: 0, end: 4}, {title: 'Documentation'});
        expect(result.value).toBe('[Documentation](https://)');
    });

    test('defaults both title and url when called with an empty payload', () => {
        const result = applyLinkFormat('', {start: 0, end: 0}, {});
        expect(result.value).toBe('[link](https://)');
    });
});

describe('applyTableFormat', () => {
    test('creates a deterministic markdown table template', () => {
        expect(createMarkdownTable({columns: 2, rows: 2})).toBe(
            '| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |\n| Value | Value |',
        );
    });

    test('inserts a table at the current cursor position', () => {
        expect(applyTableFormat('before\nafter', {start: 7, end: 7}, {columns: 1, rows: 1})).toEqual({
            value: 'before\n| Column 1 |\n| --- |\n| Value |after',
            selection: {start: 7, end: 37},
        });
    });

    test('defaults to 3 columns and 2 rows when no payload is given', () => {
        const result = applyTableFormat('', undefined);
        expect(result.value).toBe(
            '| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Value | Value | Value |\n| Value | Value | Value |',
        );
    });
});

describe('applyToolbarInsertAction', () => {
    test('inserts markdown and places cursor at the end by default', () => {
        expect(
            applyToolbarInsertAction('', {start: 0, end: 0}, {
                type: 'insert',
                markdown: 'hello',
            }),
        ).toEqual({value: 'hello', selection: {start: 5, end: 5}});
    });

    test('positions cursor using explicit selection offsets', () => {
        expect(
            applyToolbarInsertAction('', {start: 0, end: 0}, {
                type: 'insert',
                markdown: '::: warning\ntext\n:::',
                selectionStartOffset: 12,
                selectionEndOffset: 16,
            }),
        ).toEqual({
            value: '::: warning\ntext\n:::',
            selection: {start: 12, end: 16},
        });
    });
});

describe('applyToolbarWrapAction', () => {
    test('wraps selected text with prefix and suffix', () => {
        expect(
            applyToolbarWrapAction('hello world', {start: 6, end: 11}, {
                type: 'wrap',
                prefix: '**',
                suffix: '**',
            }),
        ).toEqual({value: 'hello **world**', selection: {start: 8, end: 13}});
    });

    test('uses prefix as suffix when suffix is omitted', () => {
        expect(
            applyToolbarWrapAction('text', {start: 0, end: 4}, {
                type: 'wrap',
                prefix: '`',
            }),
        ).toEqual({value: '`text`', selection: {start: 1, end: 5}});
    });

    test('inserts the placeholder text when no text is selected', () => {
        expect(
            applyToolbarWrapAction('', {start: 0, end: 0}, {
                type: 'wrap',
                prefix: '::: warning\n',
                suffix: '\n:::',
                placeholder: 'Warning text',
            }),
        ).toEqual({
            value: '::: warning\nWarning text\n:::',
            selection: {start: 12, end: 24},
        });
    });
});

describe('applyToolbarAction', () => {
    test('dispatches insert actions', () => {
        const result = applyToolbarAction('', {start: 0, end: 0}, {
            type: 'insert',
            markdown: 'foo',
        });
        expect(result.value).toBe('foo');
    });

    test('dispatches wrap actions', () => {
        const result = applyToolbarAction('bar', {start: 0, end: 3}, {
            type: 'wrap',
            prefix: '__',
        });
        expect(result.value).toBe('__bar__');
    });
});

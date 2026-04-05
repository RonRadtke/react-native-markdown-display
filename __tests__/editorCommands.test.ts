import {applyBlockFormat, applyInlineFormat, applyLinkFormat, applyTableFormat, createMarkdownTable, normalizeSelection,} from '../src';

describe('editor command utilities', () => {
    test('normalizes inverted selection bounds', () => {
        expect(normalizeSelection('hello', {start: 4, end: 1})).toEqual({
            start: 1,
            end: 4,
        });
    });

    test('wraps selected text with bold markers', () => {
        expect(applyInlineFormat('hello world', {start: 6, end: 11}, 'bold')).toEqual({
            value: 'hello **world**',
            selection: {start: 8, end: 13},
        });
    });

    test('wraps selected text with underline markers', () => {
        expect(applyInlineFormat('hello world', {start: 6, end: 11}, 'underline')).toEqual({
            value: 'hello ++world++',
            selection: {start: 8, end: 13},
        });
    });

    test('unwraps text when the selection is already inside inline markers', () => {
        expect(applyInlineFormat('hello **world**', {start: 8, end: 13}, 'bold')).toEqual({
            value: 'hello world',
            selection: {start: 6, end: 11},
        });
    });

    test('unwraps text when the selection is already inside underline markers', () => {
        expect(applyInlineFormat('hello ++world++', {start: 8, end: 13}, 'underline')).toEqual({
            value: 'hello world',
            selection: {start: 6, end: 11},
        });
    });

    test('applies heading prefixes across selected lines', () => {
        expect(
            applyBlockFormat('first line\nsecond line', {start: 0, end: 21}, 'heading-two'),
        ).toEqual({
            value: '## first line\n## second line',
            selection: {start: 0, end: 28},
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

    test('wraps selection in a markdown link and selects the url', () => {
        expect(
            applyLinkFormat('visit docs', {start: 6, end: 10}, {url: 'https://example.com'}),
        ).toEqual({
            value: 'visit [docs](https://example.com)',
            selection: {start: 13, end: 32},
        });
    });

    test('creates a deterministic markdown table template', () => {
        expect(createMarkdownTable({columns: 2, rows: 2})).toBe(
            '| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |\n| Value | Value |',
        );
    });

    test('inserts a table into the current selection', () => {
        expect(applyTableFormat('before\nafter', {start: 7, end: 7}, {columns: 1, rows: 1})).toEqual({
            value: 'before\n| Column 1 |\n| --- |\n| Value |after',
            selection: {start: 7, end: 37},
        });
    });
});

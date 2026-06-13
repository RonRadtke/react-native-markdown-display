import {applyMarkdownShortcut} from '../src';

describe('editor shortcut utilities', () => {
    test('continues - bullet lists on newline', () => {
        expect(
            applyMarkdownShortcut({
                nextValue: '- item\n',
                previousSelection: {start: 6, end: 6},
                previousValue: '- item',
            }),
        ).toEqual({
            value: '- item\n- ',
            selection: {start: 9, end: 9},
        });
    });

    test('continues + bullet lists on newline', () => {
        expect(
            applyMarkdownShortcut({
                nextValue: '+ item\n',
                previousSelection: {start: 6, end: 6},
                previousValue: '+ item',
            }),
        ).toEqual({
            value: '+ item\n+ ',
            selection: {start: 9, end: 9},
        });
    });

    test('continues * bullet lists on newline', () => {
        expect(
            applyMarkdownShortcut({
                nextValue: '* item\n',
                previousSelection: {start: 6, end: 6},
                previousValue: '* item',
            }),
        ).toEqual({
            value: '* item\n* ',
            selection: {start: 9, end: 9},
        });
    });

    test('increments ordered lists on newline', () => {
        expect(
            applyMarkdownShortcut({
                nextValue: '2. item\n',
                previousSelection: {start: 7, end: 7},
                previousValue: '2. item',
            }),
        ).toEqual({
            value: '2. item\n3. ',
            selection: {start: 11, end: 11},
        });
    });

    test('continues blockquote lines on newline', () => {
        expect(
            applyMarkdownShortcut({
                nextValue: '> quote\n',
                previousSelection: {start: 7, end: 7},
                previousValue: '> quote',
            }),
        ).toEqual({
            value: '> quote\n> ',
            selection: {start: 10, end: 10},
        });
    });

    test('exits empty bullet list markers on newline', () => {
        expect(
            applyMarkdownShortcut({
                nextValue: '- \n',
                previousSelection: {start: 2, end: 2},
                previousValue: '- ',
            }),
        ).toEqual({
            value: '\n',
            selection: {start: 1, end: 1},
        });
    });

    test('exits empty ordered list markers on newline', () => {
        expect(
            applyMarkdownShortcut({
                nextValue: '1. \n',
                previousSelection: {start: 3, end: 3},
                previousValue: '1. ',
            }),
        ).toEqual({
            value: '\n',
            selection: {start: 1, end: 1},
        });
    });

    test('exits empty blockquote markers on newline', () => {
        expect(
            applyMarkdownShortcut({
                nextValue: '> \n',
                previousSelection: {start: 2, end: 2},
                previousValue: '> ',
            }),
        ).toEqual({
            value: '\n',
            selection: {start: 1, end: 1},
        });
    });

    test('returns null when the change is not a newline insertion shortcut', () => {
        expect(
            applyMarkdownShortcut({
                nextValue: 'plain text',
                previousSelection: {start: 5, end: 5},
                previousValue: 'plain',
            }),
        ).toBeNull();
    });

    test('returns null when the previous selection is a range, not a collapsed cursor', () => {
        expect(
            applyMarkdownShortcut({
                nextValue: '- item\n',
                previousSelection: {start: 2, end: 6},
                previousValue: '- item',
            }),
        ).toBeNull();
    });

    test('returns null for a plain line with no list or quote prefix', () => {
        expect(
            applyMarkdownShortcut({
                nextValue: 'just text\n',
                previousSelection: {start: 9, end: 9},
                previousValue: 'just text',
            }),
        ).toBeNull();
    });
});

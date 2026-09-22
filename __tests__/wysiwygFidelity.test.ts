import MarkdownIt from 'markdown-it';
import ins from 'markdown-it-ins';

import {applyDisplayEdit, applyInlineFormatWysiwyg} from '../src/lib/editor/utils/wysiwygEdit';
import {buildWysiwygModel} from '../src/lib/editor/utils/wysiwygModel';

import type {MarkdownSelection} from '../src';

/**
 * Fidelity contract for an LLM chat input: whatever the user types or pastes
 * must reach `value` unchanged, and the editor must hide exactly the markers
 * the renderer consumes so the message bubble shows what the editor showed.
 */
const md = new MarkdownIt().use(ins);

const plainText = (source: string): string => {
    const out: string[] = [];
    const walk = (tokens: ReturnType<typeof md.parse>): void => {
        for (const token of tokens) {
            if (token.children) {
                walk(token.children);
            } else if (token.type === 'text' || token.type === 'code_inline' || token.type === 'fence' || token.type === 'code_block') {
                out.push(token.content);
            } else if (token.type === 'softbreak' || token.type === 'hardbreak') {
                out.push('\n');
            }
        }
    };

    walk(md.parse(source, {}));

    return out.join('');
};

/** Simulate typing one character at a time at the caret, as the editor component does. */
const typeText = (text: string, source = '', caret?: number): {caret: number; value: string} => {
    let value = source;
    let position = caret ?? buildWysiwygModel(value).display.length;
    let caretOutside = false;

    for (const character of text) {
        const display = buildWysiwygModel(value).display;
        const result = applyDisplayEdit(
            value,
            display.slice(0, position) + character + display.slice(position),
            {start: position, end: position},
            {caretOutside},
        );

        value = result.value;
        position = result.selection.start;
        caretOutside = result.caretOutside;
    }

    return {caret: position, value};
};

const pasteText = (text: string, source = ''): string => {
    const display = buildWysiwygModel(source).display;

    return applyDisplayEdit(source, display + text, {start: display.length, end: display.length}).value;
};

describe('typing fidelity', () => {
    test.each([
        'snake_case_name and other_var_name',
        'call my_func(a_b, c_d) please',
        '2 * 3 * 4 = 24',
        'use __init__ and __main__',
        'path C:\\Users\\ron\\my_file_name.txt',
        'https://example.com/a_b_c?x=1_2',
        'a*b*c',
        'rate is 5~~ish~~ ok',
        'C++ and D++ are languages',
        'x = a ** b ** c',
        'regex `a*b*` vs a*b*',
        'run `my_func(a_b)` now',
        'glob `**/*.ts` and `*.js`',
        'email me_at_home@x.com',
        'AT&T &#65; &amp; <b>html</b>',
        'for i in range(n): total += a_b * c_d * 2',
        '**bold** then plain',
        '**bold**, then plain',
        'say `code` and more',
        '👨‍👩‍👧‍👦 family 🇩🇪 😀*x*😀',
        'שלום *עולם* 你好**世界**',
    ])('typing %s keeps the value identical to the keystrokes', (text) => {
        const {value} = typeText(text);

        expect(value).toBe(text);
        expect(buildWysiwygModel(value).display).toBe(plainText(value));
    });

    test('typing markdown syntax converts it once the pair closes', () => {
        expect(typeText('some *emph* text').value).toBe('some *emph* text');
        expect(buildWysiwygModel('some *emph* text').display).toBe('some emph text');
        expect(typeText('**bo').value).toBe('**bo');
        expect(buildWysiwygModel('**bo').display).toBe('**bo');
    });

    test('typing after a code span continues outside it', () => {
        expect(typeText(' and more', 'say `code`').value).toBe('say `code` and more');
        expect(typeText('more', 'say `code`').value).toBe('say `code`more');
    });

    test('typing a space at the end of emphasis keeps the closing delimiter valid', () => {
        expect(typeText(' next', '**bold**').value).toBe('**bold** next');
        expect(typeText(' next', '_it_').value).toBe('_it_ next');
        expect(md.renderInline(typeText(' next', '**bold**').value)).toBe('<strong>bold</strong> next');
    });

    test('typing a letter before an underscore span switches the delimiter family', () => {
        const result = applyDisplayEdit('plain __bold__', 'plainx bold', {start: 5, end: 5});

        expect(result.value).toBe('plainx __bold__');
        expect(result.display).toBe('plainx bold');
        expect(applyDisplayEdit('a _b_', 'a yb', {start: 2, end: 2}).value).toBe('a y*b*');
    });

    test('typing a marker inside a span keeps the keystroke and shows the markdown result', () => {
        const single = applyDisplayEdit('**bold**', 'bo*ld', {start: 2, end: 2});

        expect(single.value).toBe('**bo*ld**');
        expect(single.display).toBe('bo*ld');
        expect(md.renderInline(single.value)).toBe('<strong>bo*ld</strong>');

        const closing = applyDisplayEdit('**bold**', 'bo**ld', {start: 2, end: 2});

        expect(closing.value).toBe('**bo**ld**');
        expect(closing.display).toBe(plainText(closing.value));
    });

    test('typing continues outside a span the previous keystroke closed', () => {
        expect(typeText('c', 'a*b*', 2).value).toBe('a*bc*');

        const closed = applyDisplayEdit('a*b', 'a*b*', {start: 3, end: 3});

        expect(closed.caretOutside).toBe(true);
        expect(applyDisplayEdit(closed.value, 'abc', closed.selection, {caretOutside: true}).value).toBe('a*b*c');
        expect(typeText('o', '**Hell**', 4).value).toBe('**Hello**');
    });
});

describe('paste fidelity', () => {
    test.each([
        'snake_case_name and other_var_name',
        'def my_func(a_b):\n    return a_b * 2 * a_b\n',
        'Traceback:\n  File "my_file.py", line 3, in my_func\n    x = some_var * other_var * 2',
        'Here is my code:\n```python\ndef my_func(a_b):\n    return a_b ** 2\n```\nwhy does it fail?',
        '| a | b |\n|---|---|\n| 1 | 2 |',
        '[link text](https://example.com/a_b_c) and ![img](x_y_z.png)',
        '  - nested item\n    - deeper *item*',
        '1) paren list\n10. ten\n',
        '***bold italic*** and **bold *nested* bold**',
        '# Title\r\n- item\r\n```\r\ncode_a_b * c * d\r\n```\r\n',
    ])('pasting %s keeps the value identical', (text) => {
        expect(pasteText(text)).toBe(text);
    });

    test('pasted code and identifiers stay visible verbatim', () => {
        const display = buildWysiwygModel(pasteText('def my_func(a_b):\n    return a_b * 2 * a_b\n')).display;

        expect(display).toBe('def my_func(a_b):\n    return a_b * 2 * a_b\n');
    });

    test('pasting into the middle of a span keeps the surrounding formatting', () => {
        const result = applyDisplayEdit('**bold** end', 'boX\nYld end', {start: 2, end: 2});

        expect(result.value).toBe('**boX**\n**Yld** end');
        expect(result.display).toBe('boX\nYld end');
    });

    test('recognises fences with Windows line endings', () => {
        const model = buildWysiwygModel('```\r\na_b * c * d\r\n```\r\n');

        expect(model.display).toBe('```\r\na_b * c * d\r\n```\r\n');
        expect(model.spans).toHaveLength(0);
    });
});

describe('untouched text', () => {
    const seed = 'keep my_var_name and 2 * 3 * 4\nsecond **bold** line\n- item _x_\n```\ncode * a_b *\n```';

    test.each(['x', ' ', '*', '_', '`', '\n', '😀', 'a_b'])('inserting %j anywhere leaves other lines byte-identical', (inserted) => {
        const model = buildWysiwygModel(seed);
        const lines = seed.split('\n');

        for (let at = 0; at <= model.display.length; at += 1) {
            const next = model.display.slice(0, at) + inserted + model.display.slice(at);
            const result = applyDisplayEdit(seed, next, {start: at, end: at});
            const lineIndex = model.display.slice(0, at).split('\n').length - 1;
            const resultLines = result.value.split('\n');

            expect(resultLines.slice(0, lineIndex)).toEqual(lines.slice(0, lineIndex));
            expect(resultLines.slice(resultLines.length - (lines.length - lineIndex - 1))).toEqual(lines.slice(lineIndex + 1));
            expect(buildWysiwygModel(result.value).display).toBe(result.display);
        }
    });

    test('backspace at every position never throws and keeps other lines', () => {
        const model = buildWysiwygModel(seed);
        const lines = seed.split('\n');

        for (let at = 1; at <= model.display.length; at += 1) {
            const next = model.display.slice(0, at - 1) + model.display.slice(at);
            const result = applyDisplayEdit(seed, next, {start: at, end: at});
            const lineIndex = model.display.slice(0, at - 1).split('\n').length - 1;
            const removedNewline = model.display[at - 1] === '\n';
            const resultLines = result.value.split('\n');

            expect(resultLines.slice(0, lineIndex)).toEqual(lines.slice(0, lineIndex));

            if (!removedNewline) {
                expect(resultLines.slice(lineIndex + 1)).toEqual(lines.slice(lineIndex + 1));
            }
        }
    });

    test('a toolbar toggle never splits a surrogate pair', () => {
        expect(applyInlineFormatWysiwyg('hi 😀 there', {start: 3, end: 4}, 'bold').value).toBe('hi **😀** there');
        expect(applyInlineFormatWysiwyg('hi 😀 there', {start: 3, end: 5}, 'bold').value).toBe('hi **😀** there');
    });

    test('a toolbar toggle only rewrites the selected line', () => {
        const source = 'keep my_var_name * here\nmake **this** bold\nand 2 * 3 * 4 stays';
        const display = buildWysiwygModel(source).display;
        const start = display.indexOf('bold');
        const result = applyInlineFormatWysiwyg(source, {start, end: start + 4}, 'italic');

        expect(result.value).toBe('keep my_var_name * here\nmake **this** _bold_\nand 2 * 3 * 4 stays');
    });
});

describe('enter key', () => {
    const enter = (source: string, caret: number): {display: string; selection: MarkdownSelection; value: string} => {
        const display = buildWysiwygModel(source).display;

        return applyDisplayEdit(source, display.slice(0, caret) + '\n' + display.slice(caret), {start: caret, end: caret});
    };

    test('continues bullet, ordered and nested lists', () => {
        expect(enter('- first', 7)).toMatchObject({display: '• first\n• ', value: '- first\n- '});
        expect(enter('1. first', 8)).toMatchObject({display: '1. first\n2. ', selection: {start: 12, end: 12}, value: '1. first\n2. '});
        expect(enter('  * deep', 8).value).toBe('  * deep\n  * ');
        expect(enter('3) paren', 8).value).toBe('3) paren\n4) ');
    });

    test('continues quotes and leaves an empty item', () => {
        expect(enter('> quote', 7).value).toBe('> quote\n> ');
        expect(enter('- ', 2)).toMatchObject({display: '', selection: {start: 0, end: 0}, value: ''});
        expect(enter('1. a\n2. ', 8)).toMatchObject({value: '1. a\n', selection: {start: 5, end: 5}});
        expect(enter('> ', 2).value).toBe('');
    });

    test('splits an item and keeps inline formatting on both sides', () => {
        expect(enter('- a **bc** d', 5)).toMatchObject({display: '• a b\n• c d', value: '- a **b**\n- **c** d'});
    });

    test('does not continue headings or plain lines', () => {
        expect(enter('# Title', 5).value).toBe('# Title\n');
        expect(enter('plain', 5).value).toBe('plain\n');
    });
});

import MarkdownIt from 'markdown-it';
import {
    applyDisplayEdit,
    applyInlineFormatWysiwyg,
    buildWysiwygModel,
    cleanEmptyMarkers,
    displaySelectionToSource,
    sourceOffsetToDisplay,
} from '../src/lib/editor/utils/wysiwygModel';

describe('buildWysiwygModel', () => {
    test('hides inline markers and exposes display text', () => {
        const model = buildWysiwygModel('**Hello** _world_');

        expect(model.display).toBe('Hello world');
    });

    test('tracks the source index of every display character', () => {
        const model = buildWysiwygModel('**Hi**');

        // Display "Hi": H -> source index 2, i -> source index 3.
        expect(model.charSource).toEqual([2, 3]);
    });

    test('groups display characters into formatted segments', () => {
        const model = buildWysiwygModel('**Hello** world');

        expect(model.segments).toEqual([
            {block: null, formats: ['bold'], synthetic: false, text: 'Hello'},
            {block: null, formats: [], synthetic: false, text: ' world'},
        ]);
    });

    test('nests formats', () => {
        const model = buildWysiwygModel('**_both_**');

        expect(model.display).toBe('both');
        expect(model.segments[0]?.formats.sort()).toEqual(['bold', 'italic']);
    });

    test('treats code spans as literal content', () => {
        const model = buildWysiwygModel('`a*b*c`');

        expect(model.display).toBe('a*b*c');
        expect(model.segments).toEqual([
            {block: null, formats: ['inline-code'], synthetic: false, text: 'a*b*c'},
        ]);
    });

    test('keeps unbalanced markers as literal text', () => {
        const model = buildWysiwygModel('a ** b');

        expect(model.display).toBe('a ** b');
    });

    test('does not let inline markers span across lines', () => {
        const model = buildWysiwygModel('a **b\nc** d');

        expect(model.display).toBe('a **b\nc** d');
    });
});

describe('block markers', () => {
    test('hides heading markers and styles the line', () => {
        const model = buildWysiwygModel('## Title');

        expect(model.display).toBe('Title');
        expect(model.segments).toEqual([
            {block: 'heading-two', formats: [], synthetic: false, text: 'Title'},
        ]);
    });

    test('renders a synthetic bullet for unordered lists', () => {
        const model = buildWysiwygModel('- Item');

        expect(model.display).toBe('• Item');
        expect(model.segments).toEqual([
            {block: 'list-marker', formats: [], synthetic: true, text: '• '},
            {block: null, formats: [], synthetic: false, text: 'Item'},
        ]);
    });

    test('renders the ordinal for ordered lists', () => {
        const model = buildWysiwygModel('3. Item');

        expect(model.display).toBe('3. Item');
        expect(model.segments[0]).toEqual({
            block: 'list-marker',
            formats: [],
            synthetic: true,
            text: '3. ',
        });
    });

    test('keeps inline formatting inside a heading', () => {
        const model = buildWysiwygModel('# A **B**');

        expect(model.display).toBe('A B');
        expect(model.segments).toEqual([
            {block: 'heading-one', formats: [], synthetic: false, text: 'A '},
            {block: 'heading-one', formats: ['bold'], synthetic: false, text: 'B'},
        ]);
    });

    test('handles multi-line documents with mixed blocks', () => {
        const model = buildWysiwygModel('# Title\n- one\n- two');

        expect(model.display).toBe('Title\n• one\n• two');
    });
});

describe('offset mapping', () => {
    test('clamps an outdated display range before source mapping', () => {
        expect(displaySelectionToSource(buildWysiwygModel('Hi'), {start: 2, end: 8})).toEqual({start: 2, end: 2});
        expect(displaySelectionToSource(buildWysiwygModel('**Hi**'), {start: -5, end: 8})).toEqual({start: 2, end: 4});
    });
    test('maps a display selection back to the source range', () => {
        const model = buildWysiwygModel('**Hello** world');

        // Select "Hello" in display coords [0, 5].
        expect(displaySelectionToSource(model, {end: 5, start: 0})).toEqual({
            end: 7,
            start: 2,
        });
    });

    test('maps a source offset to a display offset', () => {
        const model = buildWysiwygModel('**Hello**');

        // Source offset 7 sits just after the last visible char.
        expect(sourceOffsetToDisplay(model, 7)).toBe(5);
        expect(sourceOffsetToDisplay(model, 2)).toBe(0);
    });
});

describe('cleanEmptyMarkers', () => {
    test('removes empty marker pairs', () => {
        expect(cleanEmptyMarkers('****')).toBe('');
        expect(cleanEmptyMarkers('**_++~~~~++_**')).toBe('');
    });

    test.each([
        '`a****b`',
        '``a`****`b``',
        '```js\na****b\n```',
        '~~~~\na++++b\n~~~~',
        '__bold__',
        'a__b',
        '``',
    ])('preserves literal content and nonempty formatting in %s', (source) => {
        expect(cleanEmptyMarkers(source)).toBe(source);
    });
});

describe('applyDisplayEdit', () => {
    test.each([
        ['**Hello**', 'Hello ', 5, '<strong>Hello</strong> '],
        ['**`ab`**&#99;d', 'abxd', 2, '<strong><code>ab</code></strong>xd'],
        ['**`ab`**&#99;d', 'abd', 3, '<strong><code>ab</code></strong>d'],
    ] as const)('keeps valid emphasis after a boundary edit in %s', (source, display, caret, html) => {
        const result = applyDisplayEdit(source, display, {start: caret, end: caret});
        expect(result.display).toBe(display);
        expect(new MarkdownIt().renderInline(result.value)).toBe(html);
    });
    test.each([
        ['```js\na*b\n```', 8, '```js\na*\nb\n```'],
        ['[Hello](test)', 1, '[\nHello](test)'],
        ['\nHello', 0, '\n\nHello'],
    ] as const)('preserves literal syntax when inserting a newline in %s', (source, caret, expected) => {
        const model = buildWysiwygModel(source);
        const result = applyDisplayEdit(source, model.display.slice(0, caret) + '\n' + model.display.slice(caret), {start: caret, end: caret});
        expect(result.value).toBe(expected);
        expect(result.display).toBe(expected);
    });
    test.each([
        ['**Hello**', 5, 'Hello\n', '**Hello**\n'],
        ['**Hello**', 3, 'Hel\nlo', '**Hel**\n**lo**'],
        ['**_Hello_**', 3, 'Hel\nlo', '**_Hel_**\n**_lo_**'],
        ['`Hello`', 3, 'Hel\nlo', '`Hel`\n`lo`'],
        ['# **Hello**', 3, 'Hel\nlo', '# **Hel**\n**lo**'],
    ] as const)('keeps newlines outside inline markers in %s', (source, caret, display, expected) => {
        const result = applyDisplayEdit(source, display, {start: caret, end: caret});
        expect(result.value).toBe(expected);
        expect(result.display).toBe(display);
        expect(result.selection).toEqual({start: caret + 1, end: caret + 1});
    });

    test.each([
        ['Hello\n# World', 6, 'HelloWorld', 'HelloWorld', 'HelloWorld'],
        ['# One\n# Two', 4, 'OneTwo', '# OneTwo', 'OneTwo'],
        ['- One\n- Two', 6, '• One• Two', '- OneTwo', '• OneTwo'],
        ['1. One\n2. Two', 7, '1. One2. Two', '1. OneTwo', '1. OneTwo'],
    ] as const)('removes the second block prefix when joining %s', (source, caret, nextDisplay, expected, display) => {
        const result = applyDisplayEdit(source, nextDisplay, {start: caret, end: caret});
        expect(result.value).toBe(expected);
        expect(result.display).toBe(display);
    });
    test.each([
        '`a****b` end',
        '``a`****`b`` end',
        '```js\na****b\n```\nend',
        '~~~~\na++++b\n~~~~\nend',
        '__bold__ end',
        'a__b end',
        '**** end',
    ])('preserves untouched syntax when appending to %s', (source) => {
        const display = buildWysiwygModel(source).display;
        const result = applyDisplayEdit(source, `${display}!`);

        expect(result.value).toBe(`${source}!`);
        expect(result.display).toBe(`${display}!`);
    });

    test.each([
        ['**Hello** world', 'Held', '**Hel**d'],
        ['Hello **world**', 'Held', 'Hel**d**'],
        ['**ab** _cd_', 'ad', '**a**_d_'],
        ['**a _bc_ d**', 'ad', '**ad**'],
        ['**ab** _cd_', '', ''],
        ['**_Hi_**', '', ''],
        ['`a****b`', '', ''],
        ['` a `', '', ''],
        ['`` ` ``', '', ''],
    ])('preserves delimiter pairs when deleting from %s', (source, display, expected) => {
        const result = applyDisplayEdit(source, display);

        expect(result.value).toBe(expected);
        expect(result.display).toBe(display);
    });

    test('replaces a selection across formatting boundaries', () => {
        const result = applyDisplayEdit('**Hello** world', 'HeXd', {start: 2, end: 10});

        expect(result.value).toBe('**HeX**d');
        expect(result.display).toBe('HeXd');
        expect(result.selection).toEqual({start: 3, end: 3});
    });

    test.each([
        ['**a** **b**', '**ab**'],
        ['_a_ _b_', '_ab_'],
        ['++a++ ++b++', '++ab++'],
        ['`a` `b`', '`ab`'],
    ])('joins matching spans when deleting the gap in %s', (source, expected) => {
        const result = applyDisplayEdit(source, 'ab', {start: 1, end: 2});

        expect(result.value).toBe(expected);
        expect(result.display).toBe('ab');
        expect(result.selection).toEqual({start: 1, end: 1});
    });

    test.each([
        {start: 0, end: 1},
        {start: 2, end: 6},
        {start: 7, end: 8},
    ])('keeps literal backticks when deleting within code: $start–$end', (selection) => {
        const source = '``a`****`b`` end';
        const display = buildWysiwygModel(source).display;
        const expected = display.slice(0, selection.start) + display.slice(selection.end);
        const result = applyDisplayEdit(source, expected, selection);

        expect(result.display).toBe(expected);
        expect(result.selection).toEqual({start: selection.start, end: selection.start});
    });

    test.each([
        {selection: {start: 0, end: 1}, expected: '**a**', caret: 0},
        {selection: {start: 1, end: 1}, expected: '**a**', caret: 0},
        {selection: {start: 0, end: 0}, expected: '**a**', caret: 0},
        {selection: {start: 1, end: 2}, expected: 'a', caret: 1},
        {selection: {start: 2, end: 2}, expected: 'a', caret: 1},
    ])('uses the previous selection to delete repeated characters: $selection', ({selection, expected, caret}) => {
        const result = applyDisplayEdit('a**a**', 'a', selection);

        expect(result.value).toBe(expected);
        expect(result.selection).toEqual({start: caret, end: caret});
    });

    test('uses the caret to insert a repeated character into the correct span', () => {
        const result = applyDisplayEdit('a**a**', 'aaa', {start: 0, end: 0});

        expect(result.value).toBe('aa**a**');
        expect(result.selection).toEqual({start: 1, end: 1});
    });

    test('falls back to the text diff when an edit does not match the previous selection', () => {
        const result = applyDisplayEdit('**teh** end', 'the end', {start: 7, end: 7});

        expect(result.value).toBe('**the** end');
        expect(result.display).toBe('the end');
    });

    test('keeps the source and selection on an unchanged native text event', () => {
        const result = applyDisplayEdit('`a****b`', 'a****b', {start: 2, end: 2});

        expect(result.value).toBe('`a****b`');
        expect(result.selection).toEqual({start: 2, end: 2});
    });

    test('inserts a typed character inside a bold span keeping it bold', () => {
        // Display "Hello", caret after "Hell" -> type "o" already there; insert "!"
        const result = applyDisplayEdit('**Hello**', 'Hello!');

        expect(result.value).toBe('**Hello!**');
        expect(result.display).toBe('Hello!');
        expect(result.selection).toEqual({end: 6, start: 6});
    });

    test('deleting the last visible character keeps the closing markers', () => {
        const result = applyDisplayEdit('**Hello**', 'Hell');

        expect(result.value).toBe('**Hell**');
        expect(result.display).toBe('Hell');
    });

    test('clearing all bold text removes the now empty markers', () => {
        const result = applyDisplayEdit('**Hi**', '');

        expect(result.value).toBe('');
        expect(result.display).toBe('');
    });

    test('appending at the end of a span inherits its formatting', () => {
        const result = applyDisplayEdit('**Hello**', 'Hello world');

        expect(result.value).toBe('**Hello world**');
    });

    test('typing inside a list item keeps the marker', () => {
        // Display "• Item" -> insert "s" after "Item".
        const result = applyDisplayEdit('- Item', '• Items');

        expect(result.value).toBe('- Items');
        expect(result.display).toBe('• Items');
    });

    test('deleting the synthetic bullet removes the whole list marker', () => {
        // Backspace the bullet space: display "• Item" -> "•Item".
        const result = applyDisplayEdit('- Item', '•Item');

        expect(result.value).toBe('Item');
        expect(result.display).toBe('Item');
    });

    test('typing inside a heading keeps it hidden', () => {
        const result = applyDisplayEdit('## Title', 'Titles');

        expect(result.value).toBe('## Titles');
        expect(result.display).toBe('Titles');
    });
});

describe('applyInlineFormatWysiwyg', () => {
    test.each([
        ['Hello', 1, 4, 'italic', 'H<em>ell</em>o'],
        [' Hello ', 0, 7, 'bold', ' <strong>Hello</strong> '],
        ['**Hello**', 2, 4, 'bold', '<strong>He</strong>ll<strong>o</strong>'],
        ['**Hello** world', 2, 8, 'italic', '<strong>He<em>llo</em></strong> <em>wo</em>rld'],
        ['**Hello** world', 0, 6, 'bold', 'Hello world'],
        ['**_abcd_**', 1, 2, 'italic', '<strong><em>a</em>b<em>cd</em></strong>'],
        ['**ab**cd', 1, 3, 'italic', '<strong>a<em>b</em></strong><em>c</em>d'],
        ['ab**cd**', 1, 3, 'italic', 'a<em>b</em><strong><em>c</em>d</strong>'],
        ['**ab**cd', 0, 2, 'inline-code', '<strong><code>ab</code></strong>cd'],
        ['ab**cd**', 2, 4, 'inline-code', 'ab<strong><code>cd</code></strong>'],
        ['**ab**é文', 0, 2, 'inline-code', '<strong><code>ab</code></strong>é文'],
    ] as const)('serializes emphasis at word and whitespace boundaries in %s', (source, start, end, format, expected) => {
        const result = applyInlineFormatWysiwyg(source, {start, end}, format);
        expect(result.display).toBe(buildWysiwygModel(source).display);
        expect(new MarkdownIt().renderInline(result.value)).toBe(expected);
    });
    test.each([
        ['__Hello__', 'bold', 'Hello', 'Hello'],
        ['**_Hi_**', 'bold', '_Hi_', '<em>Hi</em>'],
        ['**_Hi_**', 'italic', '**Hi**', '<strong>Hi</strong>'],
        ['``a`b``', 'inline-code', 'a\\`b', 'a`b'],
        ['`Hi`', 'bold', '**`Hi`**', '<strong><code>Hi</code></strong>'],
    ] as const)('toggles parsed formatting in %s', (source, format, expected, html) => {
        const display = buildWysiwygModel(source).display;
        const result = applyInlineFormatWysiwyg(source, {start: 0, end: display.length}, format);
        expect(result.value).toBe(expected);
        expect(result.display).toBe(display);
        expect(new MarkdownIt().renderInline(result.value)).toBe(html);
    });

    test.each([
        ['- Item', '- **Item**', '• Item'],
        ['3. Item', '3. **Item**', '3. Item'],
        ['# Title\n- Item', '# **Title**\n- **Item**', 'Title\n• Item'],
    ])('keeps block markers outside a whole-display inline selection in %s', (source, expected, display) => {
        const result = applyInlineFormatWysiwyg(source, {start: 0, end: display.length}, 'bold');
        expect(result.value).toBe(expected);
        expect(result.display).toBe(display);
    });
    test('wraps the selected display text and selects it in display coords', () => {
        const result = applyInlineFormatWysiwyg('Hello', {end: 5, start: 0}, 'bold');

        expect(result.value).toBe('**Hello**');
        expect(result.display).toBe('Hello');
        expect(result.selection).toEqual({end: 5, start: 0});
    });

    test('toggles an existing format off', () => {
        const result = applyInlineFormatWysiwyg('**Hello**', {end: 5, start: 0}, 'bold');

        expect(result.value).toBe('Hello');
        expect(result.display).toBe('Hello');
    });
});

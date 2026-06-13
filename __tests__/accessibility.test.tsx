import React from 'react';
import renderer, {type ReactTestRenderer} from 'react-test-renderer';

import Markdown, {createMarkdownIt, MarkdownComposer, MarkdownTextInput} from '../src';

const COMPLEX_MARKDOWN_VALUE = [
    '# Accessible title',
    '',
    'Paragraph with **bold**, _italic_, ++underline++, ~~strikethrough~~, `inline code`, and [Docs](https://example.com/docs).',
    '',
    '> Quoted text with a [reference](https://example.com/reference).',
    '',
    '- Bullet item one',
    '- Bullet item two',
    '',
    '1. Ordered item one',
    '2. Ordered item two',
    '',
    '| Feature | Status |',
    '| --- | --- |',
    '| Links | [Docs](https://example.com/table) |',
    '| Code | `const value = 1;` |',
    '',
    '```',
    'const answer = 42;',
    '```',
    '',
    '[![Example image](https://example.com/image.png)](https://example.com/image-target)',
].join('\n');

const COMPLEX_EDITOR_VALUE = [
    '## Draft response',
    '',
    'Review docs before sending.',
    '',
    '- Add examples',
    '- Check quotes',
    '',
    '1. Confirm tables',
    '2. Confirm code blocks',
    '',
    '| Item | Status |',
    '| --- | --- |',
    '| Accessibility | pending |',
].join('\n');

const getSelectionForSubstring = (
    value: string,
    substring: string,
): {end: number; start: number} => {
    const start = value.indexOf(substring);

    if (start === -1) {
        throw new Error(`Failed to find substring: ${substring}`);
    }

    return {
        end: start + substring.length,
        start,
    };
};

const DOCS_SELECTION = getSelectionForSubstring(COMPLEX_EDITOR_VALUE, 'docs');

const renderTree = (element: React.ReactElement): ReactTestRenderer => {
    let tree: ReactTestRenderer | undefined;

    renderer.act(() => {
        tree = renderer.create(element);
    });

    if (!tree) {
        throw new Error('Failed to render test tree');
    }

    return tree;
};

const findPressableByAccessibilityLabel = (
    tree: ReactTestRenderer,
    label: string,
): renderer.ReactTestInstance => {
    const button = tree.root.findAll(
        (node) =>
            typeof node.props.onPress === 'function' &&
            node.props.accessibilityLabel === label,
    )[0];

    if (!button) {
        throw new Error(
            `Failed to find pressable with accessibility label: ${label}`,
        );
    }

    return button;
};

describe('accessibility', () => {
    test('renders complex markdown accessibly', () => {
        const tree = renderTree(
            <Markdown markdownit={createMarkdownIt({underline: true})}>
                {COMPLEX_MARKDOWN_VALUE}
            </Markdown>,
        );

        expect(tree.root).toBeAccessible();
    });

    test('renders the markdown text input accessibly', () => {
        const tree = renderTree(
            <MarkdownTextInput
                onChangeText={() => {}}
                placeholder="Write a markdown message"
                value={COMPLEX_EDITOR_VALUE}
            />,
        );

        expect(tree.root).toBeAccessible();
    });

    test('renders the markdown composer accessibly in expanded mode', () => {
        const tree = renderTree(
            <MarkdownComposer
                initialMode="expanded"
                onChangeText={() => {}}
                previewEnabled
                previewProps={{markdownit: createMarkdownIt({underline: true})}}
                value={COMPLEX_MARKDOWN_VALUE}
            />,
        );

        renderer.act(() => {
            findPressableByAccessibilityLabel(tree, 'Show preview').props.onPress();
        });

        expect(tree.root).toBeAccessible();
    });

    test('renders the built-in composer link prompt accessibly', async () => {
        const tree = renderTree(
            <MarkdownComposer
                onChangeText={() => {}}
                selection={DOCS_SELECTION}
                value={COMPLEX_EDITOR_VALUE}
            />,
        );

        await renderer.act(async () => {
            findPressableByAccessibilityLabel(tree, 'Insert link').props.onPress();
            await Promise.resolve();
        });

        expect(tree.root).toBeAccessible();
    });
});

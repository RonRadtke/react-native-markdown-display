import React from 'react';
import renderer, {type ReactTestRenderer} from 'react-test-renderer';

import Markdown, {MarkdownComposer, MarkdownTextInput} from '../src';

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

const findPressableByText = (
    tree: ReactTestRenderer,
    label: string,
): renderer.ReactTestInstance => {
    const button = tree.root.findAll((node) => {
        if (typeof node.props.onPress !== 'function') {
            return false;
        }

        return (
            node.findAll((childNode) => childNode.props.children === label).length > 0
        );
    })[0];

    if (!button) {
        throw new Error(`Failed to find pressable with label: ${label}`);
    }

    return button;
};

describe('accessibility', () => {
    test('renders block links accessibly', () => {
        const tree = renderTree(
            <Markdown>
                {
                    '[![Example image](https://example.com/image.png)](https://example.com)'
                }
            </Markdown>,
        );

        expect(tree.root).toBeAccessible();
    });

    test('renders the markdown text input accessibly', () => {
        const tree = renderTree(
            <MarkdownTextInput
                onChangeText={() => {}}
                placeholder="Write a markdown message"
                value="Hello **world**"
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
                value="# Accessible title"
            />,
        );

        expect(tree.root).toBeAccessible();
    });

    test('renders the built-in composer link prompt accessibly', async () => {
        const tree = renderTree(
            <MarkdownComposer
                onChangeText={() => {}}
                selection={{start: 0, end: 4}}
                value="docs"
            />,
        );

        await renderer.act(async () => {
            findPressableByText(tree, 'Link').props.onPress();
            await Promise.resolve();
        });

        expect(tree.root).toBeAccessible();
    });
});

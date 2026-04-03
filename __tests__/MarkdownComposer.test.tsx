import React from 'react';
import renderer from 'react-test-renderer';
import {Text, TextInput} from 'react-native';

import {MarkdownComposer} from '../src';

const findPressableByLabel = (
    tree: renderer.ReactTestRenderer,
    label: string,
): renderer.ReactTestInstance => {
    const match = tree.root.findAll((node) => {
        if (typeof node.props.onPress !== 'function') {
            return false;
        }

        return node.findAllByType(Text).some((textNode) => textNode.props.children === label);
    })[0];

    if (!match) {
        throw new Error(`Failed to find button with label: ${label}`);
    }

    return match;
};

describe('MarkdownComposer', () => {
    test('toggles between compact and expanded mode', () => {
        const onModeChange = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    onChangeText={() => {}}
                    onModeChange={onModeChange}
                    value=""
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer');
        }

        const buttons = tree.root.findAll(
            (node) => typeof node.props.onPress === 'function',
        );
        const button = buttons[buttons.length - 1];

        if (!button) {
            throw new Error('Failed to locate expand button');
        }

        renderer.act(() => {
            button.props.onPress();
        });

        expect(onModeChange).toHaveBeenCalledWith('expanded');
        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'Collapse'),
        ).toBe(true);
    });

    test('keeps preview hidden by default in expanded mode', () => {
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    initialMode="expanded"
                    onChangeText={() => {}}
                    previewEnabled
                    value="# Title"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer preview');
        }

        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'Preview'),
        ).toBe(false);
        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'Show preview'),
        ).toBe(true);
        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'Title'),
        ).toBe(false);
    });

    test('uses the minimized toolbar items prop in compact mode', () => {
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    minimizedToolbarItems={[{command: 'inline-code', label: '</>'}]}
                    onChangeText={() => {}}
                    value=""
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer minimized toolbar');
        }

        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === '</>'),
        ).toBe(true);
        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'B'),
        ).toBe(false);
    });

    test('hides the compact toolbar row when no minimized toolbar items are provided', () => {
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    minimizedToolbarItems={[]}
                    onChangeText={() => {}}
                    value=""
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer without toolbar');
        }

        expect(
            tree.root.findAll((node) => typeof node.props.onPress === 'function'),
        ).toHaveLength(1);
        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'B'),
        ).toBe(false);
        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'I'),
        ).toBe(false);
    });

    test('uses a single-row multiline input in compact mode and a taller input when expanded', () => {
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer onChangeText={() => {}} value=""/>);
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer sizing');
        }

        const compactInput = tree.root.findByType(TextInput);

        expect(compactInput.props.multiline).toBe(true);
        expect(compactInput.props.numberOfLines).toBe(1);

        const buttons = tree.root.findAll(
            (node) => typeof node.props.onPress === 'function',
        );
        const expandButton = buttons[buttons.length - 1];

        if (!expandButton) {
            throw new Error('Failed to locate expand button');
        }

        renderer.act(() => {
            expandButton.props.onPress();
        });

        const expandedInput = tree.root.findByType(TextInput);

        expect(expandedInput.props.numberOfLines).toBe(8);
    });

    test('opens the built-in link prompt and applies the entered values', async () => {
        const onChangeText = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    onChangeText={onChangeText}
                    selection={{start: 0, end: 4}}
                    value="docs"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer link prompt');
        }

        await renderer.act(async () => {
            findPressableByLabel(tree, 'Link').props.onPress();
            await Promise.resolve();
        });

        const promptInputs = tree.root.findAllByType(TextInput).slice(1);

        renderer.act(() => {
            promptInputs[0]?.props.onChangeText('Docs');
            promptInputs[1]?.props.onChangeText('https://example.com');
        });

        await renderer.act(async () => {
            findPressableByLabel(tree, 'Apply').props.onPress();
            await Promise.resolve();
        });

        expect(onChangeText).toHaveBeenCalledWith('[Docs](https://example.com)');
    });

    test('normalizes bare domains in the built-in link prompt', async () => {
        const onChangeText = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    onChangeText={onChangeText}
                    selection={{start: 0, end: 4}}
                    value="docs"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer domain normalization');
        }

        await renderer.act(async () => {
            findPressableByLabel(tree, 'Link').props.onPress();
            await Promise.resolve();
        });

        const promptInputs = tree.root.findAllByType(TextInput).slice(1);

        renderer.act(() => {
            promptInputs[1]?.props.onChangeText('example.com/docs');
        });

        await renderer.act(async () => {
            findPressableByLabel(tree, 'Apply').props.onPress();
            await Promise.resolve();
        });

        expect(onChangeText).toHaveBeenCalledWith('[docs](https://example.com/docs)');
    });

    test('opens the built-in table prompt and inserts a configured table', async () => {
        const onChangeText = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    initialMode="expanded"
                    onChangeText={onChangeText}
                    value=""
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer table prompt');
        }

        await renderer.act(async () => {
            findPressableByLabel(tree, 'Table').props.onPress();
            await Promise.resolve();
        });

        const promptInputs = tree.root.findAllByType(TextInput).slice(1);

        renderer.act(() => {
            promptInputs[0]?.props.onChangeText('2');
            promptInputs[1]?.props.onChangeText('1');
        });

        await renderer.act(async () => {
            findPressableByLabel(tree, 'Apply').props.onPress();
            await Promise.resolve();
        });

        expect(onChangeText).toHaveBeenCalledWith(
            '| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |',
        );
    });

    test('applies strikethrough from the expanded toolbar', async () => {
        const onChangeText = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    initialMode="expanded"
                    onChangeText={onChangeText}
                    selection={{start: 0, end: 4}}
                    value="docs"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer strikethrough');
        }

        await renderer.act(async () => {
            findPressableByLabel(tree, 'S').props.onPress();
            await Promise.resolve();
        });

        expect(onChangeText).toHaveBeenCalledWith('~~docs~~');
    });

    test('applies ordered lists from the expanded toolbar', async () => {
        const onChangeText = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    initialMode="expanded"
                    onChangeText={onChangeText}
                    selection={{start: 0, end: 5}}
                    value="first"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer ordered list');
        }

        await renderer.act(async () => {
            findPressableByLabel(tree, '1.').props.onPress();
            await Promise.resolve();
        });

        expect(onChangeText).toHaveBeenCalledWith('1. first');
    });

    test('shows heading options in an expanded toolbar submenu', () => {
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    initialMode="expanded"
                    onChangeText={() => {}}
                    value=""
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer heading submenu');
        }

        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'H'),
        ).toBe(true);
        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'H3'),
        ).toBe(false);

        renderer.act(() => {
            findPressableByLabel(tree, 'H').props.onPress();
        });

        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'H1'),
        ).toBe(true);
        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'H2'),
        ).toBe(true);
        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'H3'),
        ).toBe(true);
    });

    test('applies heading one from the expanded toolbar submenu', async () => {
        const onChangeText = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    initialMode="expanded"
                    onChangeText={onChangeText}
                    selection={{start: 0, end: 5}}
                    value="Title"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer heading one');
        }

        await renderer.act(async () => {
            findPressableByLabel(tree, 'H').props.onPress();
        });

        await renderer.act(async () => {
            findPressableByLabel(tree, 'H1').props.onPress();
            await Promise.resolve();
        });

        expect(onChangeText).toHaveBeenCalledWith('# Title');
        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'H1'),
        ).toBe(false);
    });

    test('applies block quotes from the expanded toolbar', async () => {
        const onChangeText = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    initialMode="expanded"
                    onChangeText={onChangeText}
                    selection={{start: 0, end: 4}}
                    value="docs"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer block quote');
        }

        await renderer.act(async () => {
            findPressableByLabel(tree, 'Quote').props.onPress();
            await Promise.resolve();
        });

        expect(onChangeText).toHaveBeenCalledWith('> docs');
    });

    test('applies inline code from the expanded toolbar', async () => {
        const onChangeText = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    initialMode="expanded"
                    onChangeText={onChangeText}
                    selection={{start: 0, end: 4}}
                    value="docs"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer inline code');
        }

        await renderer.act(async () => {
            findPressableByLabel(tree, '</>').props.onPress();
            await Promise.resolve();
        });

        expect(onChangeText).toHaveBeenCalledWith('`docs`');
    });

    test('blocks invalid link prompt values until corrected', async () => {
        const onChangeText = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    onChangeText={onChangeText}
                    selection={{start: 0, end: 4}}
                    value="docs"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer invalid link state');
        }

        await renderer.act(async () => {
            findPressableByLabel(tree, 'Link').props.onPress();
            await Promise.resolve();
        });

        const promptInputs = tree.root.findAllByType(TextInput).slice(1);

        renderer.act(() => {
            promptInputs[1]?.props.onChangeText('bad url');
        });

        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'URLs cannot contain spaces.'),
        ).toBe(true);

        await renderer.act(async () => {
            findPressableByLabel(tree, 'Apply').props.onPress();
            await Promise.resolve();
        });

        expect(onChangeText).not.toHaveBeenCalled();
    });

    test('shows and hides preview in expanded mode', () => {
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    initialMode="expanded"
                    onChangeText={() => {}}
                    previewEnabled
                    value="# Title"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer preview toggle');
        }

        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'Show preview'),
        ).toBe(true);
        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'Title'),
        ).toBe(false);

        renderer.act(() => {
            findPressableByLabel(tree, 'Show preview').props.onPress();
        });

        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'Hide preview'),
        ).toBe(true);
        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'Title'),
        ).toBe(true);
    });

    test('cancels the built-in prompt without applying a command', async () => {
        const onChangeText = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownComposer
                    onChangeText={onChangeText}
                    selection={{start: 0, end: 4}}
                    value="docs"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownComposer cancel prompt');
        }

        await renderer.act(async () => {
            findPressableByLabel(tree, 'Link').props.onPress();
            await Promise.resolve();
        });

        await renderer.act(async () => {
            findPressableByLabel(tree, 'Cancel').props.onPress();
            await Promise.resolve();
        });

        expect(onChangeText).not.toHaveBeenCalled();
    });
});

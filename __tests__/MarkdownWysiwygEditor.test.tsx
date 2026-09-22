import React from 'react';
import {Text, TextInput} from 'react-native';
import renderer from 'react-test-renderer';

import {
    insertTextAtSelection,
    MarkdownWysiwygEditor,
    removeTextBeforeSelection,
} from '../src';

const renderEditor = (
    props: React.ComponentProps<typeof MarkdownWysiwygEditor>,
): renderer.ReactTestRenderer => {
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
        tree = renderer.create(<MarkdownWysiwygEditor {...props} />);
    });

    if (!tree) {
        throw new Error('Failed to render MarkdownWysiwygEditor');
    }

    return tree;
};

describe('MarkdownWysiwygEditor', () => {
    test.each([true, false])('restores rejected native edits and preserves focus=%s', (focused) => {
        const ref = React.createRef<TextInput>();
        const onChangeText = jest.fn();
        const tree = renderEditor({ref, onChangeText, value: '**Hello** world'});
        const previousInput = ref.current!;
        const focus = jest.spyOn(previousInput, 'focus').mockClear();
        const isFocused = jest.spyOn(previousInput, 'isFocused').mockReturnValue(focused);
        renderer.act(() => {
            tree.root.findByType(TextInput).props.onSelectionChange({nativeEvent: {selection: {start: 3, end: 3}}});
        });
        renderer.act(() => { tree.root.findByType(TextInput).props.onChangeText('Hel!lo world'); });

        expect(onChangeText).toHaveBeenCalledWith('**Hel!lo** world');
        expect(ref.current).not.toBe(previousInput);
        expect(tree.root.findByType(TextInput).props.selection).toEqual({start: 3, end: 3});
        expect(tree.root.findAllByType(Text).map((node) => node.props.children).join('')).toBe('Hello world');
        expect(focus).toHaveBeenCalledTimes(focused ? 1 : 0);
        isFocused.mockRestore();
        focus.mockRestore();
    });

    test('keeps the native input and ref when the parent accepts an edit', () => {
        const ref = React.createRef<TextInput>();
        function ControlledEditor(): React.JSX.Element {
            const [value, setValue] = React.useState('**Hello**');
            return <MarkdownWysiwygEditor ref={ref} value={value} onChangeText={setValue} />;
        }
        let tree: renderer.ReactTestRenderer | undefined;
        renderer.act(() => { tree = renderer.create(<ControlledEditor />); });
        if (!tree) {
            throw new Error('Failed to render controlled editor');
        }
        const previousInput = ref.current;
        const input = tree.root.findByType(TextInput);
        renderer.act(() => { input.props.onChangeText('Hello!'); });

        expect(ref.current).toBe(previousInput);
        expect(tree.root.findAllByType(Text).map((node) => node.props.children).join('')).toBe('Hello!');
        expect(input.props.selection).toEqual({start: 6, end: 6});
    });

    test('renders markdown as styled segments without showing the markers', () => {
        const tree = renderEditor({
            onChangeText: jest.fn(),
            value: '**Hello** world',
        });

        const texts = tree.root.findAllByType(Text);
        const renderedText = texts.map((node) => node.props.children).join('');

        // Markers are hidden; only the display text is shown.
        expect(renderedText).toBe('Hello world');

        const input = tree.root.findByType(TextInput);
        expect(input.props.selection).toEqual({end: 11, start: 11});
    });

    test('hides heading markers and renders list bullets', () => {
        const tree = renderEditor({
            onChangeText: jest.fn(),
            value: '# Title\n- Item',
        });

        const texts = tree.root.findAllByType(Text);
        const renderedText = texts.map((node) => node.props.children).join('');

        expect(renderedText).toBe('Title\n• Item');
    });

    test('maps an edit on the display text back onto the markdown source', () => {
        const onChangeText = jest.fn();
        const onSelectionChange = jest.fn();
        const tree = renderEditor({
            onChangeText,
            onSelectionChange,
            selection: {end: 5, start: 5},
            value: '**Hello**',
        });

        const input = tree.root.findByType(TextInput);

        renderer.act(() => {
            input.props.onChangeText('Hello!');
        });

        expect(onChangeText).toHaveBeenCalledWith('**Hello!**');
        expect(onSelectionChange).toHaveBeenCalledWith({end: 6, start: 6});
    });

    test('reports selection changes in display coordinates', () => {
        const onSelectionChange = jest.fn();
        const tree = renderEditor({
            onChangeText: jest.fn(),
            onSelectionChange,
            value: '**Hello**',
        });

        const input = tree.root.findByType(TextInput);

        renderer.act(() => {
            input.props.onSelectionChange({
                nativeEvent: {selection: {end: 5, start: 0}},
            });
        });

        expect(onSelectionChange).toHaveBeenCalledWith({end: 5, start: 0});
    });

    test('uses the controlled selection when deleting repeated display characters', () => {
        const onChangeText = jest.fn();
        const tree = renderEditor({
            onChangeText,
            selection: {start: 0, end: 1},
            value: 'a**a**',
        });

        renderer.act(() => {
            tree.root.findByType(TextInput).props.onChangeText('a');
        });

        expect(onChangeText).toHaveBeenCalledWith('**a**');
    });

    test('continues typing outside a span closed by typed markdown', () => {
        const ref = React.createRef<TextInput>();
        function ControlledEditor(): React.JSX.Element {
            const [value, setValue] = React.useState('');
            return <MarkdownWysiwygEditor ref={ref} value={value} onChangeText={setValue} />;
        }
        let tree: renderer.ReactTestRenderer | undefined;
        renderer.act(() => { tree = renderer.create(<ControlledEditor />); });
        if (!tree) {
            throw new Error('Failed to render controlled editor');
        }
        const type = (display: string, caret: number): void => {
            renderer.act(() => { tree!.root.findByType(TextInput).props.onChangeText(display); });
            renderer.act(() => {
                tree!.root.findByType(TextInput).props.onSelectionChange({nativeEvent: {selection: {start: caret, end: caret}}});
            });
        };

        type('*', 1);
        type('*x', 2);
        // The closing marker converts the text; native then reports the caret the surface set.
        type('*x*', 1);
        expect(tree.root.findAllByType(Text).map((node) => node.props.children).join('')).toBe('x');
        expect(tree.root.findByType(TextInput).props.selection).toEqual({start: 1, end: 1});
        type('xy', 2);
        expect(tree.root.findAllByType(Text).map((node) => node.props.children).join('')).toBe('xy');
        expect(tree.root.findAllByType(Text).map((node) => node.props.children)).toEqual(['x', 'y']);
    });

    test('uses the native caret when deleting repeated display characters', () => {
        const onChangeText = jest.fn();
        const onSelectionChange = jest.fn();
        const tree = renderEditor({onChangeText, onSelectionChange, value: 'a**a**'});

        renderer.act(() => {
            tree.root.findByType(TextInput).props.onSelectionChange({
                nativeEvent: {selection: {start: 1, end: 1}},
            });
        });
        renderer.act(() => {
            tree.root.findByType(TextInput).props.onChangeText('a');
        });

        expect(onChangeText).toHaveBeenCalledWith('**a**');
        expect(onSelectionChange).toHaveBeenLastCalledWith({start: 0, end: 0});
    });
});

describe('wysiwyg editing utilities', () => {
    test('inserts text through a selected range', () => {
        expect(
            insertTextAtSelection('Hello world', {end: 11, start: 6}, 'reader'),
        ).toEqual({
            selection: {
                end: 12,
                start: 12,
            },
            value: 'Hello reader',
        });
    });

    test('removes the selected range before deleting a single character', () => {
        expect(
            removeTextBeforeSelection('Hello world', {end: 11, start: 6}),
        ).toEqual({
            selection: {
                end: 6,
                start: 6,
            },
            value: 'Hello ',
        });
    });
});

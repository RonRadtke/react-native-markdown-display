import React from 'react';
import {TextInput} from 'react-native';
import renderer from 'react-test-renderer';

import {EditorToolbar, MarkdownEditor} from '../src';
import type {MarkdownEditorMode, MarkdownTextInputCommandPayload} from '../src';

const findPressableByLabel = (
    tree: renderer.ReactTestRenderer,
    label: string,
): renderer.ReactTestInstance =>
    tree.root.find(
        (node) =>
            node.props.accessibilityLabel === label &&
            typeof node.props.onPress === 'function',
    );

const renderEditor = (
    props: Partial<React.ComponentProps<typeof MarkdownEditor>> = {},
): {onChangeText: jest.Mock; tree: renderer.ReactTestRenderer} => {
    const onChangeText = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
        tree = renderer.create(
            <MarkdownEditor onChangeText={onChangeText} value="" {...props} />,
        );
    });

    if (!tree) {
        throw new Error('Failed to render MarkdownEditor');
    }

    return {onChangeText, tree};
};

describe('MarkdownEditor', () => {
    test.each<MarkdownEditorMode>(['plaintext', 'wysiwyg'])('pending commands preserve intervening edits in %s', async (mode) => {
        let resolvePayload: (payload: MarkdownTextInputCommandPayload | null) => void = () => {};
        const pendingPayload = new Promise<MarkdownTextInputCommandPayload | null>((resolve) => { resolvePayload = resolve; });
        const resolveCommandPayload = () => pendingPayload;
        const {tree, onChangeText} = renderEditor({mode, value: 'Hello', resolveCommandPayload});
        let pendingCommand: Promise<void> | undefined;

        renderer.act(() => { pendingCommand = tree.root.findByType(EditorToolbar).props.onCommand('link'); });
        renderer.act(() => {
            tree.update(<MarkdownEditor mode={mode} value="Hello!" onChangeText={onChangeText} resolveCommandPayload={resolveCommandPayload} />);
        });
        await renderer.act(async () => {
            resolvePayload({command: 'link', link: {url: 'https://example.com'}});
            await pendingCommand;
        });

        expect(onChangeText.mock.calls[0]?.[0]).toContain('!');
    });

    test('clamps the selection after an external value change', async () => {
        const {tree, onChangeText} = renderEditor({mode: 'wysiwyg', value: 'Hello world'});
        renderer.act(() => {
            tree.root.findByType(TextInput).props.onSelectionChange({nativeEvent: {selection: {start: 2, end: 8}}});
        });
        renderer.act(() => {
            tree.update(<MarkdownEditor mode="wysiwyg" value="Hi" onChangeText={onChangeText} />);
        });
        await renderer.act(async () => { await tree.root.findByType(EditorToolbar).props.onCommand('bold'); });

        // The stale range is clamped to a caret, which formats the word around it.
        expect(onChangeText).toHaveBeenCalledWith('**Hi**');
    });

    test.each([{editable: false}, {readOnly: true}])('disables commands and custom actions with %s', async (props) => {
        const {tree, onChangeText} = renderEditor({mode: 'wysiwyg', value: 'Hello', ...props});
        const bold = findPressableByLabel(tree, 'Bold');
        expect(bold.props.disabled).toBe(true);
        await renderer.act(async () => {
            bold.props.onPress();
            await tree.root.findByType(EditorToolbar).props.onCommand('bold');
            tree.root.findByType(EditorToolbar).props.onAction({type: 'insert', markdown: '!'});
        });

        expect(onChangeText).not.toHaveBeenCalled();
    });

    test.each(['disabled', 'unmounted'])('does not apply a pending command after the editor is %s', async (change) => {
        let resolvePayload: (payload: MarkdownTextInputCommandPayload | null) => void = () => {};
        const pendingPayload = new Promise<MarkdownTextInputCommandPayload | null>((resolve) => { resolvePayload = resolve; });
        const {tree, onChangeText} = renderEditor({value: 'Hello', resolveCommandPayload: () => pendingPayload});
        let pendingCommand: Promise<void> | undefined;
        renderer.act(() => { pendingCommand = tree.root.findByType(EditorToolbar).props.onCommand('bold'); });
        renderer.act(() => {
            if (change === 'disabled') {
                tree.update(<MarkdownEditor editable={false} value="Hello" onChangeText={onChangeText} />);
            } else {
                tree.unmount();
            }
        });
        await renderer.act(async () => {
            resolvePayload({command: 'bold'});
            await pendingCommand;
        });

        expect(onChangeText).not.toHaveBeenCalled();
    });

    test('translates a selection when the parent changes the controlled mode', () => {
        const {tree, onChangeText} = renderEditor({mode: 'plaintext', value: '**Hello** world'});
        renderer.act(() => {
            tree.root.findByType(TextInput).props.onSelectionChange({nativeEvent: {selection: {start: 2, end: 7}}});
        });
        renderer.act(() => {
            tree.update(<MarkdownEditor mode="wysiwyg" value="**Hello** world" onChangeText={onChangeText} />);
        });
        expect(tree.root.findByType(TextInput).props.selection).toEqual({start: 0, end: 5});
        renderer.act(() => {
            tree.update(<MarkdownEditor mode="plaintext" value="**Hello** world" onChangeText={onChangeText} />);
        });
        expect(tree.root.findByType(TextInput).props.selection).toEqual({start: 2, end: 7});
    });

    test('uses the resolved command in rich mode', async () => {
        const {tree, onChangeText} = renderEditor({mode: 'wysiwyg', value: 'Hello', resolveCommandPayload: () => ({command: 'italic'})});
        renderer.act(() => {
            tree.root.findByType(TextInput).props.onSelectionChange({nativeEvent: {selection: {start: 0, end: 5}}});
        });
        await renderer.act(async () => { await tree.root.findByType(EditorToolbar).props.onCommand('bold'); });

        expect(onChangeText).toHaveBeenCalledWith('_Hello_');
    });

    test('wraps the caret with markers in plain-text mode', async () => {
        const {onChangeText, tree} = renderEditor({value: ''});

        await renderer.act(async () => {
            findPressableByLabel(tree, 'Bold').props.onPress();
        });

        expect(onChangeText).toHaveBeenCalledWith('**text**');
    });

    test('formats the display selection in wysiwyg mode', async () => {
        const {onChangeText, tree} = renderEditor({
            mode: 'wysiwyg',
            value: 'Hello',
        });

        const input = tree.root.findByType(TextInput);

        renderer.act(() => {
            input.props.onSelectionChange({
                nativeEvent: {selection: {end: 5, start: 0}},
            });
        });

        await renderer.act(async () => {
            findPressableByLabel(tree, 'Bold').props.onPress();
        });

        expect(onChangeText).toHaveBeenCalledWith('**Hello**');
    });

    test('renders the mode toggle and reports mode changes', () => {
        const onModeChange = jest.fn();
        const {tree} = renderEditor({onModeChange});

        renderer.act(() => {
            findPressableByLabel(tree, 'Rich text').props.onPress();
        });

        expect(onModeChange).toHaveBeenCalledWith('wysiwyg');
    });
});

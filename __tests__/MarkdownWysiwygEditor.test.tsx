import React from 'react';
import {TextInput} from 'react-native';
import renderer from 'react-test-renderer';

import {
    insertTextAtSelection,
    MarkdownWysiwygEditor,
    removeTextBeforeSelection,
} from '../src';

describe('MarkdownWysiwygEditor', () => {
    test('inserts hidden input text at the current markdown selection', () => {
        const onChangeText = jest.fn();
        const onSelectionChange = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownWysiwygEditor
                    cursorBlinkEnabled={false}
                    onChangeText={onChangeText}
                    onSelectionChange={onSelectionChange}
                    selection={{end: 5, start: 5}}
                    value="Hello world"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownWysiwygEditor');
        }

        const input = tree.root.findByType(TextInput);

        renderer.act(() => {
            input.props.onChangeText(',');
        });

        expect(onChangeText).toHaveBeenCalledWith('Hello, world');
        expect(onSelectionChange).toHaveBeenCalledWith({end: 6, start: 6});
    });

    test('deletes text before the markdown selection on backspace', () => {
        const onChangeText = jest.fn();
        const onSelectionChange = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownWysiwygEditor
                    cursorBlinkEnabled={false}
                    onChangeText={onChangeText}
                    onSelectionChange={onSelectionChange}
                    selection={{end: 5, start: 5}}
                    value="Hello"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownWysiwygEditor');
        }

        const input = tree.root.findByType(TextInput);

        renderer.act(() => {
            input.props.onKeyPress({
                nativeEvent: {
                    key: 'Backspace',
                },
            });
        });

        expect(onChangeText).toHaveBeenCalledWith('Hell');
        expect(onSelectionChange).toHaveBeenCalledWith({end: 4, start: 4});
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

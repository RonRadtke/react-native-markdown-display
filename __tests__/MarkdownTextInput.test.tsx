import React from 'react';
import renderer from 'react-test-renderer';
import {Text, TextInput} from 'react-native';

import {type MarkdownManagedTextInputProps, MarkdownTextInput} from '../src';
import type {MarkdownTextInputCommandPayload} from '../src';

const renderInput = (props: React.ComponentProps<typeof MarkdownTextInput>): renderer.ReactTestRenderer => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => { tree = renderer.create(<MarkdownTextInput {...props} />); });
    if (!tree) {
        throw new Error('Failed to render MarkdownTextInput');
    }
    return tree;
};

describe('MarkdownTextInput', () => {
    test('uses the current value, selection, and callbacks when a pending command resolves', async () => {
        let resolvePayload: (payload: MarkdownTextInputCommandPayload | null) => void = () => {};
        const pendingPayload = new Promise<MarkdownTextInputCommandPayload | null>((resolve) => { resolvePayload = resolve; });
        const oldOnChangeText = jest.fn();
        const onChangeText = jest.fn();
        const onCommand = jest.fn();
        const tree = renderInput({value: 'Hello', onChangeText: oldOnChangeText, resolveCommandPayload: () => pendingPayload});
        const button = tree.root.find((node) => node.props.accessibilityLabel === 'Bold' && typeof node.props.onPress === 'function');
        renderer.act(() => { button.props.onPress(); });
        renderer.act(() => {
            tree.update(<MarkdownTextInput value="Hello!" selection={{start: 5, end: 6}} onChangeText={onChangeText} onCommand={onCommand} />);
        });
        await renderer.act(async () => {
            resolvePayload({command: 'bold'});
            await pendingPayload;
        });

        expect(oldOnChangeText).not.toHaveBeenCalled();
        expect(onChangeText).toHaveBeenCalledWith('Hello**!**');
        expect(onCommand).toHaveBeenCalledWith({command: 'bold'}, {value: 'Hello**!**', selection: {start: 7, end: 8}});
    });

    test.each([{editable: false}, {readOnly: true}])('disables toolbar commands and actions with %s', async (props) => {
        const onChangeText = jest.fn();
        const resolveCommandPayload = jest.fn();
        const tree = renderInput({
            ...props,
            value: 'Hello',
            onChangeText,
            resolveCommandPayload,
            toolbarItems: [{command: 'bold', label: 'Bold'}, {action: {type: 'insert', markdown: '!'}, label: 'Insert'}],
        });
        const buttons = tree.root.findAll((node) => typeof node.props.onPress === 'function');
        await renderer.act(async () => {
            for (const button of buttons) {
                expect(button.props.disabled).toBe(true);
                button.props.onPress();
            }
        });
        expect(resolveCommandPayload).not.toHaveBeenCalled();
        expect(onChangeText).not.toHaveBeenCalled();
    });

    test.each(['disabled', 'unmounted'])('cancels pending input commands when %s', async (change) => {
        let resolvePayload: (payload: MarkdownTextInputCommandPayload | null) => void = () => {};
        const pendingPayload = new Promise<MarkdownTextInputCommandPayload | null>((resolve) => { resolvePayload = resolve; });
        const onChangeText = jest.fn();
        const tree = renderInput({value: 'Hello', onChangeText, resolveCommandPayload: () => pendingPayload});
        const button = tree.root.find((node) => node.props.accessibilityLabel === 'Bold' && typeof node.props.onPress === 'function');
        renderer.act(() => { button.props.onPress(); });
        renderer.act(() => {
            if (change === 'disabled') {
                tree.update(<MarkdownTextInput value="Hello" readOnly onChangeText={onChangeText} />);
            } else {
                tree.unmount();
            }
        });
        await renderer.act(async () => {
            resolvePayload({command: 'bold'});
            await pendingPayload;
        });
        expect(onChangeText).not.toHaveBeenCalled();
    });

    test('uses the command payload resolver for link commands', async () => {
        const onChangeText = jest.fn();
        const resolveCommandPayload = jest.fn(async () => ({
            command: 'link' as const,
            link: {
                url: 'https://example.com',
            },
        }));
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownTextInput
                    onChangeText={onChangeText}
                    resolveCommandPayload={resolveCommandPayload}
                    selection={{start: 0, end: 4}}
                    toolbarItems={[{command: 'link', label: 'Link'}]}
                    value="docs"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownTextInput');
        }

        const button = tree.root.find(
            (node) => typeof node.props.onPress === 'function',
        );

        await renderer.act(async () => {
            button.props.onPress();
            await Promise.resolve();
        });

        expect(resolveCommandPayload).toHaveBeenCalledWith('link');
        expect(onChangeText).toHaveBeenCalledWith('[docs](https://example.com)');
    });

    test('does not apply a command when the resolver cancels it', async () => {
        const onChangeText = jest.fn();
        const resolveCommandPayload = jest.fn(async () => null);
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownTextInput
                    onChangeText={onChangeText}
                    resolveCommandPayload={resolveCommandPayload}
                    toolbarItems={[{command: 'table', label: 'Table'}]}
                    value=""
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownTextInput');
        }

        const button = tree.root.find(
            (node) => typeof node.props.onPress === 'function',
        );

        await renderer.act(async () => {
            button.props.onPress();
            await Promise.resolve();
        });

        expect(onChangeText).not.toHaveBeenCalled();
    });

    test('keeps compact inputs multiline with a single visible row', () => {
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownTextInput
                    multiline
                    numberOfLines={1}
                    onChangeText={() => {}}
                    value=""
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownTextInput');
        }

        const input = tree.root.findByType(TextInput);

        expect(input.props.multiline).toBe(true);
        expect(input.props.numberOfLines).toBe(1);
    });

    test('renders a custom input component when provided', () => {
        const CustomInput = React.forwardRef<
            TextInput,
            MarkdownManagedTextInputProps
        >(function CustomInput(props, ref) {
            return <TextInput {...props} ref={ref} testID="custom-input"/>;
        });
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownTextInput
                    inputComponent={CustomInput}
                    multiline
                    numberOfLines={3}
                    onChangeText={() => {}}
                    placeholder="Write here"
                    value="Hello"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownTextInput with a custom input');
        }

        const input = tree.root.findByProps({testID: 'custom-input'});

        expect(input.props.value).toBe('Hello');
        expect(input.props.numberOfLines).toBe(3);
        expect(input.props.placeholder).toBe('Write here');
    });

    test('renders JSX toolbar labels', () => {
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownTextInput
                    onChangeText={() => {}}
                    toolbarItems={[
                        {
                            accessibilityLabel: 'Bold icon',
                            command: 'bold',
                            label: <Text testID="bold-icon">B</Text>,
                        },
                    ]}
                    value=""
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownTextInput JSX toolbar label');
        }

        expect(tree.root.findByProps({testID: 'bold-icon'})).toBeTruthy();
    });

    test('applies custom wrap toolbar actions', () => {
        jest.useFakeTimers();

        function DelayedActionHarness(): React.JSX.Element {
            const [value, setValue] = React.useState('');

            return (
                <MarkdownTextInput
                    onChangeText={(nextValue) => {
                        setTimeout(() => {
                            setValue(nextValue);
                        }, 0);
                    }}
                    toolbarItems={[
                        {
                            accessibilityLabel: 'Insert warning',
                            action: {
                                placeholder: 'Warning text',
                                prefix: '::: warning\n',
                                suffix: '\n:::',
                                type: 'wrap',
                            },
                            label: 'Warn',
                        },
                    ]}
                    value={value}
                />
            );
        }

        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <DelayedActionHarness/>,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownTextInput custom wrap action');
        }

        const button = tree.root.find(
            (node) =>
                typeof node.props.onPress === 'function' &&
                node.findAllByType(Text).some(
                    (textNode) => textNode.props.children === 'Warn',
                ),
        );

        renderer.act(() => {
            button.props.onPress();
        });

        renderer.act(() => {
            jest.runAllTimers();
        });

        const input = tree.root.findByType(TextInput);

        expect(input.props.value).toBe('::: warning\nWarning text\n:::');
        expect(input.props.selection).toEqual({
            end: 24,
            start: 12,
        });

        jest.useRealTimers();
    });

    test('applies custom insert actions from toolbar menus', () => {
        const onChangeText = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownTextInput
                    onChangeText={onChangeText}
                    toolbarItems={[
                        {
                            accessibilityLabel: 'Insert block',
                            items: [
                                {
                                    accessibilityLabel: 'Insert warning',
                                    action: {
                                        markdown: '::: warning\nWarning text\n:::',
                                        selectionEndOffset: 24,
                                        selectionStartOffset: 12,
                                        type: 'insert',
                                    },
                                    label: 'Warn',
                                },
                            ],
                            label: 'More',
                        },
                    ]}
                    value=""
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownTextInput custom menu action');
        }

        const menuButton = tree.root.find(
            (node) =>
                typeof node.props.onPress === 'function' &&
                node.findAllByType(Text).some(
                    (textNode) => textNode.props.children === 'More',
                ),
        );

        renderer.act(() => {
            menuButton.props.onPress();
        });

        const actionButton = tree.root.find(
            (node) =>
                typeof node.props.onPress === 'function' &&
                node.findAllByType(Text).some(
                    (textNode) => textNode.props.children === 'Warn',
                ),
        );

        renderer.act(() => {
            actionButton.props.onPress();
        });

        expect(onChangeText).toHaveBeenCalledWith(
            '::: warning\nWarning text\n:::',
        );
    });

    test('fires onCommand with the payload and the resulting value', async () => {
        const onChangeText = jest.fn();
        const onCommand = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownTextInput
                    onChangeText={onChangeText}
                    onCommand={onCommand}
                    selection={{start: 0, end: 5}}
                    toolbarItems={[{command: 'bold', label: 'B'}]}
                    value="hello"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownTextInput');
        }

        const button = tree.root.find(
            (node) => typeof node.props.onPress === 'function',
        );

        await renderer.act(async () => {
            button.props.onPress();
            await Promise.resolve();
        });

        expect(onChangeText).toHaveBeenCalledWith('**hello**');
        expect(onCommand).toHaveBeenCalledWith(
            {command: 'bold'},
            {value: '**hello**', selection: {start: 2, end: 7}},
        );
    });

    test('does not apply shortcuts when enableShortcuts is false', () => {
        const onChangeText = jest.fn();
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownTextInput
                    enableShortcuts={false}
                    multiline
                    onChangeText={onChangeText}
                    value="- item"
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownTextInput');
        }

        const input = tree.root.findByType(TextInput);

        renderer.act(() => {
            input.props.onChangeText('- item\n');
        });

        expect(onChangeText).toHaveBeenCalledWith('- item\n');
    });

    test('renders no toolbar row when toolbarItems is empty', () => {
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownTextInput
                    onChangeText={() => {}}
                    toolbarItems={[]}
                    value=""
                />,
            );
        });

        if (!tree) {
            throw new Error('Failed to render MarkdownTextInput');
        }

        expect(
            tree.root.findAll((node) => typeof node.props.onPress === 'function'),
        ).toHaveLength(0);
    });

    test('keeps the caret after an auto-continued ordered list when value updates are delayed', () => {
        jest.useFakeTimers();

        function DelayedValueHarness(): React.JSX.Element {
            const [value, setValue] = React.useState('1. TEST');

            return (
                <MarkdownTextInput
                    multiline
                    numberOfLines={1}
                    onChangeText={(nextValue) => {
                        setTimeout(() => {
                            setValue(nextValue);
                        }, 0);
                    }}
                    value={value}
                />
            );
        }

        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(<DelayedValueHarness/>);
        });

        if (!tree) {
            throw new Error('Failed to render delayed MarkdownTextInput harness');
        }

        const input = tree.root.findByType(TextInput);

        renderer.act(() => {
            input.props.onChangeText('1. TEST\n');
        });

        renderer.act(() => {
            input.props.onSelectionChange({
                nativeEvent: {
                    selection: {start: 8, end: 8},
                },
            });
        });

        renderer.act(() => {
            jest.runAllTimers();
        });

        const updatedInput = tree.root.findByType(TextInput);

        expect(updatedInput.props.value).toBe('1. TEST\n2. ');
        expect(updatedInput.props.selection).toEqual({start: 11, end: 11});

        jest.useRealTimers();
    });
});

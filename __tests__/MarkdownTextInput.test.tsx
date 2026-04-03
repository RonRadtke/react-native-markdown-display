import React from 'react';
import renderer from 'react-test-renderer';
import {TextInput} from 'react-native';

import {MarkdownTextInput, type MarkdownManagedTextInputProps} from '../src';

describe('MarkdownTextInput', () => {
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
      return <TextInput {...props} ref={ref} testID="custom-input" />;
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
});

import React from 'react';
import renderer from 'react-test-renderer';
import {TextInput} from 'react-native';

import {MarkdownTextInput} from '../src';

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

    const button = tree.root.find((node) => typeof node.props.onPress === 'function');

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

    const button = tree.root.find((node) => typeof node.props.onPress === 'function');

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
});

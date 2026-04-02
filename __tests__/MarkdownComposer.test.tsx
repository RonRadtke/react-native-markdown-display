import React from 'react';
import renderer from 'react-test-renderer';
import {Text, TextInput} from 'react-native';

import {MarkdownComposer} from '../src';

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

  test('renders preview in expanded mode when enabled', () => {
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
    ).toBe(true);
    expect(
      tree.root.findAllByType(Text).some((node) => node.props.children === 'Title'),
    ).toBe(true);
  });

  test('uses a single-row multiline input in compact mode and a taller input when expanded', () => {
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(<MarkdownComposer onChangeText={() => {}} value="" />);
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
});

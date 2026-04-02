import React from 'react';
import renderer from 'react-test-renderer';
import {Text} from 'react-native';

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
});

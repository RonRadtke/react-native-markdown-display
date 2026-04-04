/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text} from 'react-native';
import App, {usesStructuredBubbleLayout} from '../App';

test('renders correctly', async () => {
    await ReactTestRenderer.act(() => {
        ReactTestRenderer.create(
            <App/>);
    });
});

test('renders warning blocks from the example plugin setup', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(() => {
        tree = ReactTestRenderer.create(<App/>);
    });

    if (!tree) {
        throw new Error('Failed to render example app');
    }

    expect(
        tree.root.findAllByType(Text).some((node) => node.props.children === 'Warning'),
    ).toBe(true);
});

test('uses wide bubble layout for pure list and table messages', () => {
    expect(usesStructuredBubbleLayout('- first item\n- second item')).toBe(true);
    expect(
        usesStructuredBubbleLayout(
            '| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |',
        ),
    ).toBe(true);
    expect(usesStructuredBubbleLayout('Paragraph\n\n- list item')).toBe(false);
});

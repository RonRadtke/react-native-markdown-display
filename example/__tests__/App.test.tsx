/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App, {usesStructuredBubbleLayout} from '../App';

test('renders correctly', async () => {
    await ReactTestRenderer.act(() => {
        ReactTestRenderer.create(
            <App/>);
    });
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

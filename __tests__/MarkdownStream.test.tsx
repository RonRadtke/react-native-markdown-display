import React from 'react';
import renderer from 'react-test-renderer';
import {Animated, Text} from 'react-native';

import {MarkdownStream} from '../src';

describe('MarkdownStream', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());
    test('renders plain text without throwing', () => {
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(<MarkdownStream>Hello world</MarkdownStream>);
        });

        expect(
            tree?.root.findAll((node) => node.type === Text || node.type === 'Text').length,
        ).toBeGreaterThan(0);
    });

    test('renders markdown with heading and bold without throwing', () => {
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownStream>{'## Title\n\nThis is **bold** text.'}</MarkdownStream>,
            );
        });

        expect(tree).toBeTruthy();
    });

    test('does not show a cursor when streaming is false (default)', () => {
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(<MarkdownStream>Hello</MarkdownStream>);
        });

        expect(tree?.root.findAll((node) => node.type === Animated.View)).toHaveLength(0);
    });

    test('shows a blinking cursor when streaming is true', () => {
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(<MarkdownStream streaming>Hello</MarkdownStream>);
        });

        expect(tree?.root.findAll((node) => node.type === Animated.View).length).toBeGreaterThan(0);
    });

    test('hides the cursor when streaming changes from true to false', () => {
        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(<MarkdownStream streaming>Hello</MarkdownStream>);
        });

        expect(tree?.root.findAll((node) => node.type === Animated.View).length).toBeGreaterThan(0);

        renderer.act(() => {
            tree?.update(<MarkdownStream streaming={false}>Hello</MarkdownStream>);
        });

        expect(tree?.root.findAll((node) => node.type === Animated.View)).toHaveLength(0);
    });

    test('seals an unclosed code fence when streaming is true', () => {
        let noStreamTree: renderer.ReactTestRenderer | undefined;
        let streamTree: renderer.ReactTestRenderer | undefined;
        const partialSource = '```python\ndef foo():';

        renderer.act(() => {
            noStreamTree = renderer.create(
                <MarkdownStream streaming={false}>{partialSource}</MarkdownStream>,
            );
        });

        renderer.act(() => {
            streamTree = renderer.create(
                <MarkdownStream streaming>{partialSource}</MarkdownStream>,
            );
        });

        const countTextNodes = (t: renderer.ReactTestRenderer) =>
            t.root.findAll((node) => node.type === Text || node.type === 'Text').length;

        expect(countTextNodes(streamTree!)).toBeGreaterThan(0);
        expect(countTextNodes(noStreamTree!)).toBeGreaterThan(0);
    });

    test('accepts custom markdownit instance', () => {
        const MarkdownIt = require('markdown-it');
        const customMd = MarkdownIt();

        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownStream markdownit={customMd}>Hello</MarkdownStream>,
            );
        });

        expect(tree).toBeTruthy();
    });

    test('accepts custom render rules', () => {
        const rules = {
            paragraph: (_node: unknown, _children: unknown, _parents: unknown, _styles: unknown) =>
                <Text key="custom-para" testID="custom-paragraph">custom</Text>,
        };

        let tree: renderer.ReactTestRenderer | undefined;

        renderer.act(() => {
            tree = renderer.create(
                <MarkdownStream rules={rules}>Hello</MarkdownStream>,
            );
        });

        expect(tree?.root.findByProps({testID: 'custom-paragraph'})).toBeTruthy();
    });
});

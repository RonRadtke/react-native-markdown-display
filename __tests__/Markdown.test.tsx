import React from 'react';
import renderer, {type ReactTestRenderer} from 'react-test-renderer';
import {Linking, StyleSheet, Text} from 'react-native';

import Markdown, {createMarkdownIt} from '../src';

const renderMarkdown = (
    props: React.ComponentProps<typeof Markdown>,
    children: React.ComponentProps<typeof Markdown>['children'],
): ReactTestRenderer => {
    let tree: ReactTestRenderer | undefined;

    renderer.act(() => {
        tree = renderer.create(
            <Markdown {...props}>{children}</Markdown>);
    });

    if (!tree) {
        throw new Error('Failed to render Markdown test component');
    }

    return tree;
};

describe('Markdown component', () => {
    beforeEach(() => {
        jest.spyOn(Linking, 'openURL').mockImplementation(() => Promise.resolve());
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('opens links with React Native Linking by default', () => {
        const tree = renderMarkdown({}, '[link](https://example.com)');
        const link = tree.root.findByProps({accessibilityRole: 'link'});

        renderer.act(() => {
            link.props.onPress();
        });

        expect(Linking.openURL).toHaveBeenCalledWith('https://example.com');
    });

    test('passes link presses through the onLinkPress callback', () => {
        const onLinkPress = jest.fn(() => false);
        const tree = renderMarkdown(
            {onLinkPress},
            '[link](https://example.com)',
        );
        const link = tree.root.findByProps({accessibilityRole: 'link'});

        renderer.act(() => {
            link.props.onPress();
        });

        expect(onLinkPress).toHaveBeenCalledWith('https://example.com');
    });

    test('renders a fallback item when maxTopLevelChildren is exceeded', () => {
        const tree = renderMarkdown({maxTopLevelChildren: 1}, '# One\n\n# Two');
        const json = tree.toJSON();

        expect(json).not.toBeNull();
        expect(JSON.stringify(json)).toContain('...');
    });

    test('does not enable underline syntax in the default parser configuration', () => {
        const tree = renderMarkdown({}, '++underlined++');

        expect(
            tree.root.findAllByType(Text).some((node) => node.props.children === 'underlined'),
        ).toBe(false);
    });

    test('renders underline syntax when the shipped underline plugin is activated', () => {
        const tree = renderMarkdown(
            {markdownit: createMarkdownIt({underline: true})},
            '++underlined++',
        );
        const underlinedText = tree.root.findAllByType(Text).find(
            (node) => node.props.children === 'underlined',
        );

        if (!underlinedText) {
            throw new Error('Failed to find underlined text node');
        }

        expect(StyleSheet.flatten(underlinedText.props.style)).toMatchObject({
            textDecorationLine: 'underline',
        });
    });
});

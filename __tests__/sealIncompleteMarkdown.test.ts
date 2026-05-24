import {sealIncompleteMarkdown} from '../src';

describe('sealIncompleteMarkdown', () => {
    test('returns source unchanged when there is no code fence', () => {
        const source = 'Hello **world**\n\n- item 1\n- item 2\n\n> blockquote';
        expect(sealIncompleteMarkdown(source)).toBe(source);
    });

    test('returns source unchanged when a backtick fence is properly closed', () => {
        const source = '```python\ndef foo(): pass\n```';
        expect(sealIncompleteMarkdown(source)).toBe(source);
    });

    test('returns source unchanged when a tilde fence is properly closed', () => {
        const source = '~~~\nsome code\n~~~';
        expect(sealIncompleteMarkdown(source)).toBe(source);
    });

    test('closes an unclosed 3-backtick fence', () => {
        expect(sealIncompleteMarkdown('```\nsome code')).toBe('```\nsome code\n```');
    });

    test('closes an unclosed tilde fence', () => {
        expect(sealIncompleteMarkdown('~~~\nsome code')).toBe('~~~\nsome code\n~~~');
    });

    test('closes a fence with a language identifier', () => {
        expect(sealIncompleteMarkdown('```typescript\nconst x = 1')).toBe(
            '```typescript\nconst x = 1\n```',
        );
    });

    test('closes an unclosed 4-backtick fence with the matching length', () => {
        expect(sealIncompleteMarkdown('````python\ncode')).toBe('````python\ncode\n````');
    });

    test('does not let a 3-backtick line close a 4-backtick fence', () => {
        const source = '````\ncode\n```\nmore code';
        expect(sealIncompleteMarkdown(source)).toBe(source + '\n````');
    });

    test('does not let a backtick line close a tilde fence', () => {
        const source = '~~~\ncode\n```';
        expect(sealIncompleteMarkdown(source)).toBe(source + '\n~~~');
    });

    test('does not let a tilde line close a backtick fence', () => {
        const source = '```\ncode\n~~~';
        expect(sealIncompleteMarkdown(source)).toBe(source + '\n```');
    });

    test('handles multiple closed fences and leaves them unchanged', () => {
        const source = '```\nfirst\n```\n\n```\nsecond\n```';
        expect(sealIncompleteMarkdown(source)).toBe(source);
    });

    test('closes only the second fence when the first is closed and the second is not', () => {
        const source = '```\nclosed\n```\n```\nopen';
        expect(sealIncompleteMarkdown(source)).toBe(source + '\n```');
    });

    test('preserves content that follows a closed fence', () => {
        const source = '```\ncode\n```\n\n## Heading\n\n- list item';
        expect(sealIncompleteMarkdown(source)).toBe(source);
    });

    test('returns an empty string unchanged', () => {
        expect(sealIncompleteMarkdown('')).toBe('');
    });

    test('handles a fence with only the opening line and no content', () => {
        expect(sealIncompleteMarkdown('```')).toBe('```\n```');
    });

    test('treats a line with only two backticks as normal text, not a fence', () => {
        const source = '``\nsome text';
        expect(sealIncompleteMarkdown(source)).toBe(source);
    });
});

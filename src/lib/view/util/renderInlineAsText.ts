import type {TokenLike} from '../types';

export default function renderInlineAsText(tokens: TokenLike[]): string {
    let result = '';

    for (const token of tokens) {
        if (token.type === 'text') {
            result += token.content;
        } else if (token.type === 'image') {
            result += renderInlineAsText(token.children ?? []);
        }
    }

    return result;
}

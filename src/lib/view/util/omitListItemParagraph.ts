import type {TokenLike} from '../types';

export default function omitListItemParagraph(tokens: TokenLike[]): TokenLike[] {
    let depth: number | null = null;

    return tokens.filter((token, index) => {
        if (depth !== null) {
            depth += token.nesting;
        }

        if (token.type === 'list_item' && token.nesting === 1 && depth === null) {
            const nextToken = tokens[index + 1];

            if (
                nextToken &&
                nextToken.type === 'paragraph' &&
                nextToken.nesting === 1
            ) {
                depth = 0;
            }

            return true;
        }

        if (token.type === 'paragraph') {
            if (token.nesting === 1 && depth === 1) {
                return false;
            }

            if (token.nesting === -1 && depth === 0) {
                depth = null;
                return false;
            }
        }

        return true;
    });
}

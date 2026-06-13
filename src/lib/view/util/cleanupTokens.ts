import getTokenTypeByToken from './getTokenTypeByToken';
import flattenInlineTokens from './flattenInlineTokens';
import renderInlineAsText from './renderInlineAsText';

import type {TokenLike} from '../types';

export function cleanupTokens(tokens: TokenLike[]): TokenLike[] {
    const flattenedTokens = flattenInlineTokens(tokens);

    flattenedTokens.forEach((token) => {
        token.type = getTokenTypeByToken(token);

        if (token.type === 'image' || token.type === 'hardbreak') {
            token.block = true;
        }

        if (token.type === 'image' && token.attrs) {
            const altIndex = token.attrIndex('alt');

            if (altIndex > -1) {
                const altAttribute = token.attrs[altIndex];

                if (altAttribute) {
                    altAttribute[1] = renderInlineAsText(token.children ?? []);
                }
            }
        }
    });

    const stack: TokenLike[] = [];

    return flattenedTokens.reduce<TokenLike[]>((acc, token) => {
        if (token.type === 'link' && token.nesting === 1) {
            stack.push(token);
        }
        else if (
            stack.length > 0 &&
            token.type === 'link' &&
            token.nesting === -1
        ) {
            if (stack.some((stackToken) => stackToken.block)) {
                stack[0]!.type = 'blocklink';
                stack[0]!.block = true;
                token.type = 'blocklink';
                token.block = true;
            }

            stack.push(token);

            while (stack.length > 0) {
                const nextToken = stack.shift();

                if (nextToken) {
                    acc.push(nextToken);
                }
            }
        }
        else if (stack.length > 0) {
            stack.push(token);
        }
        else {
            acc.push(token);
        }

        return acc;
    }, []);
}

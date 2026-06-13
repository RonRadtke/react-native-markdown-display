import type {TokenLike} from '../types';

export default function flattenInlineTokens(tokens: TokenLike[]): TokenLike[] {
    return tokens.reduce<TokenLike[]>((acc, currentToken) => {
        if (
            currentToken.type === 'inline' &&
            currentToken.children &&
            currentToken.children.length > 0
        ) {
            acc.push(...flattenInlineTokens(currentToken.children));
        }
        else {
            acc.push(currentToken);
        }

        return acc;
    }, []);
}

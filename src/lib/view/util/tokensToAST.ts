import getTokenTypeByToken from './getTokenTypeByToken';
import getUniqueID from './getUniqueID';

import type {ASTNode, TokenLike} from '../types';

function createNode(token: TokenLike, tokenIndex: number): ASTNode {
    const attributes =
        token.attrs?.reduce<Record<string, string>>((acc, [name, value]) => {
            acc[name] = value;
            return acc;
        }, {}) ?? {};

    return {
        type: getTokenTypeByToken(token),
        sourceType: token.type,
        sourceInfo: token.info,
        sourceMeta: token.meta,
        block: token.block,
        markup: token.markup,
        key: `${getUniqueID()}_${getTokenTypeByToken(token)}`,
        content: token.content,
        tokenIndex,
        index: 0,
        attributes,
        children: tokensToAST(token.children ?? []),
    };
}

export default function tokensToAST(tokens: TokenLike[]): ASTNode[] {
    const stack: ASTNode[][] = [];
    let children: ASTNode[] = [];

    for (const [tokenIndex, token] of tokens.entries()) {
        const astNode = createNode(token, tokenIndex);

        if (
            astNode.type === 'text' &&
            astNode.children.length === 0 &&
            astNode.content === ''
        ) {
            continue;
        }

        astNode.index = children.length;

        if (token.nesting === 1) {
            children.push(astNode);
            stack.push(children);
            children = astNode.children;
        }
        else if (token.nesting === -1) {
            children = stack.pop() ?? children;
        }
        else {
            children.push(astNode);
        }
    }

    return children;
}

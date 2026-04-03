import groupTextTokens from './util/groupTextTokens';
import omitListItemParagraph from './util/omitListItemParagraph';
import {cleanupTokens} from './util/cleanupTokens';
import {stringToTokens} from './util/stringToTokens';
import tokensToAST from './util/tokensToAST';

import type {ASTNode, MarkdownParser} from './types';
import type {ReactNode} from 'react';

export default function parser(
    source: string | ASTNode[],
    renderer: (nodes: ASTNode[]) => ReactNode,
    markdownIt: MarkdownParser,
): ReactNode {
    if (Array.isArray(source)) {
        return renderer(source);
    }

    const astTree = tokensToAST(
        omitListItemParagraph(
            groupTextTokens(cleanupTokens(stringToTokens(source, markdownIt))),
        ),
    );

    return renderer(astTree);
}

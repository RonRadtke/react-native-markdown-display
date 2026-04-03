import type { MarkdownTokenNesting, TokenLike } from '../types';
export default class Token implements TokenLike {
    attrs: null;
    block: boolean;
    children: TokenLike[] | null;
    content: string;
    info: string;
    markup: string;
    meta: null;
    nesting: MarkdownTokenNesting;
    tag: string;
    type: string;
    constructor(type: string, nesting?: MarkdownTokenNesting, children?: TokenLike[] | null, block?: boolean);
    attrIndex(): number;
}
//# sourceMappingURL=Token.d.ts.map
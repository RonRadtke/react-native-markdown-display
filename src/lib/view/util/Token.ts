import type {MarkdownTokenNesting, TokenLike} from '../types';

export default class Token implements TokenLike {
    public attrs: null = null;

    public block: boolean;

    public children: TokenLike[] | null;

    public content = '';

    public info = '';

    public markup = '';

    public meta: null = null;

    public nesting: MarkdownTokenNesting;

    public tag = '';

    public type: string;

    public constructor(type: string, nesting: MarkdownTokenNesting = 0, children: TokenLike[] | null = null, block = false) {
        this.type = type;
        this.nesting = nesting;
        this.children = children;
        this.block = block;
    }

    public attrIndex(): number {
        return -1;
    }
}

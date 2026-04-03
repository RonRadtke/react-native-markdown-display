import type {ASTNode, MarkdownParser} from './types';
import type {ReactNode} from 'react';

export default function parser(source: string | ASTNode[], renderer: (nodes: ASTNode[]) => ReactNode, markdownIt: MarkdownParser): ReactNode;
//# sourceMappingURL=parser.d.ts.map
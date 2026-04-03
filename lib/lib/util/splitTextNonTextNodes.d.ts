import type {ReactElement, ReactNode} from 'react';

interface SplitTextNodesResult {
    nonTextNodes: ReactElement[];
    textNodes: ReactElement[];
}

export default function splitTextNonTextNodes(children: ReactNode[]): SplitTextNodesResult;
export {};
//# sourceMappingURL=splitTextNonTextNodes.d.ts.map
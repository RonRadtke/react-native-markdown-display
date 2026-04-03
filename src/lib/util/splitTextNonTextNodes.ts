import type {ReactElement, ReactNode} from 'react';
import React from 'react';

interface SplitTextNodesResult {
    nonTextNodes: ReactElement[];
    textNodes: ReactElement[];
}

export default function splitTextNonTextNodes(
    children: ReactNode[],
): SplitTextNodesResult {
    return children.reduce<SplitTextNodesResult>(
        (acc, childNode) => {
            if (!React.isValidElement(childNode)) {
                return acc;
            }

            if (
                typeof childNode.type !== 'string' &&
                'displayName' in childNode.type &&
                childNode.type.displayName === 'Text'
            ) {
                acc.textNodes.push(childNode);
            }
            else {
                acc.nonTextNodes.push(childNode);
            }

            return acc;
        },
        {textNodes: [], nonTextNodes: []},
    );
}

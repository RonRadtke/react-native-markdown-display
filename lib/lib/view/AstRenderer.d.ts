import type { ASTNode, MarkdownStyleMap, OnLinkPress, RenderRule, RenderRules } from './types';
import type { ReactNode } from 'react';
export default class AstRenderer {
    private readonly _allowedImageHandlers;
    private readonly _debugPrintTree;
    private readonly _defaultImageHandler;
    private readonly _maxTopLevelChildren;
    private readonly _onLinkPress;
    private readonly _renderRules;
    private readonly _style;
    private readonly _topLevelMaxExceededItem;
    constructor(renderRules: RenderRules, style: MarkdownStyleMap, onLinkPress?: OnLinkPress, maxTopLevelChildren?: number | null, topLevelMaxExceededItem?: ReactNode, allowedImageHandlers?: string[], defaultImageHandler?: string | null, debugPrintTree?: boolean);
    getRenderFunction(type: string): RenderRule;
    renderNode: (node: ASTNode, parentNodes: ReadonlyArray<ASTNode>, isRoot?: boolean) => ReactNode;
    render: (nodes: ReadonlyArray<ASTNode>) => ReactNode;
}
//# sourceMappingURL=AstRenderer.d.ts.map
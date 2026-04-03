import AstRenderer from './AstRenderer';
import type {MarkdownStyleMap, OnLinkPress, RenderRules, TextComponent} from './types';
import type {ReactNode} from 'react';

export declare const getStyle: (mergeStyle: boolean, style: MarkdownStyleMap | null) => MarkdownStyleMap;
export declare const getRenderer: (textComponent: TextComponent | undefined, renderer: AstRenderer | null, rules: RenderRules | null, style: MarkdownStyleMap | null, mergeStyle: boolean, onLinkPress: OnLinkPress | undefined, maxTopLevelChildren: number | null, topLevelMaxExceededItem: ReactNode, allowedImageHandlers: string[], defaultImageHandler: string | null, debugPrintTree: boolean) => AstRenderer;
//# sourceMappingURL=createRenderer.d.ts.map
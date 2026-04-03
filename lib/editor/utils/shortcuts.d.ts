import type {MarkdownCommandResult, MarkdownSelection} from '../types';

interface ShortcutContext {
    nextValue: string;
    previousSelection: MarkdownSelection;
    previousValue: string;
}

export declare const applyMarkdownShortcut: (context: ShortcutContext) => MarkdownCommandResult | null;
export {};
//# sourceMappingURL=shortcuts.d.ts.map
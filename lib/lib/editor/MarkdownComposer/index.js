"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const MarkdownPreview_1 = __importDefault(require("../MarkdownPreview"));
const MarkdownTextInput_1 = __importDefault(require("../MarkdownTextInput"));
const style_1 = __importDefault(require("./style"));
const DEFAULT_COMPACT_TOOLBAR = [
    { accessibilityLabel: 'Bold', command: 'bold', label: 'B' },
    { accessibilityLabel: 'Italic', command: 'italic', label: 'I' },
    { accessibilityLabel: 'Insert link', command: 'link', label: 'Link' },
];
const DEFAULT_HEADING_TOOLBAR_ITEMS = [
    { accessibilityLabel: 'Heading one', command: 'heading-one', label: 'H1' },
    { accessibilityLabel: 'Heading two', command: 'heading-two', label: 'H2' },
    { accessibilityLabel: 'Heading three', command: 'heading-three', label: 'H3' },
];
const DEFAULT_EXPANDED_TOOLBAR = [
    ...DEFAULT_COMPACT_TOOLBAR,
    { accessibilityLabel: 'Strikethrough', command: 'strikethrough', label: 'S' },
    {
        accessibilityLabel: 'Insert heading',
        items: DEFAULT_HEADING_TOOLBAR_ITEMS,
        label: 'H',
    },
    { accessibilityLabel: 'Quote', command: 'blockquote', label: 'Quote' },
    { accessibilityLabel: 'Inline code', command: 'inline-code', label: '</>' },
    { accessibilityLabel: 'Bullet list', command: 'bullet-list', label: 'List' },
    { accessibilityLabel: 'Numbered list', command: 'ordered-list', label: '1.' },
    { accessibilityLabel: 'Code block', command: 'code-block', label: 'Code' },
    { accessibilityLabel: 'Insert table', command: 'table', label: 'Table' },
];
const DEFAULT_COMPACT_MAX_HEIGHT = 110;
const DEFAULT_LINK_URL = 'https://';
const MAX_TABLE_COLUMNS = 10;
const MAX_TABLE_ROWS = 20;
const DEFAULT_PREVIEW_TOGGLE_LABELS = {
    hide: 'Hide preview',
    show: 'Show preview',
};
const normalizeUrl = (value) => {
    const trimmedValue = value.trim();
    if (trimmedValue.length === 0) {
        return DEFAULT_LINK_URL;
    }
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmedValue)) {
        return trimmedValue;
    }
    if (/^mailto:/i.test(trimmedValue) || /^tel:/i.test(trimmedValue)) {
        return trimmedValue;
    }
    return `https://${trimmedValue.replace(/^\/+/, '')}`;
};
const parsePositiveInteger = (value) => {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
};
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const getDefaultCommandPayload = (command) => {
    if (command === 'table') {
        return {
            command,
            table: {
                columns: 3,
                rows: 2,
            },
        };
    }
    if (command === 'link') {
        return {
            command,
            link: {
                url: DEFAULT_LINK_URL,
            },
        };
    }
    return { command };
};
const MarkdownComposer = react_1.default.forwardRef(function MarkdownComposer({ compactToolbarItems, composerStyle, expandedToolbarItems = DEFAULT_EXPANDED_TOOLBAR, initialMode = 'compact', minimizedToolbarItems, onModeChange, previewEnabled = false, previewEmptyState, previewLabel, previewProps, previewToggleLabels = DEFAULT_PREVIEW_TOGGLE_LABELS, resolveCommandPayload, renderExpandButtonLabel, style, textInputStyle, value, ...textInputProps }, ref) {
    var _a, _b;
    const [mode, setMode] = (0, react_1.useState)(initialMode);
    const [promptState, setPromptState] = (0, react_1.useState)(null);
    const [isPreviewVisible, setIsPreviewVisible] = (0, react_1.useState)(false);
    const promptResolverRef = (0, react_1.useRef)(null);
    const resolvedCompactToolbarItems = (_a = minimizedToolbarItems !== null && minimizedToolbarItems !== void 0 ? minimizedToolbarItems : compactToolbarItems) !== null && _a !== void 0 ? _a : DEFAULT_COMPACT_TOOLBAR;
    const promptError = (0, react_1.useMemo)(() => {
        if (!promptState) {
            return null;
        }
        if (promptState.command === 'link') {
            const url = promptState.url.trim();
            if (url.length === 0) {
                return null;
            }
            if (/\s/.test(url)) {
                return 'URLs cannot contain spaces.';
            }
            return null;
        }
        const parsedColumns = parsePositiveInteger(promptState.columns);
        const parsedRows = parsePositiveInteger(promptState.rows);
        if (parsedColumns === null || parsedRows === null) {
            return 'Columns and rows must be positive numbers.';
        }
        if (parsedColumns > MAX_TABLE_COLUMNS || parsedRows > MAX_TABLE_ROWS) {
            return `Tables are limited to ${MAX_TABLE_COLUMNS} columns and ${MAX_TABLE_ROWS} rows.`;
        }
        return null;
    }, [promptState]);
    const toolbarItems = (0, react_1.useMemo)(() => mode === 'compact'
        ? resolvedCompactToolbarItems
        : expandedToolbarItems, [expandedToolbarItems, mode, resolvedCompactToolbarItems]);
    const handleResolveCommandPayload = async (command) => {
        const resolvedPayload = await (resolveCommandPayload === null || resolveCommandPayload === void 0 ? void 0 : resolveCommandPayload(command));
        if (resolvedPayload === null) {
            return null;
        }
        if (resolvedPayload) {
            return resolvedPayload;
        }
        if (command === 'link') {
            return new Promise((resolve) => {
                promptResolverRef.current = resolve;
                setPromptState({
                    command,
                    title: '',
                    url: DEFAULT_LINK_URL,
                });
            });
        }
        if (command === 'table') {
            return new Promise((resolve) => {
                promptResolverRef.current = resolve;
                setPromptState({
                    command,
                    columns: '3',
                    rows: '2',
                });
            });
        }
        return getDefaultCommandPayload(command);
    };
    const closePrompt = () => {
        setPromptState(null);
        promptResolverRef.current = null;
    };
    const handleCancelPrompt = () => {
        var _a;
        (_a = promptResolverRef.current) === null || _a === void 0 ? void 0 : _a.call(promptResolverRef, null);
        closePrompt();
    };
    const handleApplyPrompt = () => {
        var _a, _b;
        if (!promptState || promptError) {
            return;
        }
        if (promptState.command === 'link') {
            (_a = promptResolverRef.current) === null || _a === void 0 ? void 0 : _a.call(promptResolverRef, {
                command: 'link',
                link: {
                    ...(promptState.title.trim().length > 0
                        ? { title: promptState.title.trim() }
                        : {}),
                    url: normalizeUrl(promptState.url),
                },
            });
            closePrompt();
            return;
        }
        const columns = Number.parseInt(promptState.columns, 10);
        const rows = Number.parseInt(promptState.rows, 10);
        (_b = promptResolverRef.current) === null || _b === void 0 ? void 0 : _b.call(promptResolverRef, {
            command: 'table',
            table: {
                columns: Number.isFinite(columns) && columns > 0
                    ? clamp(columns, 1, MAX_TABLE_COLUMNS)
                    : 3,
                rows: Number.isFinite(rows) && rows > 0
                    ? clamp(rows, 1, MAX_TABLE_ROWS)
                    : 2,
            },
        });
        closePrompt();
    };
    const toggleMode = () => {
        const nextMode = mode === 'compact' ? 'expanded' : 'compact';
        setMode(nextMode);
        onModeChange === null || onModeChange === void 0 ? void 0 : onModeChange(nextMode);
    };
    return (<react_native_1.View style={[style_1.default.container, composerStyle]}>
                <MarkdownTextInput_1.default {...textInputProps} enableShortcuts multiline numberOfLines={mode === 'expanded' ? 8 : 1} ref={ref} resolveCommandPayload={handleResolveCommandPayload} style={[style_1.default.textInput, style, textInputStyle]} toolbarItems={toolbarItems} value={value} {...(mode === 'compact'
        ? { compactMaxHeight: DEFAULT_COMPACT_MAX_HEIGHT }
        : {})}/>
                {promptState ? (<react_native_1.View style={style_1.default.promptCard}>
                        <react_native_1.Text style={style_1.default.promptTitle}>
                            {promptState.command === 'link' ? 'Insert link' : 'Insert table'}
                        </react_native_1.Text>
                        {promptState.command === 'link' ? (<>
                                <react_native_1.TextInput accessibilityLabel="Link text" onChangeText={(title) => setPromptState((currentState) => (currentState === null || currentState === void 0 ? void 0 : currentState.command) === 'link'
                    ? { ...currentState, title }
                    : currentState)} placeholder="Link text" style={style_1.default.promptInput} value={promptState.title}/>
                                <react_native_1.TextInput accessibilityLabel="Link URL" autoCapitalize="none" autoCorrect={false} keyboardType="url" onChangeText={(url) => setPromptState((currentState) => (currentState === null || currentState === void 0 ? void 0 : currentState.command) === 'link'
                    ? { ...currentState, url }
                    : currentState)} placeholder="https://example.com" style={style_1.default.promptInput} value={promptState.url}/>
                            </>) : (<>
                                <react_native_1.TextInput accessibilityLabel="Table columns" keyboardType="number-pad" onChangeText={(columns) => setPromptState((currentState) => (currentState === null || currentState === void 0 ? void 0 : currentState.command) === 'table'
                    ? { ...currentState, columns }
                    : currentState)} placeholder="Columns" style={style_1.default.promptInput} value={promptState.columns}/>
                                <react_native_1.TextInput accessibilityLabel="Table rows" keyboardType="number-pad" onChangeText={(rows) => setPromptState((currentState) => (currentState === null || currentState === void 0 ? void 0 : currentState.command) === 'table'
                    ? { ...currentState, rows }
                    : currentState)} placeholder="Rows" style={style_1.default.promptInput} value={promptState.rows}/>
                            </>)}
                        {promptError ? (<react_native_1.Text style={style_1.default.promptError}>{promptError}</react_native_1.Text>) : null}
                        <react_native_1.View style={style_1.default.promptActions}>
                            <react_native_1.Pressable accessibilityRole="button" accessibilityState={{ disabled: false }} onPress={handleCancelPrompt} style={[style_1.default.promptButton, style_1.default.promptButtonSecondary]}>
                                <react_native_1.Text style={style_1.default.promptButtonSecondaryText}>Cancel</react_native_1.Text>
                            </react_native_1.Pressable>
                            <react_native_1.Pressable accessibilityRole="button" accessibilityState={{ disabled: promptError !== null }} onPress={handleApplyPrompt} disabled={promptError !== null} style={[style_1.default.promptButton, style_1.default.promptButtonPrimary]}>
                                <react_native_1.Text style={style_1.default.promptButtonPrimaryText}>Apply</react_native_1.Text>
                            </react_native_1.Pressable>
                        </react_native_1.View>
                    </react_native_1.View>) : null}
                <react_native_1.View style={style_1.default.footer}>
                    {previewEnabled && mode === 'expanded' ? (<react_native_1.Pressable accessibilityRole="button" accessibilityState={{ expanded: isPreviewVisible }} onPress={() => setIsPreviewVisible((currentValue) => !currentValue)} style={style_1.default.previewToggle}>
                            <react_native_1.Text style={style_1.default.previewToggleText}>
                                {isPreviewVisible
                ? previewToggleLabels.hide
                : previewToggleLabels.show}
                            </react_native_1.Text>
                        </react_native_1.Pressable>) : null}
                    <react_native_1.Pressable accessibilityRole="button" accessibilityState={{ expanded: mode === 'expanded' }} onPress={toggleMode} style={style_1.default.expandButton}>
                        <react_native_1.Text style={style_1.default.expandButtonText}>
                            {(_b = renderExpandButtonLabel === null || renderExpandButtonLabel === void 0 ? void 0 : renderExpandButtonLabel(mode)) !== null && _b !== void 0 ? _b : (mode === 'compact' ? 'Expand' : 'Collapse')}
                        </react_native_1.Text>
                    </react_native_1.Pressable>
                </react_native_1.View>
                {previewEnabled && mode === 'expanded' && isPreviewVisible ? (<MarkdownPreview_1.default {...previewProps} {...(previewEmptyState ? { emptyState: previewEmptyState } : {})} {...(previewLabel ? { label: previewLabel } : {})} value={value}/>) : null}
            </react_native_1.View>);
});
MarkdownComposer.displayName = 'MarkdownComposer';
exports.default = MarkdownComposer;
//# sourceMappingURL=index.js.map
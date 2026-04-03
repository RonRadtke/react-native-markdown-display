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
const MarkdownPreview_1 = __importDefault(require("./MarkdownPreview"));
const MarkdownTextInput_1 = __importDefault(require("./MarkdownTextInput"));
const DEFAULT_COMPACT_TOOLBAR = [
    { accessibilityLabel: 'Bold', command: 'bold', label: 'B' },
    { accessibilityLabel: 'Italic', command: 'italic', label: 'I' },
    { accessibilityLabel: 'Insert link', command: 'link', label: 'Link' },
];
const DEFAULT_EXPANDED_TOOLBAR = [
    ...DEFAULT_COMPACT_TOOLBAR,
    { accessibilityLabel: 'Heading two', command: 'heading-two', label: 'H2' },
    { accessibilityLabel: 'Bullet list', command: 'bullet-list', label: 'List' },
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
const MarkdownComposer = react_1.default.forwardRef(function MarkdownComposer({ compactToolbarItems = DEFAULT_COMPACT_TOOLBAR, composerStyle, expandedToolbarItems = DEFAULT_EXPANDED_TOOLBAR, initialMode = 'compact', onModeChange, previewEnabled = false, previewEmptyState, previewLabel, previewToggleLabels = DEFAULT_PREVIEW_TOGGLE_LABELS, resolveCommandPayload, renderExpandButtonLabel, style, textInputStyle, value, ...textInputProps }, ref) {
    var _a;
    const [mode, setMode] = (0, react_1.useState)(initialMode);
    const [promptState, setPromptState] = (0, react_1.useState)(null);
    const [isPreviewVisible, setIsPreviewVisible] = (0, react_1.useState)(previewEnabled);
    const promptResolverRef = (0, react_1.useRef)(null);
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
    const toolbarItems = (0, react_1.useMemo)(() => (mode === 'compact' ? compactToolbarItems : expandedToolbarItems), [compactToolbarItems, expandedToolbarItems, mode]);
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
    return (<react_native_1.View style={[styles.container, composerStyle]}>
        <MarkdownTextInput_1.default {...textInputProps} enableShortcuts multiline numberOfLines={mode === 'expanded' ? 8 : 1} ref={ref} resolveCommandPayload={handleResolveCommandPayload} style={[styles.textInput, style, textInputStyle]} toolbarItems={toolbarItems} value={value} {...(mode === 'compact'
        ? { compactMaxHeight: DEFAULT_COMPACT_MAX_HEIGHT }
        : {})}/>
        {promptState ? (<react_native_1.View style={styles.promptCard}>
            <react_native_1.Text style={styles.promptTitle}>
              {promptState.command === 'link' ? 'Insert link' : 'Insert table'}
            </react_native_1.Text>
            {promptState.command === 'link' ? (<>
                <react_native_1.TextInput accessibilityLabel="Link text" onChangeText={(title) => setPromptState((currentState) => (currentState === null || currentState === void 0 ? void 0 : currentState.command) === 'link'
                    ? { ...currentState, title }
                    : currentState)} placeholder="Link text" style={styles.promptInput} value={promptState.title}/>
                <react_native_1.TextInput accessibilityLabel="Link URL" autoCapitalize="none" autoCorrect={false} keyboardType="url" onChangeText={(url) => setPromptState((currentState) => (currentState === null || currentState === void 0 ? void 0 : currentState.command) === 'link'
                    ? { ...currentState, url }
                    : currentState)} placeholder="https://example.com" style={styles.promptInput} value={promptState.url}/>
              </>) : (<>
                <react_native_1.TextInput accessibilityLabel="Table columns" keyboardType="number-pad" onChangeText={(columns) => setPromptState((currentState) => (currentState === null || currentState === void 0 ? void 0 : currentState.command) === 'table'
                    ? { ...currentState, columns }
                    : currentState)} placeholder="Columns" style={styles.promptInput} value={promptState.columns}/>
                <react_native_1.TextInput accessibilityLabel="Table rows" keyboardType="number-pad" onChangeText={(rows) => setPromptState((currentState) => (currentState === null || currentState === void 0 ? void 0 : currentState.command) === 'table'
                    ? { ...currentState, rows }
                    : currentState)} placeholder="Rows" style={styles.promptInput} value={promptState.rows}/>
              </>)}
            {promptError ? (<react_native_1.Text style={styles.promptError}>{promptError}</react_native_1.Text>) : null}
            <react_native_1.View style={styles.promptActions}>
              <react_native_1.Pressable accessibilityRole="button" accessibilityState={{ disabled: false }} onPress={handleCancelPrompt} style={[styles.promptButton, styles.promptButtonSecondary]}>
                <react_native_1.Text style={styles.promptButtonSecondaryText}>Cancel</react_native_1.Text>
              </react_native_1.Pressable>
              <react_native_1.Pressable accessibilityRole="button" accessibilityState={{ disabled: promptError !== null }} onPress={handleApplyPrompt} disabled={promptError !== null} style={[styles.promptButton, styles.promptButtonPrimary]}>
                <react_native_1.Text style={styles.promptButtonPrimaryText}>Apply</react_native_1.Text>
              </react_native_1.Pressable>
            </react_native_1.View>
          </react_native_1.View>) : null}
        <react_native_1.View style={styles.footer}>
          {previewEnabled && mode === 'expanded' ? (<react_native_1.Pressable accessibilityRole="button" accessibilityState={{ expanded: isPreviewVisible }} onPress={() => setIsPreviewVisible((currentValue) => !currentValue)} style={styles.previewToggle}>
              <react_native_1.Text style={styles.previewToggleText}>
                {isPreviewVisible
                ? previewToggleLabels.hide
                : previewToggleLabels.show}
              </react_native_1.Text>
            </react_native_1.Pressable>) : null}
          <react_native_1.Pressable accessibilityRole="button" accessibilityState={{ expanded: mode === 'expanded' }} onPress={toggleMode} style={styles.expandButton}>
            <react_native_1.Text style={styles.expandButtonText}>
              {(_a = renderExpandButtonLabel === null || renderExpandButtonLabel === void 0 ? void 0 : renderExpandButtonLabel(mode)) !== null && _a !== void 0 ? _a : (mode === 'compact' ? 'Expand' : 'Collapse')}
            </react_native_1.Text>
          </react_native_1.Pressable>
        </react_native_1.View>
        {previewEnabled && mode === 'expanded' && isPreviewVisible ? (<MarkdownPreview_1.default {...(previewEmptyState ? { emptyState: previewEmptyState } : {})} {...(previewLabel ? { label: previewLabel } : {})} value={value}/>) : null}
      </react_native_1.View>);
});
const styles = react_native_1.StyleSheet.create({
    container: {
        width: '100%',
    },
    expandButton: {
        alignSelf: 'flex-end',
        paddingVertical: 8,
    },
    expandButtonText: {
        color: '#0A66C2',
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        width: '100%',
    },
    previewToggle: {
        paddingVertical: 8,
    },
    previewToggleText: {
        color: '#5D6B79',
        fontSize: 14,
        fontWeight: '600',
    },
    promptError: {
        color: '#B42318',
        marginTop: 8,
    },
    promptActions: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'flex-end',
        marginTop: 12,
    },
    promptButton: {
        borderRadius: 6,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    promptButtonPrimary: {
        backgroundColor: '#0A66C2',
        borderColor: '#0A66C2',
    },
    promptButtonPrimaryText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    promptButtonSecondary: {
        borderColor: '#C7CCD1',
    },
    promptButtonSecondaryText: {
        color: '#2B3137',
        fontWeight: '600',
    },
    promptCard: {
        backgroundColor: '#F8FAFC',
        borderColor: '#D8E0E8',
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 12,
        padding: 12,
    },
    promptInput: {
        backgroundColor: '#FFFFFF',
        borderColor: '#C7CCD1',
        borderRadius: 6,
        borderWidth: 1,
        marginTop: 8,
        minHeight: 40,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    promptTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    textInput: {
        width: '100%',
    },
});
MarkdownComposer.displayName = 'MarkdownComposer';
exports.default = MarkdownComposer;
//# sourceMappingURL=MarkdownComposer.js.map
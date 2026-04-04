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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const formatMarkdown_1 = require("./commands/formatMarkdown");
const shortcuts_1 = require("./utils/shortcuts");
const selection_1 = require("./utils/selection");
const DEFAULT_TOOLBAR_ITEMS = [
    { accessibilityLabel: 'Bold', command: 'bold', label: 'B' },
    { accessibilityLabel: 'Italic', command: 'italic', label: 'I' },
    { accessibilityLabel: 'Inline code', command: 'inline-code', label: '</>' },
];
const DEFAULT_TOOLBAR_ACCESSIBILITY_LABELS = {
    bold: 'Bold',
    italic: 'Italic',
    strikethrough: 'Strikethrough',
    'inline-code': 'Inline code',
    'heading-one': 'Heading one',
    'heading-two': 'Heading two',
    'heading-three': 'Heading three',
    blockquote: 'Block quote',
    'bullet-list': 'Bullet list',
    'ordered-list': 'Ordered list',
    'code-block': 'Code block',
    link: 'Insert link',
    table: 'Insert table',
};
const isToolbarMenuItem = (item) => 'items' in item;
const isToolbarCommandItem = (item) => 'command' in item;
const getToolbarMenuAccessibilityLabel = (item) => {
    var _a;
    return (_a = item.accessibilityLabel) !== null && _a !== void 0 ? _a : (typeof item.label === 'string' || typeof item.label === 'number'
        ? `${item.label} menu`
        : 'Toolbar menu');
};
const getToolbarButtonAccessibilityLabel = (item) => {
    if (item.accessibilityLabel) {
        return item.accessibilityLabel;
    }
    if (isToolbarCommandItem(item)) {
        return DEFAULT_TOOLBAR_ACCESSIBILITY_LABELS[item.command];
    }
    if (typeof item.label === 'string' || typeof item.label === 'number') {
        return String(item.label);
    }
    return 'Toolbar action';
};
const getToolbarButtonKey = (item, index) => isToolbarCommandItem(item)
    ? `command:${item.command}:${index}`
    : `action:${index}`;
const renderToolbarLabel = (label) => typeof label === 'string' || typeof label === 'number' ? (<react_native_1.Text style={styles.toolbarButtonText}>{label}</react_native_1.Text>) : (<react_native_1.View style={styles.toolbarButtonContent}>{label}</react_native_1.View>);
const executeCommand = (value, selection, payload) => {
    switch (payload.command) {
        case 'bold':
        case 'italic':
        case 'strikethrough':
        case 'inline-code':
            return (0, formatMarkdown_1.applyInlineFormat)(value, selection, payload.command);
        case 'heading-one':
        case 'heading-two':
        case 'heading-three':
        case 'blockquote':
        case 'bullet-list':
        case 'ordered-list':
        case 'code-block':
            return (0, formatMarkdown_1.applyBlockFormat)(value, selection, payload.command);
        case 'link':
            return (0, formatMarkdown_1.applyLinkFormat)(value, selection, payload.link);
        case 'table':
            return (0, formatMarkdown_1.applyTableFormat)(value, selection, payload.table);
        default: {
            const exhaustiveCheck = payload.command;
            throw new Error(`Unsupported markdown command: ${String(exhaustiveCheck)}`);
        }
    }
};
const MarkdownTextInput = react_1.default.forwardRef(function MarkdownTextInput({ onChangeText, onCommand, onSelectionChange, inputComponent: InputComponent, selection, style, toolbarItems = DEFAULT_TOOLBAR_ITEMS, compactMaxHeight, enableShortcuts = true, multiline = true, numberOfLines, resolveCommandPayload, value, ...textInputProps }, ref) {
    const [internalSelection, setInternalSelection] = (0, react_1.useState)(() => (0, selection_1.normalizeSelection)(value, selection));
    const [contentHeight, setContentHeight] = (0, react_1.useState)(null);
    const [openMenuIndex, setOpenMenuIndex] = (0, react_1.useState)(null);
    const pendingSelectionValueRef = (0, react_1.useRef)(null);
    const normalizedSelection = (0, react_1.useMemo)(() => (0, selection_1.normalizeSelection)(value, selection !== null && selection !== void 0 ? selection : internalSelection), [internalSelection, selection, value]);
    const handleSelectionChange = (event) => {
        const pendingSelectionValue = pendingSelectionValueRef.current;
        if (pendingSelectionValue && pendingSelectionValue !== value) {
            onSelectionChange === null || onSelectionChange === void 0 ? void 0 : onSelectionChange(event);
            return;
        }
        if (pendingSelectionValue === value) {
            pendingSelectionValueRef.current = null;
        }
        if (!selection) {
            setInternalSelection(event.nativeEvent.selection);
        }
        onSelectionChange === null || onSelectionChange === void 0 ? void 0 : onSelectionChange(event);
    };
    const handleCommandPress = async (command) => {
        setOpenMenuIndex(null);
        const resolvedPayload = await (resolveCommandPayload === null || resolveCommandPayload === void 0 ? void 0 : resolveCommandPayload(command));
        if (resolvedPayload === null) {
            return;
        }
        const payload = resolvedPayload !== null && resolvedPayload !== void 0 ? resolvedPayload : { command };
        const result = executeCommand(value, normalizedSelection, payload);
        if (!selection) {
            pendingSelectionValueRef.current = result.value;
            setInternalSelection(result.selection);
        }
        onChangeText(result.value);
        onCommand === null || onCommand === void 0 ? void 0 : onCommand(payload, result);
    };
    const handleToolbarButtonPress = async (item) => {
        if (isToolbarCommandItem(item)) {
            await handleCommandPress(item.command);
            return;
        }
        setOpenMenuIndex(null);
        const result = (0, formatMarkdown_1.applyToolbarAction)(value, normalizedSelection, item.action);
        if (!selection) {
            pendingSelectionValueRef.current = result.value;
            setInternalSelection(result.selection);
        }
        onChangeText(result.value);
    };
    const handleContentSizeChange = (event) => {
        var _a;
        setContentHeight(event.nativeEvent.contentSize.height);
        (_a = textInputProps.onContentSizeChange) === null || _a === void 0 ? void 0 : _a.call(textInputProps, event);
    };
    const computedInputStyle = (0, react_1.useMemo)(() => [
        styles.input,
        compactMaxHeight !== undefined && contentHeight !== null
            ? {
                height: Math.min(Math.max(contentHeight, 44), compactMaxHeight),
                maxHeight: compactMaxHeight,
            }
            : null,
        style,
    ], [compactMaxHeight, contentHeight, style]);
    const handleChangeText = (nextValue) => {
        if (enableShortcuts) {
            const shortcutResult = (0, shortcuts_1.applyMarkdownShortcut)({
                nextValue,
                previousSelection: normalizedSelection,
                previousValue: value,
            });
            if (shortcutResult) {
                if (!selection) {
                    pendingSelectionValueRef.current = shortcutResult.value;
                    setInternalSelection(shortcutResult.selection);
                }
                onChangeText(shortcutResult.value);
                return;
            }
        }
        onChangeText(nextValue);
    };
    const inputProps = {
        ...textInputProps,
        multiline,
        numberOfLines,
        onChangeText: handleChangeText,
        onContentSizeChange: handleContentSizeChange,
        onSelectionChange: handleSelectionChange,
        selection: normalizedSelection,
        style: computedInputStyle,
        value,
    };
    return (<react_native_1.View style={styles.container}>
                {toolbarItems.length > 0 ? (<react_native_1.View style={styles.toolbar}>
                        {toolbarItems.map((item, index) => {
                if (isToolbarMenuItem(item)) {
                    const isMenuOpen = openMenuIndex === index;
                    return (<react_native_1.View key={`menu:${index}`} style={styles.toolbarMenuContainer}>
                                        <react_native_1.Pressable accessibilityLabel={getToolbarMenuAccessibilityLabel(item)} accessibilityRole="button" accessibilityState={{ expanded: isMenuOpen }} onPress={() => setOpenMenuIndex((currentIndex) => currentIndex === index
                            ? null
                            : index)} style={[
                            styles.toolbarButton,
                            isMenuOpen
                                ? styles.toolbarButtonActive
                                : null,
                        ]}>
                                            {renderToolbarLabel(item.label)}
                                        </react_native_1.Pressable>
                                        {isMenuOpen ? (<react_native_1.View style={styles.toolbarMenu}>
                                                {item.items.map((menuItem, menuItemIndex) => (<react_native_1.Pressable accessibilityLabel={getToolbarButtonAccessibilityLabel(menuItem)} accessibilityRole="button" key={getToolbarButtonKey(menuItem, menuItemIndex)} onPress={() => {
                                    handleToolbarButtonPress(menuItem);
                                }} style={styles.toolbarMenuButton}>
                                                        {renderToolbarLabel(menuItem.label)}
                                                    </react_native_1.Pressable>))}
                                            </react_native_1.View>) : null}
                                    </react_native_1.View>);
                }
                return (<react_native_1.Pressable accessibilityLabel={getToolbarButtonAccessibilityLabel(item)} accessibilityRole="button" key={getToolbarButtonKey(item, index)} onPress={() => {
                        handleToolbarButtonPress(item);
                    }} style={styles.toolbarButton}>
                                    {renderToolbarLabel(item.label)}
                                </react_native_1.Pressable>);
            })}
                    </react_native_1.View>) : null}
                {InputComponent ? (<InputComponent {...inputProps} ref={ref}/>) : (<react_native_1.TextInput {...inputProps} ref={ref}/>)}
            </react_native_1.View>);
});
const styles = react_native_1.StyleSheet.create({
    container: {
        width: '100%',
    },
    input: {
        borderColor: '#C7CCD1',
        borderRadius: 8,
        borderWidth: 1,
        minHeight: 44,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    toolbar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    toolbarButton: {
        alignItems: 'center',
        borderColor: '#C7CCD1',
        borderRadius: 6,
        borderWidth: 1,
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    toolbarButtonActive: {
        backgroundColor: '#EFF4F8',
        borderColor: '#0A66C2',
    },
    toolbarButtonContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    toolbarButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    toolbarMenu: {
        backgroundColor: '#FFFFFF',
        borderColor: '#C7CCD1',
        borderRadius: 8,
        borderWidth: 1,
        elevation: 3,
        gap: 6,
        left: 0,
        minWidth: 64,
        padding: 6,
        position: 'absolute',
        top: 38,
        zIndex: 1,
    },
    toolbarMenuButton: {
        alignItems: 'center',
        borderRadius: 6,
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    toolbarMenuContainer: {
        position: 'relative',
    },
});
MarkdownTextInput.displayName = 'MarkdownTextInput';
exports.default = MarkdownTextInput;
//# sourceMappingURL=MarkdownTextInput.js.map
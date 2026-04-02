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
exports.tokensToAST = exports.textStyleProps = exports.styles = exports.stringToTokens = exports.removeTextStyleProps = exports.renderRules = exports.parser = exports.openUrl = exports.MarkdownIt = exports.hasParents = exports.getUniqueID = exports.FitImage = exports.AstRenderer = void 0;
const markdown_it_1 = __importDefault(require("markdown-it"));
exports.MarkdownIt = markdown_it_1.default;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_fit_image_1 = __importDefault(require("react-native-fit-image"));
exports.FitImage = react_native_fit_image_1.default;
const AstRenderer_1 = __importDefault(require("./lib/AstRenderer"));
exports.AstRenderer = AstRenderer_1.default;
const parser_1 = __importDefault(require("./lib/parser"));
exports.parser = parser_1.default;
const renderRules_1 = __importDefault(require("./lib/renderRules"));
exports.renderRules = renderRules_1.default;
const styles_1 = require("./lib/styles");
Object.defineProperty(exports, "styles", { enumerable: true, get: function () { return styles_1.styles; } });
const textStyleProps_1 = __importDefault(require("./lib/data/textStyleProps"));
exports.textStyleProps = textStyleProps_1.default;
const getUniqueID_1 = __importDefault(require("./lib/util/getUniqueID"));
exports.getUniqueID = getUniqueID_1.default;
const hasParents_1 = __importDefault(require("./lib/util/hasParents"));
exports.hasParents = hasParents_1.default;
const openUrl_1 = __importDefault(require("./lib/util/openUrl"));
exports.openUrl = openUrl_1.default;
const removeTextStyleProps_1 = __importDefault(require("./lib/util/removeTextStyleProps"));
exports.removeTextStyleProps = removeTextStyleProps_1.default;
const stringToTokens_1 = require("./lib/util/stringToTokens");
Object.defineProperty(exports, "stringToTokens", { enumerable: true, get: function () { return stringToTokens_1.stringToTokens; } });
const tokensToAST_1 = __importDefault(require("./lib/util/tokensToAST"));
exports.tokensToAST = tokensToAST_1.default;
const getStyle = (mergeStyle, style) => {
    const useStyles = {};
    if (mergeStyle && style !== null) {
        Object.keys(style).forEach((styleName) => {
            var _a;
            useStyles[styleName] = {
                ...((_a = react_native_1.StyleSheet.flatten(style[styleName])) !== null && _a !== void 0 ? _a : {}),
            };
        });
        Object.keys(styles_1.styles).forEach((styleName) => {
            var _a;
            useStyles[styleName] = {
                ...styles_1.styles[styleName],
                ...((_a = react_native_1.StyleSheet.flatten(style[styleName])) !== null && _a !== void 0 ? _a : {}),
            };
        });
    }
    else {
        Object.assign(useStyles, styles_1.styles);
        if (style !== null) {
            Object.keys(style).forEach((styleName) => {
                var _a;
                useStyles[styleName] = {
                    ...((_a = react_native_1.StyleSheet.flatten(style[styleName])) !== null && _a !== void 0 ? _a : {}),
                };
            });
        }
    }
    Object.keys(useStyles).forEach((styleName) => {
        var _a;
        useStyles[`_VIEW_SAFE_${styleName}`] = (0, removeTextStyleProps_1.default)((_a = useStyles[styleName]) !== null && _a !== void 0 ? _a : {});
    });
    return react_native_1.StyleSheet.create(useStyles);
};
const getRenderer = (textComponent, renderer, rules, style, mergeStyle, onLinkPress, maxTopLevelChildren, topLevelMaxExceededItem, allowedImageHandlers, defaultImageHandler, debugPrintTree) => {
    if (renderer && rules) {
        console.warn('react-native-markdown-display you are using renderer and rules at the same time. This is not possible, props.rules is ignored');
    }
    if (renderer && style) {
        console.warn('react-native-markdown-display you are using renderer and style at the same time. This is not possible, props.style is ignored');
    }
    if (renderer) {
        return renderer;
    }
    const useStyles = getStyle(mergeStyle, style);
    return new AstRenderer_1.default({
        ...(0, renderRules_1.default)(textComponent),
        ...(rules !== null && rules !== void 0 ? rules : {}),
    }, useStyles, onLinkPress, maxTopLevelChildren, topLevelMaxExceededItem, allowedImageHandlers, defaultImageHandler, debugPrintTree);
};
const MarkdownComponent = react_1.default.memo(function MarkdownMemo({ children, textcomponent = react_native_1.Text, renderer = null, rules = null, style = null, mergeStyle = true, markdownit = (0, markdown_it_1.default)({
    typographer: true,
}), onLinkPress, maxTopLevelChildren = null, topLevelMaxExceededItem = <react_native_1.Text key="dotdotdot">...</react_native_1.Text>, allowedImageHandlers = [
    'data:image/png;base64',
    'data:image/gif;base64',
    'data:image/jpeg;base64',
    'https://',
    'http://',
], defaultImageHandler = 'https://', debugPrintTree = false, }) {
    const memoizedRenderer = (0, react_1.useMemo)(() => getRenderer(textcomponent, renderer, rules, style, mergeStyle, onLinkPress, maxTopLevelChildren, topLevelMaxExceededItem, allowedImageHandlers, defaultImageHandler, debugPrintTree), [
        allowedImageHandlers,
        debugPrintTree,
        defaultImageHandler,
        maxTopLevelChildren,
        mergeStyle,
        onLinkPress,
        renderer,
        rules,
        style,
        textcomponent,
        topLevelMaxExceededItem,
    ]);
    const memoizedParser = (0, react_1.useMemo)(() => markdownit, [markdownit]);
    return (0, parser_1.default)(children, memoizedRenderer.render, memoizedParser);
});
const Markdown = MarkdownComponent;
Markdown.displayName = 'Markdown';
exports.default = Markdown;
//# sourceMappingURL=index.js.map
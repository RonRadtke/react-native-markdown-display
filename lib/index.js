"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = {
            enumerable: true, get: function () {
                return m[k];
            }
        };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", {enumerable: true, value: v});
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
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
var __exportStar = (this && this.__exportStar) || function (m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : {"default": mod};
};
Object.defineProperty(exports, "__esModule", {value: true});
exports.tokensToAST = exports.textStyleProps = exports.styles = exports.stringToTokens = exports.removeTextStyleProps = exports.renderRules = exports.parser = exports.openUrl = exports.MarkdownIt = exports.hasParents = exports.getUniqueID = exports.FitImage = exports.AstRenderer = void 0;
const markdown_it_1 = __importDefault(require("markdown-it"));
exports.MarkdownIt = markdown_it_1.default;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_fit_image_1 = __importDefault(require("react-native-fit-image"));
exports.FitImage = react_native_fit_image_1.default;
const AstRenderer_1 = __importDefault(require("./lib/AstRenderer"));
exports.AstRenderer = AstRenderer_1.default;
const createRenderer_1 = require("./lib/createRenderer");
const parser_1 = __importDefault(require("./lib/parser"));
exports.parser = parser_1.default;
const renderRules_1 = __importDefault(require("./lib/renderRules"));
exports.renderRules = renderRules_1.default;
const styles_1 = require("./lib/styles");
Object.defineProperty(exports, "styles", {
    enumerable: true, get: function () {
        return styles_1.styles;
    }
});
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
Object.defineProperty(exports, "stringToTokens", {
    enumerable: true, get: function () {
        return stringToTokens_1.stringToTokens;
    }
});
const tokensToAST_1 = __importDefault(require("./lib/util/tokensToAST"));
exports.tokensToAST = tokensToAST_1.default;
__exportStar(require("./editor"), exports);
const MarkdownComponent = react_1.default.memo(function MarkdownMemo({
                                                                         children, textcomponent = react_native_1.Text, renderer = null, rules = null, style = null, mergeStyle = true, markdownit = (0, markdown_it_1.default)({
        typographer: true,
    }), onLinkPress, maxTopLevelChildren = null, topLevelMaxExceededItem = <react_native_1.Text key="dotdotdot">...</react_native_1.Text>, allowedImageHandlers = [
        'data:image/png;base64',
        'data:image/gif;base64',
        'data:image/jpeg;base64',
        'https://',
        'http://',
    ], defaultImageHandler = 'https://', debugPrintTree = false,
                                                                     }) {
    const memoizedRenderer = (0, react_1.useMemo)(() => (0, createRenderer_1.getRenderer)(textcomponent, renderer, rules, style, mergeStyle, onLinkPress, maxTopLevelChildren, topLevelMaxExceededItem, allowedImageHandlers, defaultImageHandler, debugPrintTree), [
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
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : {"default": mod};
};
Object.defineProperty(exports, "__esModule", {value: true});
exports.getRenderer = exports.getStyle = void 0;
const react_native_1 = require("react-native");
const AstRenderer_1 = __importDefault(require("./AstRenderer"));
const renderRules_1 = __importDefault(require("./renderRules"));
const styles_1 = require("./styles");
const removeTextStyleProps_1 = __importDefault(require("./util/removeTextStyleProps"));
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
exports.getStyle = getStyle;
const getRenderer = (textComponent = react_native_1.Text, renderer, rules, style, mergeStyle, onLinkPress, maxTopLevelChildren, topLevelMaxExceededItem, allowedImageHandlers, defaultImageHandler, debugPrintTree) => {
    if (renderer && rules) {
        console.warn('react-native-markdown-display you are using renderer and rules at the same time. This is not possible, props.rules is ignored');
    }
    if (renderer && style) {
        console.warn('react-native-markdown-display you are using renderer and style at the same time. This is not possible, props.style is ignored');
    }
    if (renderer) {
        return renderer;
    }
    const useStyles = (0, exports.getStyle)(mergeStyle, style);
    return new AstRenderer_1.default({
        ...(0, renderRules_1.default)(textComponent),
        ...(rules !== null && rules !== void 0 ? rules : {}),
    }, useStyles, onLinkPress, maxTopLevelChildren, topLevelMaxExceededItem, allowedImageHandlers, defaultImageHandler, debugPrintTree);
};
exports.getRenderer = getRenderer;
//# sourceMappingURL=createRenderer.js.map
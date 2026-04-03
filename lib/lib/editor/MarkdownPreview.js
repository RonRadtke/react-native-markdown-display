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
const markdown_it_1 = __importDefault(require("markdown-it"));
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const createRenderer_1 = require("../view/createRenderer");
const parser_1 = __importDefault(require("../view/parser"));
const MarkdownPreview = react_1.default.memo(function MarkdownPreview({ emptyState = 'Nothing to preview yet.', label = 'Preview', previewContainerStyle, style = null, value, }) {
    const renderer = (0, react_1.useMemo)(() => (0, createRenderer_1.getRenderer)(react_native_1.Text, null, null, style, true, undefined, null, <react_native_1.Text key="dotdotdot">...</react_native_1.Text>, [
        'data:image/png;base64',
        'data:image/gif;base64',
        'data:image/jpeg;base64',
        'https://',
        'http://',
    ], 'https://', false), [style]);
    const markdownit = (0, react_1.useMemo)(() => (0, markdown_it_1.default)({
        typographer: true,
    }), []);
    return (<react_native_1.View style={[styles.container, previewContainerStyle]}>
            <react_native_1.Text style={styles.label}>{label}</react_native_1.Text>
            {value.trim().length > 0 ? ((0, parser_1.default)(value, renderer.render, markdownit)) : (<react_native_1.Text style={styles.emptyState}>{emptyState}</react_native_1.Text>)}
        </react_native_1.View>);
});
const styles = react_native_1.StyleSheet.create({
    container: {
        borderColor: '#E2E7EC',
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 12,
        padding: 12,
    },
    emptyState: {
        color: '#68707A',
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
});
MarkdownPreview.displayName = 'MarkdownPreview';
exports.default = MarkdownPreview;
//# sourceMappingURL=MarkdownPreview.js.map
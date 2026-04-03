"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : {"default": mod};
};
Object.defineProperty(exports, "__esModule", {value: true});
exports.default = convertAdditionalStyles;
const css_to_react_native_1 = __importDefault(require("css-to-react-native"));

function convertAdditionalStyles(style) {
    const tuples = style
        .split(';')
        .map((rule) => {
            const [rawKey, rawValue] = rule.split(':');
            if (!rawKey || !rawValue) {
                return null;
            }
            return [rawKey.trim(), rawValue.trim()];
        })
        .filter((tuple) => tuple !== null);
    return (0, css_to_react_native_1.default)(tuples);
}

//# sourceMappingURL=convertAdditionalStyles.js.map
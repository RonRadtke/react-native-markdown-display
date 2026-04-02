"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = removeTextStyleProps;
const textStyleProps_1 = __importDefault(require("../data/textStyleProps"));
function removeTextStyleProps(style) {
    const cleanedStyle = { ...style };
    textStyleProps_1.default.forEach((propertyName) => {
        delete cleanedStyle[propertyName];
    });
    return cleanedStyle;
}
//# sourceMappingURL=removeTextStyleProps.js.map
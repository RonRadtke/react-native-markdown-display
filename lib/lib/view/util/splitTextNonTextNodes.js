"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = splitTextNonTextNodes;
const react_1 = __importDefault(require("react"));
function splitTextNonTextNodes(children) {
    return children.reduce((acc, childNode) => {
        if (!react_1.default.isValidElement(childNode)) {
            return acc;
        }
        if (typeof childNode.type !== 'string' &&
            'displayName' in childNode.type &&
            childNode.type.displayName === 'Text') {
            acc.textNodes.push(childNode);
        }
        else {
            acc.nonTextNodes.push(childNode);
        }
        return acc;
    }, { textNodes: [], nonTextNodes: [] });
}
//# sourceMappingURL=splitTextNonTextNodes.js.map
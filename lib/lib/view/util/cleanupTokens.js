"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTokens = cleanupTokens;
const getTokenTypeByToken_1 = __importDefault(require("./getTokenTypeByToken"));
const flattenInlineTokens_1 = __importDefault(require("./flattenInlineTokens"));
const renderInlineAsText_1 = __importDefault(require("./renderInlineAsText"));
function cleanupTokens(tokens) {
    const flattenedTokens = (0, flattenInlineTokens_1.default)(tokens);
    flattenedTokens.forEach((token) => {
        var _a;
        token.type = (0, getTokenTypeByToken_1.default)(token);
        if (token.type === 'image' || token.type === 'hardbreak') {
            token.block = true;
        }
        if (token.type === 'image' && token.attrs) {
            const altIndex = token.attrIndex('alt');
            if (altIndex > -1) {
                const altAttribute = token.attrs[altIndex];
                if (altAttribute) {
                    altAttribute[1] = (0, renderInlineAsText_1.default)((_a = token.children) !== null && _a !== void 0 ? _a : []);
                }
            }
        }
    });
    const stack = [];
    return flattenedTokens.reduce((acc, token) => {
        if (token.type === 'link' && token.nesting === 1) {
            stack.push(token);
        }
        else if (stack.length > 0 &&
            token.type === 'link' &&
            token.nesting === -1) {
            if (stack.some((stackToken) => stackToken.block)) {
                stack[0].type = 'blocklink';
                stack[0].block = true;
                token.type = 'blocklink';
                token.block = true;
            }
            stack.push(token);
            while (stack.length > 0) {
                const nextToken = stack.shift();
                if (nextToken) {
                    acc.push(nextToken);
                }
            }
        }
        else if (stack.length > 0) {
            stack.push(token);
        }
        else {
            acc.push(token);
        }
        return acc;
    }, []);
}
//# sourceMappingURL=cleanupTokens.js.map
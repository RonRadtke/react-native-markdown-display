"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = tokensToAST;
const getTokenTypeByToken_1 = __importDefault(require("./getTokenTypeByToken"));
const getUniqueID_1 = __importDefault(require("./getUniqueID"));
function createNode(token, tokenIndex) {
    var _a, _b, _c;
    const attributes = (_b = (_a = token.attrs) === null || _a === void 0 ? void 0 : _a.reduce((acc, [name, value]) => {
        acc[name] = value;
        return acc;
    }, {})) !== null && _b !== void 0 ? _b : {};
    return {
        type: (0, getTokenTypeByToken_1.default)(token),
        sourceType: token.type,
        sourceInfo: token.info,
        sourceMeta: token.meta,
        block: token.block,
        markup: token.markup,
        key: `${(0, getUniqueID_1.default)()}_${(0, getTokenTypeByToken_1.default)(token)}`,
        content: token.content,
        tokenIndex,
        index: 0,
        attributes,
        children: tokensToAST((_c = token.children) !== null && _c !== void 0 ? _c : []),
    };
}
function tokensToAST(tokens) {
    var _a;
    const stack = [];
    let children = [];
    for (const [tokenIndex, token] of tokens.entries()) {
        const astNode = createNode(token, tokenIndex);
        if (astNode.type === 'text' &&
            astNode.children.length === 0 &&
            astNode.content === '') {
            continue;
        }
        astNode.index = children.length;
        if (token.nesting === 1) {
            children.push(astNode);
            stack.push(children);
            children = astNode.children;
        }
        else if (token.nesting === -1) {
            children = (_a = stack.pop()) !== null && _a !== void 0 ? _a : children;
        }
        else {
            children.push(astNode);
        }
    }
    return children;
}
//# sourceMappingURL=tokensToAST.js.map
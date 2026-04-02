"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = groupTextTokens;
const Token_1 = __importDefault(require("./Token"));
function groupTextTokens(tokens) {
    const result = [];
    let hasGroup = false;
    tokens.forEach((token) => {
        if (!token.block && !hasGroup) {
            hasGroup = true;
            result.push(new Token_1.default('textgroup', 1));
            result.push(token);
        }
        else if (!token.block && hasGroup) {
            result.push(token);
        }
        else if (token.block && hasGroup) {
            hasGroup = false;
            result.push(new Token_1.default('textgroup', -1));
            result.push(token);
        }
        else {
            result.push(token);
        }
    });
    return result;
}
//# sourceMappingURL=groupTextTokens.js.map
"use strict";
Object.defineProperty(exports, "__esModule", {value: true});
exports.default = flattenInlineTokens;

function flattenInlineTokens(tokens) {
    return tokens.reduce((acc, currentToken) => {
        if (currentToken.type === 'inline' &&
            currentToken.children &&
            currentToken.children.length > 0) {
            acc.push(...flattenInlineTokens(currentToken.children));
        }
        else {
            acc.push(currentToken);
        }
        return acc;
    }, []);
}

//# sourceMappingURL=flattenInlineTokens.js.map
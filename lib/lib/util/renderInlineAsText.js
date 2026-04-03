"use strict";
Object.defineProperty(exports, "__esModule", {value: true});
exports.default = renderInlineAsText;

function renderInlineAsText(tokens) {
    var _a;
    let result = '';
    for (const token of tokens) {
        if (token.type === 'text') {
            result += token.content;
        }
        else if (token.type === 'image') {
            result += renderInlineAsText((_a = token.children) !== null && _a !== void 0 ? _a : []);
        }
    }
    return result;
}

//# sourceMappingURL=renderInlineAsText.js.map
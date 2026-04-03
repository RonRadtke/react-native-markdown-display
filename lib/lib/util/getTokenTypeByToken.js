"use strict";
Object.defineProperty(exports, "__esModule", {value: true});
exports.default = getTokenTypeByToken;
const regSelectOpenClose = /_open|_close/g;

function getTokenTypeByToken(token) {
    let cleanedType = 'unknown';
    if (token.type) {
        cleanedType = token.type.replace(regSelectOpenClose, '');
    }
    if (cleanedType === 'heading') {
        return `${cleanedType}${token.tag.slice(1)}`;
    }
    return cleanedType;
}

//# sourceMappingURL=getTokenTypeByToken.js.map
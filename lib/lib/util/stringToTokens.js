"use strict";
Object.defineProperty(exports, "__esModule", {value: true});
exports.stringToTokens = stringToTokens;

function stringToTokens(source, markdownIt) {
    try {
        return markdownIt.parse(source, {});
    } catch (error) {
        console.warn(error);
        return [];
    }
}

//# sourceMappingURL=stringToTokens.js.map
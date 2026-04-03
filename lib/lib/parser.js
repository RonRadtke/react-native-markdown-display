"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : {"default": mod};
};
Object.defineProperty(exports, "__esModule", {value: true});
exports.default = parser;
const groupTextTokens_1 = __importDefault(require("./util/groupTextTokens"));
const omitListItemParagraph_1 = __importDefault(require("./util/omitListItemParagraph"));
const cleanupTokens_1 = require("./util/cleanupTokens");
const stringToTokens_1 = require("./util/stringToTokens");
const tokensToAST_1 = __importDefault(require("./util/tokensToAST"));

function parser(source, renderer, markdownIt) {
    if (Array.isArray(source)) {
        return renderer(source);
    }
    const astTree = (0, tokensToAST_1.default)((0, omitListItemParagraph_1.default)((0, groupTextTokens_1.default)((0, cleanupTokens_1.cleanupTokens)((0, stringToTokens_1.stringToTokens)(source, markdownIt)))));
    return renderer(astTree);
}

//# sourceMappingURL=parser.js.map
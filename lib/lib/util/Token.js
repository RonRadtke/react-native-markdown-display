"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Token {
    constructor(type, nesting = 0, children = null, block = false) {
        this.attrs = null;
        this.content = '';
        this.info = '';
        this.markup = '';
        this.meta = null;
        this.tag = '';
        this.type = type;
        this.nesting = nesting;
        this.children = children;
        this.block = block;
    }
    attrIndex() {
        return -1;
    }
}
exports.default = Token;
//# sourceMappingURL=Token.js.map
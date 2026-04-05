"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMarkdownIt = void 0;
const markdown_it_1 = __importDefault(require("markdown-it"));
const underline_1 = require("./plugins/underline");
const createMarkdownIt = ({ plugins = [], typographer = true, underline = false, } = {}) => {
    const markdownIt = (0, markdown_it_1.default)({ typographer });
    if (underline) {
        markdownIt.use(underline_1.underlinePlugin);
    }
    plugins.forEach((plugin) => {
        markdownIt.use(plugin);
    });
    return markdownIt;
};
exports.createMarkdownIt = createMarkdownIt;
//# sourceMappingURL=createMarkdownIt.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : {"default": mod};
};
Object.defineProperty(exports, "__esModule", {value: true});
const react_native_1 = require("react-native");
const textStyleProps_1 = __importDefault(require("./data/textStyleProps"));
const convertAdditionalStyles_1 = __importDefault(require("./util/convertAdditionalStyles"));
const getUniqueID_1 = __importDefault(require("./util/getUniqueID"));

class AstRenderer {
    constructor(renderRules, style, onLinkPress, maxTopLevelChildren = null, topLevelMaxExceededItem = null, allowedImageHandlers = [], defaultImageHandler = null, debugPrintTree = false) {
        this.renderNode = (node, parentNodes, isRoot = false) => {
            var _a, _b;
            const renderFunction = this.getRenderFunction(node.type);
            const parents = [...parentNodes];
            if (this._debugPrintTree) {
                console.log(`${'-'.repeat(parents.length)}${node.type}`);
            }
            parents.unshift(node);
            let children = node.children.map((childNode) => this.renderNode(childNode, parents));
            if (node.type === 'link' || node.type === 'blocklink') {
                return renderFunction(node, children, [...parentNodes], this._style, this._onLinkPress);
            }
            if (node.type === 'image') {
                return renderFunction(node, children, [...parentNodes], this._style, this._allowedImageHandlers, this._defaultImageHandler);
            }
            if (children.length === 0 || node.type === 'list_item') {
                const styleObj = {};
                for (let index = parentNodes.length - 1; index >= 0; index -= 1) {
                    const parentNode = parentNodes[index];
                    let refStyle = {};
                    if (typeof parentNode.attributes.style === 'string') {
                        refStyle = (0, convertAdditionalStyles_1.default)(parentNode.attributes.style);
                    }
                    const parentStyle = this._style[parentNode.type];
                    if (parentStyle) {
                        refStyle = {
                            ...refStyle,
                            ...((_a = react_native_1.StyleSheet.flatten(parentStyle)) !== null && _a !== void 0 ? _a : {}),
                        };
                        if (parentNode.type === 'list_item') {
                            const nextParentNode = parentNodes[index + 1];
                            const contentStyle = (nextParentNode === null || nextParentNode === void 0 ? void 0 : nextParentNode.type) === 'bullet_list'
                                ? this._style.bullet_list_content
                                : (nextParentNode === null || nextParentNode === void 0 ? void 0 : nextParentNode.type) === 'ordered_list'
                                    ? this._style.ordered_list_content
                                    : undefined;
                            refStyle = {
                                ...refStyle,
                                ...((_b = react_native_1.StyleSheet.flatten(contentStyle)) !== null && _b !== void 0 ? _b : {}),
                            };
                        }
                    }
                    for (const propertyName of Object.keys(refStyle)) {
                        if (textStyleProps_1.default.includes(propertyName)) {
                            styleObj[propertyName] = refStyle[propertyName];
                        }
                    }
                }
                return renderFunction(node, children, [...parentNodes], this._style, styleObj);
            }
            if (isRoot &&
                this._maxTopLevelChildren !== null &&
                children.length > this._maxTopLevelChildren) {
                children = [
                    ...children.slice(0, this._maxTopLevelChildren),
                    this._topLevelMaxExceededItem,
                ];
            }
            return renderFunction(node, children, [...parentNodes], this._style);
        };
        this.render = (nodes) => {
            const root = {
                type: 'body',
                sourceType: 'body',
                sourceInfo: null,
                sourceMeta: null,
                block: true,
                key: (0, getUniqueID_1.default)(),
                content: '',
                markup: '',
                tokenIndex: -1,
                index: 0,
                attributes: {},
                children: [...nodes],
            };
            return this.renderNode(root, [], true);
        };
        this._renderRules = renderRules;
        this._style = style;
        this._onLinkPress = onLinkPress;
        this._maxTopLevelChildren = maxTopLevelChildren;
        this._topLevelMaxExceededItem = topLevelMaxExceededItem;
        this._allowedImageHandlers = allowedImageHandlers;
        this._defaultImageHandler = defaultImageHandler;
        this._debugPrintTree = debugPrintTree;
    }

    getRenderFunction(type) {
        var _a;
        const renderFunction = (_a = this._renderRules[type]) !== null && _a !== void 0 ? _a : this._renderRules.unknown;
        if (!renderFunction) {
            throw new Error(`Missing render rule: ${type}`);
        }
        if (!this._renderRules[type]) {
            console.warn(`Warning, unknown render rule encountered: ${type}. 'unknown' render rule used (by default, returns null - nothing rendered)`);
        }
        return renderFunction;
    }
}

exports.default = AstRenderer;
//# sourceMappingURL=AstRenderer.js.map
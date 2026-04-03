"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : {"default": mod};
};
Object.defineProperty(exports, "__esModule", {value: true});
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_fit_image_1 = __importDefault(require("react-native-fit-image"));
const textStyleProps_1 = __importDefault(require("./data/textStyleProps"));
const hasParents_1 = __importDefault(require("./util/hasParents"));
const openUrl_1 = __importDefault(require("./util/openUrl"));
const trimTrailingNewLine = (content) => content.endsWith('\n') ? content.slice(0, -1) : content;
const getStyleObject = (value) => {
    if (value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof value !== 'function') {
        return value;
    }
    return {};
};
const getOnLinkPress = (value) => typeof value === 'function' ? value : undefined;
const getAllowedImageHandlers = (value) => Array.isArray(value)
    ? value.filter((item) => typeof item === 'string')
    : [];
const getDefaultImageHandler = (value) => typeof value === 'string' ? value : value === null ? null : null;
const pickTextStyles = (inheritedStyles) => {
    const textStyles = {};
    for (const propertyName of Object.keys(inheritedStyles)) {
        if (textStyleProps_1.default.includes(propertyName)) {
            textStyles[propertyName] = inheritedStyles[propertyName];
        }
    }
    return textStyles;
};
const getBlockLinkAccessibilityLabel = (node) => {
    var _a;
    const imageAlt = (_a = node.children.find((child) => child.type === 'image')) === null || _a === void 0 ? void 0 : _a.attributes.alt;
    if (imageAlt && imageAlt.trim().length > 0) {
        return imageAlt;
    }
    const title = node.attributes.title;
    if (title && title.trim().length > 0) {
        return title;
    }
    const href = node.attributes.href;
    return href && href.trim().length > 0 ? href : undefined;
};
const renderRules = (Text) => ({
    unknown: () => null,
    body: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_body}>
        {children}
    </react_native_1.View>),
    heading1: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_heading1}>
        {children}
    </react_native_1.View>),
    heading2: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_heading2}>
        {children}
    </react_native_1.View>),
    heading3: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_heading3}>
        {children}
    </react_native_1.View>),
    heading4: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_heading4}>
        {children}
    </react_native_1.View>),
    heading5: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_heading5}>
        {children}
    </react_native_1.View>),
    heading6: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_heading6}>
        {children}
    </react_native_1.View>),
    hr: (node, _children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_hr}/>),
    strong: (node, children, _parent, styles) => (<Text key={node.key} style={styles.strong}>
        {children}
    </Text>),
    em: (node, children, _parent, styles) => (<Text key={node.key} style={styles.em}>
        {children}
    </Text>),
    s: (node, children, _parent, styles) => (<Text key={node.key} style={styles.s}>
        {children}
    </Text>),
    blockquote: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_blockquote}>
        {children}
    </react_native_1.View>),
    bullet_list: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_bullet_list}>
        {children}
    </react_native_1.View>),
    ordered_list: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_ordered_list}>
        {children}
    </react_native_1.View>),
    list_item: (node, children, parent, styles, inheritedStyles) => {
        var _a;
        const textStyles = pickTextStyles({
            ...getStyleObject(inheritedStyles),
            ...((_a = react_native_1.StyleSheet.flatten(styles.list_item)) !== null && _a !== void 0 ? _a : {}),
        });
        if ((0, hasParents_1.default)(parent, 'bullet_list')) {
            return (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_list_item}>
                <Text style={[textStyles, styles.bullet_list_icon]} accessible={false}>
                    {react_native_1.Platform.select({
                        android: '\u2022',
                        ios: '\u00B7',
                        default: '\u2022',
                    })}
                </Text>
                <react_native_1.View style={styles._VIEW_SAFE_bullet_list_content}>{children}</react_native_1.View>
            </react_native_1.View>);
        }
        if ((0, hasParents_1.default)(parent, 'ordered_list')) {
            const orderedList = parent.find((parentNode) => parentNode.type === 'ordered_list');
            const startValue = Number(orderedList === null || orderedList === void 0 ? void 0 : orderedList.attributes.start);
            const listItemNumber = Number.isFinite(startValue)
                ? startValue + node.index
                : node.index + 1;
            return (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_list_item}>
                <Text style={[textStyles, styles.ordered_list_icon]}>
                    {listItemNumber}
                    {node.markup}
                </Text>
                <react_native_1.View style={styles._VIEW_SAFE_ordered_list_content}>{children}</react_native_1.View>
            </react_native_1.View>);
        }
        return (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_list_item}>
            {children}
        </react_native_1.View>);
    },
    code_inline: (node, _children, _parent, styles, inheritedStyles) => (<Text key={node.key} style={[getStyleObject(inheritedStyles), styles.code_inline]}>
        {node.content}
    </Text>),
    code_block: (node, _children, _parent, styles, inheritedStyles) => (<Text key={node.key} style={[getStyleObject(inheritedStyles), styles.code_block]}>
        {trimTrailingNewLine(node.content)}
    </Text>),
    fence: (node, _children, _parent, styles, inheritedStyles) => (<Text key={node.key} style={[getStyleObject(inheritedStyles), styles.fence]}>
        {trimTrailingNewLine(node.content)}
    </Text>),
    table: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_table}>
        {children}
    </react_native_1.View>),
    thead: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_thead}>
        {children}
    </react_native_1.View>),
    tbody: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_tbody}>
        {children}
    </react_native_1.View>),
    th: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_th}>
        {children}
    </react_native_1.View>),
    tr: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_tr}>
        {children}
    </react_native_1.View>),
    td: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_td}>
        {children}
    </react_native_1.View>),
    link: (node, children, _parent, styles, onLinkPress) => (<react_native_1.Pressable accessibilityRole="link" key={node.key} onPress={() => (0, openUrl_1.default)(node.attributes.href, getOnLinkPress(onLinkPress))}>
        <Text style={styles.link}>{children}</Text>
    </react_native_1.Pressable>),
    blocklink: (node, children, _parent, styles, onLinkPress) => (<react_native_1.Pressable accessibilityLabel={getBlockLinkAccessibilityLabel(node)} accessibilityRole="link" key={node.key} onPress={() => (0, openUrl_1.default)(node.attributes.href, getOnLinkPress(onLinkPress))} style={styles.blocklink}>
        <react_native_1.View style={styles.image}>{children}</react_native_1.View>
    </react_native_1.Pressable>),
    image: (node, _children, _parent, styles, allowedImageHandlers, defaultImageHandler) => {
        const src = node.attributes.src;
        const alt = node.attributes.alt;
        const handlers = getAllowedImageHandlers(allowedImageHandlers);
        const fallbackHandler = getDefaultImageHandler(defaultImageHandler);
        if (!src) {
            return null;
        }
        const show = handlers.some((value) => src.toLowerCase().startsWith(value.toLowerCase()));
        if (!show && fallbackHandler === null) {
            return null;
        }
        const imageProps = {
            indicator: true,
            style: styles._VIEW_SAFE_image,
            source: {
                uri: show ? src : `${fallbackHandler}${src}`,
            },
        };
        if (alt) {
            imageProps.accessible = true;
            imageProps.accessibilityLabel = alt;
        }
        return <react_native_fit_image_1.default key={node.key} {...imageProps}/>;
    },
    text: (node, _children, _parent, styles, inheritedStyles) => (<Text key={node.key} style={[getStyleObject(inheritedStyles), styles.text]}>
        {node.content}
    </Text>),
    textgroup: (node, children, _parent, styles) => (<Text key={node.key} style={styles.textgroup}>
        {children}
    </Text>),
    paragraph: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_paragraph}>
        {children}
    </react_native_1.View>),
    hardbreak: (node, _children, _parent, styles) => (<Text key={node.key} style={styles.hardbreak}>
        {'\n'}
    </Text>),
    softbreak: (node, _children, _parent, styles) => (<Text key={node.key} style={styles.softbreak}>
        {'\n'}
    </Text>),
    pre: (node, children, _parent, styles) => (<react_native_1.View key={node.key} style={styles._VIEW_SAFE_pre}>
        {children}
    </react_native_1.View>),
    inline: (node, children, _parent, styles) => (<Text key={node.key} style={styles.inline}>
        {children}
    </Text>),
    span: (node, children, _parent, styles) => (<Text key={node.key} style={styles.span}>
        {children}
    </Text>),
});
exports.default = renderRules;
//# sourceMappingURL=renderRules.js.map
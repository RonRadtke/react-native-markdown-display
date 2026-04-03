import {Platform} from 'react-native';

import type {MarkdownStyleSheet} from './types';

export const styles: MarkdownStyleSheet = {
    body: {},
    heading1: {
        flexDirection: 'row',
        fontSize: 32,
    },
    heading2: {
        flexDirection: 'row',
        fontSize: 24,
    },
    heading3: {
        flexDirection: 'row',
        fontSize: 18,
    },
    heading4: {
        flexDirection: 'row',
        fontSize: 16,
    },
    heading5: {
        flexDirection: 'row',
        fontSize: 13,
    },
    heading6: {
        flexDirection: 'row',
        fontSize: 11,
    },
    hr: {
        backgroundColor: '#000000',
        height: 1,
    },
    strong: {
        fontWeight: 'bold',
    },
    em: {
        fontStyle: 'italic',
    },
    s: {
        textDecorationLine: 'line-through',
    },
    blockquote: {
        backgroundColor: '#F5F5F5',
        borderColor: '#CCC',
        borderLeftWidth: 4,
        marginLeft: 5,
        paddingHorizontal: 5,
    },
    bullet_list: {},
    ordered_list: {},
    list_item: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    bullet_list_icon: {
        marginLeft: 10,
        marginRight: 10,
    },
    bullet_list_content: {
        flex: 1,
    },
    ordered_list_icon: {
        marginLeft: 10,
        marginRight: 10,
    },
    ordered_list_content: {
        flex: 1,
    },
    code_inline: {
        borderWidth: 1,
        borderColor: '#CCCCCC',
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 4,
        ...Platform.select({
            ios: {
                fontFamily: 'Courier New',
            },
            android: {
                fontFamily: 'monospace',
            },
            default: {},
        }),
    },
    code_block: {
        borderWidth: 1,
        borderColor: '#CCCCCC',
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 4,
        ...Platform.select({
            ios: {
                fontFamily: 'Courier New',
            },
            android: {
                fontFamily: 'monospace',
            },
            default: {},
        }),
    },
    fence: {
        borderWidth: 1,
        borderColor: '#CCCCCC',
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 4,
        ...Platform.select({
            ios: {
                fontFamily: 'Courier New',
            },
            android: {
                fontFamily: 'monospace',
            },
            default: {},
        }),
    },
    table: {
        borderWidth: 1,
        borderColor: '#000000',
        borderRadius: 3,
    },
    thead: {},
    tbody: {},
    th: {
        flex: 1,
        padding: 5,
    },
    tr: {
        borderBottomWidth: 1,
        borderColor: '#000000',
        flexDirection: 'row',
    },
    td: {
        flex: 1,
        padding: 5,
    },
    link: {
        textDecorationLine: 'underline',
        marginBottom: -4,
    },
    blocklink: {
        flex: 1,
        borderColor: '#000000',
        borderBottomWidth: 1,
    },
    image: {
        flex: 1,
    },
    text: {},
    textgroup: {},
    paragraph: {
        marginTop: 10,
        marginBottom: 10,
        flexWrap: 'wrap',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        width: '100%',
    },
    hardbreak: {
        width: '100%',
        height: 1,
    },
    softbreak: {},
    pre: {},
    inline: {},
    span: {},
};

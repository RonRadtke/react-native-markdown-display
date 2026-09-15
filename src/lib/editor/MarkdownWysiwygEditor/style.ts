import {Platform, StyleSheet} from 'react-native';

const styles = StyleSheet.create({
    bold: {
        fontWeight: '700',
    },
    code: {
        backgroundColor: '#EFF4F8',
        fontFamily: Platform.select({
            android: 'monospace',
            default: 'Menlo',
            ios: 'Menlo',
        }),
    },
    headingOne: {
        fontSize: 26,
        fontWeight: '700',
        lineHeight: 32,
    },
    headingThree: {
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 24,
    },
    headingTwo: {
        fontSize: 21,
        fontWeight: '700',
        lineHeight: 28,
    },
    listMarker: {
        color: '#56606B',
    },
    input: {
        color: '#1F2933',
        fontSize: 16,
        lineHeight: 22,
        margin: 0,
        minHeight: 44,
        padding: 0,
        textAlignVertical: 'top',
        width: '100%',
    },
    italic: {
        fontStyle: 'italic',
    },
    strikethrough: {
        textDecorationLine: 'line-through',
    },
    underline: {
        textDecorationLine: 'underline',
    },
    underlineStrikethrough: {
        textDecorationLine: 'underline line-through',
    },
});

export default styles;

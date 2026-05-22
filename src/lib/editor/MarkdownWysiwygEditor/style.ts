import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
    container: {
        borderColor: '#C7CCD1',
        borderRadius: 8,
        borderWidth: 1,
        minHeight: 44,
        overflow: 'hidden',
        paddingHorizontal: 12,
        paddingVertical: 10,
        position: 'relative',
        width: '100%',
    },
    cursor: {
        backgroundColor: '#0A66C2',
        height: 20,
        marginHorizontal: 1,
        width: 2,
    },
    cursorRow: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        minHeight: 24,
    },
    hiddenInput: {
        height: 1,
        left: 0,
        opacity: 0,
        position: 'absolute',
        top: 0,
        width: 1,
    },
    placeholder: {
        color: '#7A8694',
        fontSize: 16,
        lineHeight: 22,
    },
    text: {
        color: '#1F2933',
        fontSize: 16,
        lineHeight: 22,
    },
});

export default styles;

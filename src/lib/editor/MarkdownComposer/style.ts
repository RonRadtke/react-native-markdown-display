import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    expandButton: {
        alignSelf: 'flex-end',
        paddingVertical: 8,
    },
    expandButtonText: {
        color: '#0A66C2',
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        width: '100%',
    },
    previewToggle: {
        paddingVertical: 8,
    },
    previewToggleText: {
        color: '#5D6B79',
        fontSize: 14,
        fontWeight: '600',
    },
    promptError: {
        color: '#B42318',
        marginTop: 8,
    },
    promptActions: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'flex-end',
        marginTop: 12,
    },
    promptButton: {
        borderRadius: 6,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    promptButtonPrimary: {
        backgroundColor: '#0A66C2',
        borderColor: '#0A66C2',
    },
    promptButtonPrimaryText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    promptButtonSecondary: {
        borderColor: '#C7CCD1',
    },
    promptButtonSecondaryText: {
        color: '#2B3137',
        fontWeight: '600',
    },
    promptCard: {
        backgroundColor: '#F8FAFC',
        borderColor: '#D8E0E8',
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 12,
        padding: 12,
    },
    promptInput: {
        backgroundColor: '#FFFFFF',
        borderColor: '#C7CCD1',
        borderRadius: 6,
        borderWidth: 1,
        marginTop: 8,
        minHeight: 40,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    promptTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    textInput: {
        width: '100%',
    },
});

export default styles;

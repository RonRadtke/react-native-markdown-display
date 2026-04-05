"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_native_1 = require("react-native");
const styles = react_native_1.StyleSheet.create({
    container: {
        width: '100%',
    },
    input: {
        borderColor: '#C7CCD1',
        borderRadius: 8,
        borderWidth: 1,
        minHeight: 44,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    toolbar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    toolbarButton: {
        alignItems: 'center',
        borderColor: '#C7CCD1',
        borderRadius: 6,
        borderWidth: 1,
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    toolbarButtonActive: {
        backgroundColor: '#EFF4F8',
        borderColor: '#0A66C2',
    },
    toolbarButtonContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    toolbarButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    toolbarMenu: {
        backgroundColor: '#FFFFFF',
        borderColor: '#C7CCD1',
        borderRadius: 8,
        borderWidth: 1,
        elevation: 3,
        gap: 6,
        left: 0,
        minWidth: 64,
        padding: 6,
        position: 'absolute',
        top: 38,
        zIndex: 1,
    },
    toolbarMenuButton: {
        alignItems: 'center',
        borderRadius: 6,
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    toolbarMenuContainer: {
        position: 'relative',
    },
});
exports.default = styles;
//# sourceMappingURL=style.js.map
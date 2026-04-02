"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = openUrl;
const react_native_1 = require("react-native");
function openUrl(url, customCallback) {
    if (!url) {
        return;
    }
    if (customCallback) {
        const result = customCallback(url);
        if (result === true) {
            react_native_1.Linking.openURL(url);
        }
        return;
    }
    react_native_1.Linking.openURL(url);
}
//# sourceMappingURL=openUrl.js.map
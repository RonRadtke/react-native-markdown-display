"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSelectedText = exports.normalizeSelection = void 0;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const normalizeSelection = (value, selection) => {
    const max = value.length;
    if (!selection) {
        return { start: max, end: max };
    }
    const start = clamp(selection.start, 0, max);
    const end = clamp(selection.end, 0, max);
    return start <= end ? { start, end } : { start: end, end: start };
};
exports.normalizeSelection = normalizeSelection;
const getSelectedText = (value, selection) => {
    const normalizedSelection = (0, exports.normalizeSelection)(value, selection);
    return value.slice(normalizedSelection.start, normalizedSelection.end);
};
exports.getSelectedText = getSelectedText;
//# sourceMappingURL=selection.js.map
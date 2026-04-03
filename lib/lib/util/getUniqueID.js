"use strict";
Object.defineProperty(exports, "__esModule", {value: true});
exports.default = getUniqueID;
let uuid = Date.now();

function getUniqueID() {
    uuid += 1;
    return `rnmr_${uuid.toString(16)}`;
}

//# sourceMappingURL=getUniqueID.js.map
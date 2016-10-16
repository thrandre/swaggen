"use strict";
var utils_1 = require("../../utils");
function expandIdentifier(identifier, typeInfo, required, shouldEscapeDots) {
    if (required === void 0) { required = true; }
    if (shouldEscapeDots === void 0) { shouldEscapeDots = true; }
    return "" + (shouldEscapeDots ? escapeDots(identifier) : identifier) + (!required ? "?" : "") + ": " + expandTypeInfo(typeInfo);
}
exports.expandIdentifier = expandIdentifier;
function expandTypeInfo(typeInfo) {
    return "" + typeInfo.type.name + (typeInfo.isCollection ? "[]" : "");
}
exports.expandTypeInfo = expandTypeInfo;
function escapeDots(identifier) {
    return identifier.replace(/\./g, "_");
}
exports.escapeDots = escapeDots;
function ifNotNull(target, func) {
    return target && func(target);
}
exports.ifNotNull = ifNotNull;
function createParameterHash(keys, shouldEscapeDots) {
    if (shouldEscapeDots === void 0) { shouldEscapeDots = true; }
    return keys.length > 0
        ? "{ " + keys.map(function (k) { return ("\"" + (escapeDots ? escapeDots(k) : k) + "\": " + k); }) + " }"
        : "{}";
}
exports.createParameterHash = createParameterHash;
function formatUri(uri, shouldEscapeDots) {
    if (shouldEscapeDots === void 0) { shouldEscapeDots = true; }
    return "`" + uri.replace(/\{(.*?)\}/g, function (sub) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return "${ " + shouldEscapeDots ? escapeDots(args[0]) : args[0] + " }";
    }) + "`";
}
exports.formatUri = formatUri;
function fixPath(path) {
    return utils_1.nixPath(path);
}
exports.fixPath = fixPath;
//# sourceMappingURL=helpers.js.map
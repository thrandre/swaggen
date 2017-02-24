"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
/*export function expandIdentifier(identifier: string, typeInfo: TypeInfo, required: boolean = true, shouldEscapeDots: boolean = true) {
    return `${ shouldEscapeDots ? escapeDots(identifier) : identifier }${ !required ? "?" : "" }: ${ expandTypeInfo(typeInfo) }`;
}*/
/*export function expandTypeInfo(typeInfo: TypeInfo) {
    return `${ typeInfo.type.name }${typeInfo.isCollection ? "[]" : ""}`;
}*/
function escapeDots(identifier) {
    return identifier.replace(/\./g, "_");
}
exports.escapeDots = escapeDots;
function ifNotNull(target, func) {
    return target && func(target);
}
exports.ifNotNull = ifNotNull;
function createParameterHash(keys, shouldEscapeDots = true) {
    return keys.length > 0
        ? `{ ${keys.map(k => `"${shouldEscapeDots ? escapeDots(k) : k}": ${k}`)} }`
        : "{}";
}
exports.createParameterHash = createParameterHash;
function formatUri(uri, shouldEscapeDots = true) {
    return "`" + uri.replace(/\{(.*?)\}/g, (_, ...args) => "${ " + shouldEscapeDots ? escapeDots(args[0]) : args[0] + " }") + "`";
}
exports.formatUri = formatUri;
function fixPath(path) {
    return utils_1.nixPath(path);
}
exports.fixPath = fixPath;
//# sourceMappingURL=helpers.js.map
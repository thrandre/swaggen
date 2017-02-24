"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const lodash_1 = require("lodash");
function readTemplate(filePath) {
    return fs_1.readFileSync(filePath).toString();
}
exports.readTemplate = readTemplate;
function resolveRelativePath(source, target, extension, keepExtension = false) {
    const path = path_1.join(path_1.relative(path_1.dirname(source), path_1.dirname(target)), path_1.basename(target, !keepExtension ? extension : ""));
    return nixPath(path);
}
exports.resolveRelativePath = resolveRelativePath;
function fixDot(path) {
    return !lodash_1.startsWith(path, "../")
        ? (!lodash_1.startsWith(path, "./")
            ? (!lodash_1.startsWith(path, "/")
                ? "./" + path
                : "." + path)
            : path)
        : path;
}
function nixPath(path) {
    return fixDot(path.replace(/\\/g, "/"));
}
exports.nixPath = nixPath;
function resolvePath(path, relativeTo = process.cwd()) {
    return path_1.resolve(relativeTo, path);
}
exports.resolvePath = resolvePath;
function use(target) {
    let defaultValue;
    const fns = {
        in(inFn) {
            return inFn(target ? target : (defaultValue ? defaultValue : target));
        },
        default(value) { defaultValue = value; return fns; }
    };
    return fns;
}
exports.use = use;
function toLookup(target, keySelector) {
    return target.reduce((p, n) => (Object.assign({}, p, { [keySelector(n)]: n })), {});
}
exports.toLookup = toLookup;
function findOrThrow(target, predicate) {
    const found = target.find(predicate);
    if (!found) {
        throw new Error("Found no matching items.");
    }
    return found;
}
exports.findOrThrow = findOrThrow;
function toMap(target, keySelector, transformValue) {
    const map = new Map();
    target.forEach(o => {
        const key = keySelector(o);
        const val = (transformValue ? transformValue(o) : o);
        if (map.has(key)) {
            map.get(key).push(val);
            return;
        }
        map.set(key, [val]);
    });
    return map;
}
exports.toMap = toMap;
//# sourceMappingURL=utils.js.map
"use strict";
var fs_1 = require("fs");
var path_1 = require("path");
var lodash_1 = require("lodash");
var types_1 = require("./types");
function readTemplate(filePath) {
    return fs_1.readFileSync(path_1.resolve(process.cwd(), filePath)).toString();
}
exports.readTemplate = readTemplate;
function resolveModulePath(module, baseDir, extension) {
    return baseDir + "/" + (_a = {},
        _a[types_1.ModuleType.Model] = "models",
        _a[types_1.ModuleType.Endpoint] = "endpoints",
        _a
    )[module.type] + "/" + module.name + (lodash_1.startsWith(extension, ".") ? extension : "." + extension);
    var _a;
}
exports.resolveModulePath = resolveModulePath;
function resolveRelativePath(source, target, extension, keepExtension) {
    if (keepExtension === void 0) { keepExtension = false; }
    return path_1.join(path_1.relative(path_1.dirname(source), path_1.dirname(target)), path_1.basename(target, !keepExtension ? extension : ""));
}
exports.resolveRelativePath = resolveRelativePath;
function resolveRelativeModulePath(source, target, extension, keepExtension) {
    if (keepExtension === void 0) { keepExtension = false; }
    var sourcePath = source.getPath(extension);
    var targetPath = target.getPath(extension);
    return resolveRelativePath(sourcePath, targetPath, extension, keepExtension);
}
exports.resolveRelativeModulePath = resolveRelativeModulePath;
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
function resolvePath(path) {
    return path_1.resolve(process.cwd(), path);
}
exports.resolvePath = resolvePath;
//# sourceMappingURL=utils.js.map
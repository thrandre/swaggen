"use strict";
var Fs = require("fs");
function removeDirectory(path) {
    if (Fs.existsSync(path)) {
        Fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (Fs.lstatSync(curPath).isDirectory()) {
                removeDirectory(curPath);
            }
            else {
                Fs.unlinkSync(curPath);
            }
        });
        Fs.rmdirSync(path);
    }
}
exports.removeDirectory = removeDirectory;
;
function ensureDirectoryExists(path) {
    if (Fs.existsSync(path)) {
        return;
    }
    Fs.mkdirSync(path);
}
exports.ensureDirectoryExists = ensureDirectoryExists;
function ensureDirectoriesExists() {
    var paths = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        paths[_i - 0] = arguments[_i];
    }
    var slicedPaths = paths.slice();
    slicedPaths.sort(function (a, b) { return a.length === b.length ? 0 : (b.length > a.length ? -1 : 1); });
    slicedPaths.forEach(function (p) { return ensureDirectoryExists(p); });
}
exports.ensureDirectoriesExists = ensureDirectoriesExists;
function writeFile(path, content) {
    Fs.writeFileSync(path, content);
}
exports.writeFile = writeFile;
//# sourceMappingURL=fsUtils.js.map
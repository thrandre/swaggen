"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
function removeDirectory(path) {
    if (Fs.existsSync(path)) {
        Fs.readdirSync(path).forEach(file => {
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
function ensureDirectoriesExists(...paths) {
    const slicedPaths = paths.slice();
    slicedPaths.sort((a, b) => a.length === b.length ? 0 : (b.length > a.length ? -1 : 1));
    slicedPaths.forEach(p => ensureDirectoryExists(p));
}
exports.ensureDirectoriesExists = ensureDirectoriesExists;
function writeFile(path, content) {
    Fs.writeFileSync(path, content);
}
exports.writeFile = writeFile;
//# sourceMappingURL=fsUtils.js.map
"use strict";
var path_1 = require("path");
var ejs_1 = require("ejs");
var lodash_1 = require("lodash");
var types_1 = require("../../types");
var utils_1 = require("../../utils");
var helpers = require("./helpers");
var modelTemplate = ejs_1.compile(utils_1.readTemplate("./modelTemplate.ejs"));
var endpointTemplate = ejs_1.compile(utils_1.readTemplate("./endpointTemplate.ejs"));
function emitModule(mod) {
    if (mod.type === types_1.ModuleType.Endpoint) {
        return endpointTemplate(lodash_1.assign({}, { helpers: helpers }, { module: mod }));
    }
    return modelTemplate(lodash_1.assign({}, { helpers: helpers }, { module: mod }));
}
function createModelIndex(modules, basePath) {
    var indexPath = utils_1.nixPath(path_1.join(basePath, 'models', 'index.ts'));
    //console.log(modules.map(m => m.members.map(mm => mm.type.name).join('+') + " - " + utils.nixPath(utils.resolveRelativePath(indexPath, m.getPath(".ts"), ".ts"))));
    return {
        path: indexPath,
        content: "Dette er en index"
    };
}
function isEndpoint(module) {
    return module.type === types_1.ModuleType.Endpoint;
}
function onBeforeEmit(modules) {
    modules.forEach(function (m) {
        if (isEndpoint(m)) {
            m.members.forEach(function (mm) {
                mm.methods.forEach(function (mmm) { return mmm.type.name = lodash_1.last(mmm.type.name.split('_')).toLowerCase(); });
            });
        }
    });
}
exports.onBeforeEmit = onBeforeEmit;
function emit(modules, basePath) {
    var modelIndex = createModelIndex(modules.filter(function (m) { return m.type === 1; }), basePath);
    return modules
        .map(function (m) { return ({
        path: m.getPath(".ts"),
        content: emitModule(m)
    }); })
        .concat([modelIndex]);
}
exports.emit = emit;
//# sourceMappingURL=index.js.map
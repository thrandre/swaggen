"use strict";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var types_1 = require("./types");
var swagger_1 = require("./parsers/swagger");
var api_1 = require("./api");
var processing_1 = require("./processing");
var utils_1 = require("./utils");
var fsUtils_1 = require("./fsUtils");
var lodash_1 = require("lodash");
function getIndexTypes(indexUnits) {
    return function () { return lodash_1.flatMap(indexUnits, function (m) { return m.type; }); };
}
function getPathResolver(baseDir) {
    return function (module, extension) { return utils_1.resolveModulePath(module, baseDir, extension); };
}
function cleanOutput(output) {
    return output.replace(/\r\n\s*\r\n/g, "\r\n");
}
function start(emitter, url, basePath) {
    api_1.getSwaggerResponse(url)
        .catch(function (err) { return console.error("Unable to contact swagger at: " + url); })
        .then(function (res) {
        var endpoints = swagger_1.getEndpoints(res);
        var models = swagger_1.getModels(res);
        var conversionMap = {
            "number": ["integer", "float", "double", "decimal"],
            "string": ["string"],
            "boolean": ["boolean", "bool"],
            "any": ["object", "system.object"],
            "void": ["void"]
        };
        var typeResolver = processing_1.getTypeResolver(processing_1.getLookupFn(conversionMap, models, lodash_1.flatMap(endpoints, function (e) { return e.methods; })));
        var mappedModels = processing_1.mapModels(models, typeResolver);
        var mappedEndpoints = processing_1.mapEndpoints(endpoints, typeResolver);
        var pathResolver = getPathResolver(basePath);
        var modelModuleCreator = processing_1.getModuleCreator(function (m) { return [m.type.name]; }, pathResolver, types_1.ModuleType.Model);
        var endpointModuleCreator = processing_1.getModuleCreator(function (e) { return e.methods.map(function (m) { return m.type.name; }); }, pathResolver, types_1.ModuleType.Endpoint);
        var modelGroups = processing_1.groupModels(mappedModels);
        var endpointGroups = processing_1.groupEndpoints(mappedEndpoints);
        var modelModules = Object.keys(modelGroups).map(function (name) { return modelModuleCreator(name, modelGroups[name]); });
        modelModules.forEach(function (m) { return m.dependencies = processing_1.resolveModuleDependencies(processing_1.getDependencyResolver(processing_1.getModelTypes), m, modelModules); });
        var endpointModules = Object.keys(endpointGroups).map(function (name) { return endpointModuleCreator(name, endpointGroups[name]); });
        endpointModules.forEach(function (m) { return m.dependencies = processing_1.resolveModuleDependencies(processing_1.getDependencyResolver(processing_1.getEndpointTypes), m, endpointModules.concat(modelModules)); });
        var modules = modelModules.concat(endpointModules);
        fsUtils_1.ensureDirectoriesExists(basePath, basePath + "/models", basePath + "/endpoints");
        emitter.onBeforeEmit(modules);
        var output = emitter.emit(modules, basePath);
        output.forEach(function (o) { return fsUtils_1.writeFile(o.path, o.content); });
    });
}
function getEmitter(path) {
    try {
        return require(utils_1.resolvePath(path));
    }
    catch (err) {
        throw new Error("Unable to resolve emitter \"" + path + "\": " + err);
    }
}
function run(emitterPath, flags) {
    if (!flags.url) {
        throw new Error("Missing required parameter \"url\"");
    }
    start(getEmitter(emitterPath), flags.url, flags.basePath || "./api");
}
exports.run = run;
//# sourceMappingURL=index.js.map
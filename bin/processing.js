"use strict";
var lodash_1 = require("lodash");
var utils_1 = require("./utils");
function getMethodFullName(method) {
    return method.tags.join("_") + "_" + method.name;
}
function getTypeLookupTable(builtins, models, methods) {
    return lodash_1.keyBy(builtins
        .map(function (b) { return ({ id: b, name: b, builtin: true }); })
        .concat(models.map(function (m) { return ({
        id: lodash_1.uniqueId("model-"),
        name: m.name,
        builtin: false
    }); }))
        .concat(methods.map(function (m) { return ({
        id: lodash_1.uniqueId("method-"),
        name: getMethodFullName(m),
        builtin: false
    }); })), function (i) { return i.name; });
}
function invertMap(map) {
    return lodash_1.flatMap(Object.keys(map), function (k) { return map[k].map(function (v) { return ({ key: k, val: v }); }); }).reduce(function (prev, next) {
        prev[next.val] = next.key;
        return prev;
    }, {});
}
function getLookupFn(conversionMap, models, methods) {
    var inverseMap = invertMap(conversionMap);
    var table = getTypeLookupTable(Object.keys(conversionMap), models, methods);
    return function (typeName) { return table[inverseMap[typeName.toLowerCase()] || typeName]; };
}
exports.getLookupFn = getLookupFn;
function getTypeResolver(lookup) {
    return function (name) {
        var type = lookup(name);
        if (!type) {
            throw new Error("Unable to resolve type " + name);
        }
        return type;
    };
}
exports.getTypeResolver = getTypeResolver;
function getTypeInfo(type, isCollection) {
    if (isCollection === void 0) { isCollection = false; }
    return {
        type: type,
        isCollection: isCollection
    };
}
function mapModels(models, resolveType) {
    return models.map(function (m) { return ({
        type: resolveType(m.name),
        properties: m.properties.map(function (p) { return ({
            name: p.name,
            typeInfo: getTypeInfo(resolveType(p.typeDescription.name), p.typeDescription.isCollection)
        }); })
    }); })
        .filter(function (m) { return !m.type.builtin; });
}
exports.mapModels = mapModels;
function mapEndpoints(endpoints, resolveType) {
    return endpoints.map(function (e) { return ({
        uri: e.uri,
        methods: e.methods.map(function (m) { return ({
            type: resolveType(getMethodFullName(m)),
            methodType: m.methodType,
            tags: m.tags,
            parameters: lodash_1.reverse(lodash_1.sortBy(m.parameters.map(function (p) { return ({
                name: p.name,
                parameterType: p.in,
                required: p.required,
                typeInfo: getTypeInfo(resolveType(p.typeDescription.name), p.typeDescription.isCollection)
            }); }), function (p) { return p.required; })),
            responses: m.responses.map(function (r) { return ({
                code: r.code,
                typeInfo: getTypeInfo(resolveType(r.typeDescription.name), r.typeDescription.isCollection)
            }); })
        }); })
    }); });
}
exports.mapEndpoints = mapEndpoints;
function getModelTypes(model) {
    return model.properties.map(function (p) { return p.typeInfo.type; });
}
exports.getModelTypes = getModelTypes;
function getEndpointTypes(endpoint) {
    return lodash_1.flatMap(endpoint.methods, function (m) { return m.parameters
        .map(function (p) { return p.typeInfo.type; })
        .concat(m.responses.map(function (r) { return r.typeInfo.type; })); });
}
exports.getEndpointTypes = getEndpointTypes;
function getDependencyResolver(getTypes) {
    return function (entity, module, modules) { return getDependencies(getTypes(entity), module, modules); };
}
exports.getDependencyResolver = getDependencyResolver;
function getDependencies(types, module, modules) {
    return lodash_1.uniq(types
        .filter(function (t) { return !t.builtin && !module.exports.some(function (m) { return m === t.name; }); })
        .map(function (t) {
        var dep = lodash_1.find(modules, function (m) { return m.exports.some(function (e) { return e === t.name; }); });
        if (!dep) {
            throw new Error("Dependency " + t.name + " not found.");
        }
        return {
            exportedName: t.name,
            moduleName: dep.name,
            getRelativePath: function (ext, keepExt) {
                if (keepExt === void 0) { keepExt = false; }
                return utils_1.resolveRelativeModulePath(module, dep, ext, keepExt);
            },
            type: dep.type
        };
    }));
}
function getModuleCreator(resolveExports, getPath, moduleType) {
    return function (name, units) {
        var module = {
            name: name,
            type: moduleType,
            members: units,
            exports: lodash_1.flatMap(units, resolveExports),
            getPath: null,
            dependencies: []
        };
        module.getPath = function (ext) { return getPath(module, ext); };
        return module;
    };
}
exports.getModuleCreator = getModuleCreator;
function resolveModuleDependencies(resolveDependencies, module, modules) {
    return lodash_1.groupBy(lodash_1.uniqBy(lodash_1.flatMap(module.members, function (mm) { return resolveDependencies(mm, module, modules); }), function (d) { return d.exportedName; }), function (record) { return record.moduleName; });
}
exports.resolveModuleDependencies = resolveModuleDependencies;
function groupModels(models) {
    return lodash_1.groupBy(models, function (m) { return m.type.name; });
}
exports.groupModels = groupModels;
function groupEndpoints(endpoints) {
    return lodash_1.groupBy(endpoints, function (e) { return e.methods[0].tags[0]; });
}
exports.groupEndpoints = groupEndpoints;
//# sourceMappingURL=processing.js.map
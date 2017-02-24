"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
function createProperty(metadata, dependencyResolver) {
    return {
        kind: "property",
        name: metadata.name,
        isArray: metadata.typeReference.isArray,
        type: dependencyResolver(metadata.typeReference.type.name)
    };
}
function createSchema(metadata, dependencyResolver) {
    return {
        kind: "schema",
        name: metadata.name,
        properties: metadata.properties.map(p => createProperty(p, dependencyResolver))
    };
}
function createEnum(metadata, dependencyResolver) {
    return {
        kind: "enum",
        name: metadata.name,
        values: metadata.enum
    };
}
function createAlias(metadata, dependencyResolver) {
    return {
        kind: "alias",
        name: metadata.name,
        type: dependencyResolver(metadata.type)
    };
}
function createParameter(metadata, dependencyResolver) {
    return {
        kind: "parameter",
        name: metadata.name,
        in: metadata.in,
        required: metadata.required,
        isArray: metadata.typeReference.isArray,
        type: dependencyResolver(metadata.typeReference.type.name)
    };
}
function createOperation(metadata, dependencyResolver) {
    return {
        kind: "operation",
        name: metadata.name,
        path: metadata.path,
        method: metadata.method,
        tags: metadata.tags,
        parameters: metadata.parameters.map(p => createParameter(p, dependencyResolver)),
        responses: metadata.responses.map(r => createResponse(r, dependencyResolver))
    };
}
function createResponse(metadata, dependencyResolver) {
    return {
        kind: "response",
        name: metadata.responseCode,
        code: metadata.responseCode,
        isArray: metadata.typeReference.isArray,
        type: dependencyResolver(metadata.typeReference.type.name)
    };
}
function createPrimitive(name) {
    return { kind: "primitive", name };
}
function getModuleDependencies(module) {
    if (module.getDependencies) {
        return module.getDependencies();
    }
    return lodash_1.flatMap(module.types, t => {
        switch (t.kind) {
            case "operation":
                return [...t.parameters.map(p => p.type), ...t.responses.map(p => p.type)];
            case "schema":
                return t.properties.map(p => p.type);
            case "alias":
                return [t.type];
            default: return [];
        }
    });
}
function createType(metadata, dependencyResolver) {
    switch (metadata.kind) {
        case "schema":
            if (metadata.type === "object") {
                return createSchema(metadata, dependencyResolver);
            }
            if (metadata.enum && metadata.enum.length > 0) {
                return createEnum(metadata, dependencyResolver);
            }
            if (metadata.type) {
                return createAlias(metadata, dependencyResolver);
            }
            return createPrimitive(metadata.name);
        case "operation":
            return createOperation(metadata, dependencyResolver);
    }
}
exports.createType = createType;
function getResolver(pool) {
    const validKinds = ["primitive", "alias", "enum", "schema"];
    return name => utils_1.use(pool.find(n => n.name === name && validKinds.some(v => v === n.kind)))
        .in(n => {
        if (!n) {
            throw new Error(`Unable to resolve type ${name}`);
        }
        return n;
    });
}
exports.getResolver = getResolver;
function getSchemaDependencies(metadata) {
    return [
        metadata.type,
        ...metadata.properties.map(p => p.typeReference.type.name)
    ];
}
exports.getSchemaDependencies = getSchemaDependencies;
function getOperationDependencies(metadata) {
    return [
        ...metadata.parameters.map(p => p.typeReference.type.name),
        ...metadata.responses.map(r => r.typeReference.type.name)
    ];
}
exports.getOperationDependencies = getOperationDependencies;
function resolveModuleDependencies(module, modules) {
    const deps = getModuleDependencies(module)
        .filter(t => t.kind !== "primitive" && !module.types.some(mt => mt === t))
        .map(t => ({ type: t, module: utils_1.findOrThrow(modules, mt => mt.types.some(mtt => mtt === t)) }));
    return utils_1.toMap(deps, i => i.module, i => i.type);
}
exports.resolveModuleDependencies = resolveModuleDependencies;
function createModule(name, ...types) {
    return {
        kind: "module",
        name,
        types
    };
}
exports.createModule = createModule;
//# sourceMappingURL=processing.js.map
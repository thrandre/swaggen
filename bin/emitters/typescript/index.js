"use strict";
const utils_1 = require("../../utils");
const path_1 = require("path");
const ejs_1 = require("ejs");
const Helpers = require("../helpers");
function getTemplate(name) {
    return utils_1.readTemplate(path_1.resolve(__dirname, name));
}
const dependencyDeclarationTemplate = ejs_1.compile(getTemplate("./dependencyTemplate.ejs"));
const aliasTemplate = ejs_1.compile(getTemplate("./aliasTemplate.ejs"));
const enumTemplate = ejs_1.compile(getTemplate("./enumTemplate.ejs"));
const schemaTemplate = ejs_1.compile(getTemplate("./schemaTemplate.ejs"));
const operationTemplate = ejs_1.compile(getTemplate("./operationTemplate.ejs"));
const helperTemplate = ejs_1.compile(getTemplate("./helperTemplate.ejs"));
const indexTemplate = ejs_1.compile(getTemplate("./indexTemplate.ejs"));
function isTopLevelType(type) {
    return type.kind === "schema" || type.kind === "alias" || type.kind === "enum";
}
function isOperationType(type) {
    return type.kind === "operation";
}
const primitiveMap = {
    integer: "number",
    number: "number",
    string: "string",
    boolean: "boolean"
};
function getTypeName(type, isArray = false) {
    if (type.kind === "operation") {
        return Helpers.camelCase(type.name);
    }
    return `${type.kind === "primitive" ? primitiveMap[type.name] : type.name}${isArray ? "[]" : ""}`;
}
function expandParameter(parameter) {
    return `${parameter.name}${parameter.required ? "" : "?"}: ${getTypeName(parameter.type, parameter.isArray)}`;
}
function expandResponses(responses) {
    return [getTypeName(responses[0].type, responses[0].isArray), "any"];
}
function getRelativeModulePath(fromModule, toModule) {
    return utils_1.resolveRelativePath(getModuleFilename(fromModule), getModuleFilename(toModule), ".ts");
}
function emitHelper(module, dependencies) {
    return helperTemplate({});
}
function emitIndex(module, dependencies) {
    return indexTemplate({
        module,
        dependencies,
        helpers: Object.assign({}, Helpers, { getTypeName,
            getRelativeModulePath })
    });
}
function emitDependencyDeclarations(module, dependencies) {
    return dependencyDeclarationTemplate({
        module,
        dependencies,
        helpers: Object.assign({}, Helpers, { getTypeName,
            getRelativeModulePath })
    });
}
function emitAlias(alias) {
    return aliasTemplate(Object.assign({}, Helpers, { alias, helpers: {
            getTypeName
        } }));
}
function emitEnum($enum) {
    return enumTemplate({
        $enum,
        helpers: Object.assign({}, Helpers)
    });
}
function emitSchema(schema) {
    return schemaTemplate({
        schema,
        helpers: Object.assign({}, Helpers, { getTypeName })
    });
}
function emitOperation(operation) {
    return operationTemplate({
        operation,
        helpers: Object.assign({}, Helpers, { expandParameter,
            expandResponses,
            getTypeName,
            convertPath(path) {
                return "`" + path.replace(/\{/g, "${") + "`";
            },
            getQuery(parameters) {
                const query = parameters.filter(p => p.in === "query").reduce((p, n) => Object.assign({}, p, { [n.name]: n.name }), {});
                return JSON.stringify(query);
            },
            getData(parameters) {
                return JSON.stringify(parameters.find(p => p.in === "body") || null);
            } })
    });
}
function getModuleFilename(module) {
    if (module === HELPER_MODULE || module === INDEX_MODULE) {
        return `${module.name}.ts`;
    }
    return `${isOperationType(module.types[0]) ? "operations" : "schemas"}/${module.name}.ts`;
}
const HELPER_MODULE = {
    kind: "module",
    name: "helper",
    types: [{ kind: "schema", name: "RequestInfo", properties: [] }]
};
const INDEX_MODULE = {
    kind: "module",
    name: "index",
    types: []
};
function createModules(types, createModule) {
    INDEX_MODULE.getDependencies = () => types.filter(t => isTopLevelType(t) || isOperationType(t));
    return [
        ...types
            .filter(isTopLevelType)
            .map(t => createModule(t.name, t)),
        ...types
            .filter(isOperationType)
            .map(t => createModule(t.name, t)),
        HELPER_MODULE,
        INDEX_MODULE
    ];
}
function emitModule(module, moduleDependencies) {
    if (module.types.some(t => t.kind === "operation")) {
        moduleDependencies.set(HELPER_MODULE, HELPER_MODULE.types);
    }
    if (module === HELPER_MODULE) {
        return emitHelper(module, moduleDependencies);
    }
    if (module === INDEX_MODULE) {
        return emitIndex(module, moduleDependencies);
    }
    return [
        emitDependencyDeclarations(module, moduleDependencies),
        ...module.types.map(t => {
            switch (t.kind) {
                case "alias":
                    return emitAlias(t);
                case "enum":
                    return emitEnum(t);
                case "schema":
                    return emitSchema(t);
                case "operation":
                    return emitOperation(t);
                default: return "";
            }
        })
    ]
        .filter(s => !!s)
        .join(Helpers.NEWLINE);
}
const api = {
    createModules,
    getModuleFilename,
    emitModule
};
module.exports = api;
//# sourceMappingURL=index.js.map
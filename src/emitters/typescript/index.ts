import { Alias, Emitter, Enum, Module, Operation, Parameter, Response, Schema, TopLevelType, Type } from '../../types';
import { readTemplate, resolveRelativePath } from "../../utils";

import { resolve } from "path";
import { compile } from "ejs";

import * as Helpers from "../helpers";

function getTemplate(name: string) {
    return readTemplate(resolve(__dirname, name));
}

const dependencyDeclarationTemplate = compile(getTemplate("./dependencyTemplate.ejs"));
const aliasTemplate = compile(getTemplate("./aliasTemplate.ejs"));
const enumTemplate = compile(getTemplate("./enumTemplate.ejs"));
const schemaTemplate = compile(getTemplate("./schemaTemplate.ejs"));
const operationTemplate = compile(getTemplate("./operationTemplate.ejs"));
const helperTemplate = compile(getTemplate("./helperTemplate.ejs"));
const indexTemplate= compile(getTemplate("./indexTemplate.ejs"));

function isTopLevelType(type: Type): type is TopLevelType {
    return type.kind === "schema" || type.kind === "alias" || type.kind === "enum";
}

function isOperationType(type: Type): type is Operation {
    return type.kind === "operation";
}

const primitiveMap = {
    integer: "number",
    number: "number",
    string: "string",
    boolean: "boolean"
};

function getTypeName(type: Type, isArray: boolean = false) {
    if(type.kind === "operation") {
        return Helpers.camelCase(type.name);
    }
    
    return `${type.kind === "primitive" ? (primitiveMap as any)[type.name] : type.name}${isArray ? "[]" : ""}`;
}

function expandParameter(parameter: Parameter) {
    return `${parameter.name}${parameter.required ? "" : "?"}: ${getTypeName(parameter.type, parameter.isArray)}`;
}

function expandResponses(responses: Response[]) {
    return [ getTypeName(responses[0].type, responses[0].isArray), "any" ];
}

function getRelativeModulePath(fromModule: Module, toModule: Module) {
    return resolveRelativePath(getModuleFilename(fromModule), getModuleFilename(toModule), ".ts");
}

function emitHelper(module: Module, dependencies: Map<Module, Type[]>) {
    return helperTemplate({});
}

function emitIndex(module: Module, dependencies: Map<Module, Type[]>) {
    return indexTemplate({
        module,
        dependencies,
        helpers: {
            ...Helpers,
            getTypeName,
            getRelativeModulePath
        }
    });
}

function emitDependencyDeclarations(module: Module, dependencies: Map<Module, Type[]>) {
    return dependencyDeclarationTemplate({
        module,
        dependencies,
        helpers: {
            ...Helpers,
            getTypeName,
            getRelativeModulePath
        }
    });
}

function emitAlias(alias: Alias) {
    return aliasTemplate({
        ...Helpers,
        alias,
        helpers: {
            getTypeName
        }
    });
}

function emitEnum($enum: Enum) {
    return enumTemplate({
        $enum,
        helpers: {
            ...Helpers
        }
    });
}

function emitSchema(schema: Schema) {
    return schemaTemplate({
        schema,
        helpers: {
            ...Helpers,
            getTypeName
        }
    });
}

function emitOperation(operation: Operation) {
    return operationTemplate({
        operation,
        helpers: {
            ...Helpers,
            expandParameter,
            expandResponses,
            getTypeName,
            convertPath(path: string) {
                return "`" + path.replace(/\{/g, "${") + "`";
            },
            getQuery(parameters: Parameter[]) {
                const query = parameters.filter(p => p.in === "query").reduce((p, n) => Object.assign({}, p, { [n.name]: n.name }), {});
                return JSON.stringify(query);
            },
            getData(parameters: Parameter[]) {
                return JSON.stringify(parameters.find(p => p.in === "body") || null);
            }
        }
    });
}

function getModuleFilename(module: Module) {
    if(module === HELPER_MODULE || module === INDEX_MODULE) {
        return `${module.name}.ts`;
    }

    return `${isOperationType(module.types[0]) ? "operations" : "schemas"}/${module.name}.ts`;
}

const HELPER_MODULE: Module = {
    kind: "module",
    name: "helper",
    types: [{ kind: "schema", name: "RequestInfo", properties: [] }]
};

const INDEX_MODULE: Module = {
    kind: "module",
    name: "index",
    types: []
};

function createModules(types: Type[], createModule: (name: string, ...types: Type[]) => Module) {
    INDEX_MODULE.getDependencies = () => types.filter(t => isTopLevelType(t) || isOperationType(t));

    return [
        ...(types as ReadonlyArray<Type>)
            .filter(isTopLevelType)
            .map(t => createModule(t.name, t)),
        ...(types as ReadonlyArray<Type>)
            .filter(isOperationType)
            .map(t => createModule(t.name, t)),
        HELPER_MODULE,
        INDEX_MODULE
    ];
}

function emitModule(module: Module, moduleDependencies: Map<Module, Type[]>) {
    if(module.types.some(t => t.kind === "operation")) {
        moduleDependencies.set(HELPER_MODULE, HELPER_MODULE.types);
    }

    if(module === HELPER_MODULE) {
        return emitHelper(module, moduleDependencies);
    }

    if(module === INDEX_MODULE) {
        return emitIndex(module, moduleDependencies);
    }

    return [
        emitDependencyDeclarations(module, moduleDependencies),
        ...module.types.map(t => {
            switch(t.kind) {
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

const api: Emitter = {
    createModules,
    getModuleFilename,
    emitModule
};

export = api;

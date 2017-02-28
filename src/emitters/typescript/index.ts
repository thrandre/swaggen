import {
    Alias,
    Emitter,
    Enum,
    Module,
    Operation,
    Parameter,
    Property,
    Response,
    Schema,
    TopLevelType,
    Type
} from '../../types';
import { readTemplate, resolveRelativePath } from "../../utils";

import { resolve } from "path";
import { compile } from "ejs";

import { use } from "../../utils";
import { Extension } from "../../types";

import { groupBy } from "lodash";

import * as Helpers from '../helpers';

function getTemplate(name: string) {
    return readTemplate(resolve(__dirname, name));
}

const dependencyDeclarationTemplate = compile(getTemplate("./dependencyTemplate.ejs"));
const aliasTemplate = compile(getTemplate("./aliasTemplate.ejs"));
const enumTemplate = compile(getTemplate("./enumTemplate.ejs"));
const schemaTemplate = compile(getTemplate("./schemaTemplate.ejs"));
const operationTemplate = compile(getTemplate("./operationTemplate.ejs"));
const helperTemplate = compile(getTemplate("./helperTemplate.ejs"));
const indexTemplate = compile(getTemplate("./indexTemplate.ejs"));

function isTopLevelType(type: Type): type is TopLevelType {
    return type.kind === "schema" || type.kind === "alias" || type.kind === "enum";
}

function isOperationType(type: Type): type is Operation {
    return type.kind === "operation";
}

const primitiveMap = {
    integer: "number",
    long: "number",
    float: "number",
    double: "number",
    string: "string",
    byte: "string",
    binary: "string",
    date: "string",
    datetime: "string",
    password: "string",
    boolean: "boolean",
    void: "void"
};

const primitiveMappingMap = {
    datetime: "Date"
};

namespace Utils {
    export function ifNotNull<TTarget, TResult>(target: TTarget, func: (target: TTarget) => TResult): TResult {
        return target && func(target);
    }

    export function getTypeName(type: Type, isArray: boolean = false, ...extensions: Extension[]) {
        const arrify = (name: string) => isArray ? `${name}[]` : name;

        if (type.kind === "operation") {
            return Helpers.camelCase(type.name);
        }

        if (type.kind === "primitive") {
            if(extensions.includes("x-primitive-mapping")) {
                return arrify((primitiveMappingMap as any)[type.name] || (primitiveMap as any)[type.name]);
            }
            
            return arrify((primitiveMap as any)[type.name]);
        }

        return arrify(type.name);
    }

    export function expandParameter(parameter: Parameter) {
        return `${parameter.name}${parameter.required ? "" : "?"}: ${getTypeName(parameter.type, parameter.isArray)}`;
    }

    export function expandProperty(property: Property, ...extensions: Extension[]) {
        return `${property.name}${property.required ? "" : "?"}: ${getTypeName(property.type, property.isArray, ...extensions)}`;
    }

    export function expandResponses(responses: Response[]) {
        return [getTypeName(responses[0].type, responses[0].isArray), "any"];
    }

    export function getRelativeModulePath(fromModule: Module, toModule: Module) {
        return resolveRelativePath(getModuleFilename(fromModule), getModuleFilename(toModule), ".ts");
    }

    export function convertPath(path: string) {
        return "`" + path.replace(/\{/g, "${") + "`";
    }

    export function getQuery(parameters: Parameter[]) {
        const query = parameters.filter(p => p.in === "query").reduce((p, n) => Object.assign({}, p, { [n.name]: n.name }), {});
        return JSON.stringify(query);
    }

    export function getData(parameters: Parameter[]) {
        const bodyParam = parameters.find(p => p.in === "body");

        if (bodyParam) {
            return bodyParam.name;
        }

        return "null";
    }

    export function getBodyParameter(parameters: Parameter[]) {
        return parameters.find(p => p.in === "body");
    }

    export function shouldProvideMappers(...extensions: Extension[]) {
        return extensions.includes("x-primitive-mapping");
    }

    export function shouldMap(type: Type, ...extensions: Extension[]) {
        return type && Object.keys(getPlucker(type)).length > 0;
    }

    export function getPlucker(type: Type): any {
        if(type.kind !== "schema") {
            return {};
        }

        return type.properties
            .filter(p => p.type.kind === "schema" || (p.type.kind === "primitive" && p.type.name === "datetime"))
            .reduce((prev, next) => Object.assign(
                prev,
                next.type.kind === "schema" ?
                    use(getPlucker(next.type)).in(v => Object.keys(v).length > 0 ? {[next.name]: v} : {}):
                    {[next.name]: null}
            ), {});
    }
}

function emitHelper(module: Module, dependencies: Map<Module, Type[]>, ...extensions: Extension[]) {
    return helperTemplate({});
}

function emitIndex(module: Module, dependencies: Map<Module, Type[]>, ...extensions: Extension[]) {
    return indexTemplate({
        module,
        dependencies,
        extensions,
        helpers: {
            ...Helpers,
            ...Utils
        }
    });
}

function emitDependencyDeclarations(module: Module, dependencies: Map<Module, Type[]>, ...extensions: Extension[]) {
    return dependencyDeclarationTemplate({
        module,
        dependencies,
        extensions,
        helpers: {
            ...Helpers,
            ...Utils
        }
    });
}

function emitAlias(alias: Alias, ...extensions: Extension[]) {
    return aliasTemplate({
        alias,
        extensions,
        helpers: {
            ...Helpers,
            ...Utils
        }
    });
}

function emitEnum($enum: Enum, ...extensions: Extension[]) {
    return enumTemplate({
        $enum,
        extensions,
        helpers: {
            ...Helpers,
            ...Utils
        }
    });
}

function emitSchema(schema: Schema, ...extensions: Extension[]) {
    return schemaTemplate({
        schema,
        extensions,
        helpers: {
            ...Helpers,
            ...Utils
        }
    });
}

function emitOperation(operation: Operation, ...extensions: Extension[]) {
    return operationTemplate({
        operation,
        extensions,
        shouldMap: Utils.shouldProvideMappers(...extensions),
        shouldMapTo: Utils.shouldProvideMappers(...extensions) &&
            Utils.shouldMap(Utils.ifNotNull(Utils.getBodyParameter(operation.parameters), (p: Parameter) => p.type)),
        shouldMapFrom: Utils.shouldProvideMappers(...extensions) &&
            Utils.shouldMap(operation.responses[0].type),
        helpers: {
            ...Helpers,
            ...Utils
        }
    });
}

function getModuleFilename(module: Module) {
    if (module === HELPER_MODULE || module === INDEX_MODULE) {
        return `${module.name}.ts`;
    }

    return `${isOperationType(module.types[0]) ? "operations" : "schemas"}/${module.name}.ts`;
}

const HELPER_MODULE: Module = {
    kind: "module",
    name: "helpers",
    types: [
        { kind: "schema", name: "RequestInfo", properties: [] },
        { kind: "schema", name: "Mappers", properties: [] }
    ]
};

const INDEX_MODULE: Module = {
    kind: "module",
    name: "index",
    types: []
};

function createModules(types: Type[], createModule: (name: string, ...types: Type[]) => Module) {
    return [
        ...(types as ReadonlyArray<Type>)
            .filter(isTopLevelType)
            .map(t => createModule(t.name, t)),
        ...Object.values(
            groupBy(
                (types as ReadonlyArray<Type>)
                .filter(isOperationType), t => t.tags[0]
            )
        )
        .map(t => createModule(t[0].tags[0], ...t)),
        HELPER_MODULE,
        use(INDEX_MODULE).in(m => {
            m.getDependencies = () => types.filter(t => isTopLevelType(t) || isOperationType(t));
            return m;
        })
    ];
}

function emitModule(
    module: Module,
    moduleDependencies: Map<Module, Type[]>,
    ...extensions: Extension[]
) {
    if (module.types.some(t => t.kind === "operation")) {
        moduleDependencies.set(
            HELPER_MODULE, 
            HELPER_MODULE.types
                .filter(t => t.name !== "Mappers" || extensions.includes("x-primitive-mapping"))
        );
    }

    if (module === HELPER_MODULE) {
        return emitHelper(module, moduleDependencies);
    }

    if (module === INDEX_MODULE) {
        return emitIndex(module, moduleDependencies);
    }

    return [
        emitDependencyDeclarations(module, moduleDependencies, ...extensions),
        ...module.types.map(type => {
            switch (type.kind) {
                case "alias":
                    return emitAlias(type, ...extensions);
                case "enum":
                    return emitEnum(type, ...extensions);
                case "schema":
                    return emitSchema(type, ...extensions);
                case "operation":
                    return emitOperation(type, ...extensions);

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

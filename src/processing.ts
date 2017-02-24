import {
    Schema,
    Property,
    Parameter,
    Operation,
    TopLevelType,
    DependencyResolver,
    Enum,
    Alias,
    Response,
    Type,
    Primitive,
    Module
} from "./types";

import { flatMap } from "lodash";
import { findOrThrow, use, toMap } from "./utils";

import * as Swagger from "./parsers/swagger";

function createProperty(metadata: Swagger.PropertyMetadata, dependencyResolver: DependencyResolver): Property {
    return {
        kind: "property",
        name: metadata.name,
        isArray: metadata.typeReference.isArray,
        type: dependencyResolver(metadata.typeReference.type.name)
    };
}

function createSchema(metadata: Swagger.SchemaMetadata, dependencyResolver: DependencyResolver): Schema {
    return {
        kind: "schema",
        name: metadata.name,
        properties: metadata.properties.map(p => createProperty(p, dependencyResolver))
    };
}

function createEnum(metadata: Swagger.SchemaMetadata, dependencyResolver: DependencyResolver): Enum {
    return {
        kind: "enum",
        name: metadata.name,
        values: metadata.enum
    };
}

function createAlias(metadata: Swagger.SchemaMetadata, dependencyResolver: DependencyResolver): Alias {
    return {
        kind: "alias",
        name: metadata.name,
        type: dependencyResolver(metadata.type)
    };
}

function createParameter(metadata: Swagger.ParameterMetadata, dependencyResolver: DependencyResolver): Parameter {
    return {
        kind: "parameter",
        name: metadata.name,
        in: metadata.in,
        required: metadata.required,
        isArray: metadata.typeReference.isArray,
        type: dependencyResolver(metadata.typeReference.type.name)
    };
}

function createOperation(metadata: Swagger.OperationMetadata, dependencyResolver: DependencyResolver): Operation {
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

function createResponse(metadata: Swagger.ResponseMetadata, dependencyResolver: DependencyResolver): Response {
    return {
        kind: "response",
        name: metadata.responseCode,
        code: metadata.responseCode,
        isArray: metadata.typeReference.isArray,
        type: dependencyResolver(metadata.typeReference.type.name)
    };
}

function createPrimitive(name: string): Primitive {
    return { kind: "primitive", name };
}

function getModuleDependencies(module: Module): Type[] {
    if(module.getDependencies) {
        return module.getDependencies();
    }
    
    return flatMap(module.types, t => {
        switch(t.kind) {
            case "operation":
                return [ ...t.parameters.map(p => p.type), ...t.responses.map(p => p.type) ];
            case "schema":
                return t.properties.map(p => p.type);
            case "alias":
                return [ t.type ];
            default: return [];
        }
    });
}

export function createType(metadata: Swagger.EntityMetadata, dependencyResolver: DependencyResolver): Type {
    switch(metadata.kind) {
        case "schema":
            if(metadata.type === "object") {
                return createSchema(metadata, dependencyResolver);
            }

            if(metadata.enum && metadata.enum.length > 0) {
                return createEnum(metadata, dependencyResolver);
            }

            if(metadata.type) {
                return createAlias(metadata, dependencyResolver);
            }

            return createPrimitive(metadata.name);
        
        case "operation":
            return createOperation(metadata, dependencyResolver);
    }
}

export function getResolver<T extends Type>(pool: T[]): (name: string) => TopLevelType {
    const validKinds = [ "primitive", "alias", "enum", "schema" ];
    
    return name => use(pool.find(n => n.name === name && validKinds.some(v => v === n.kind)))
        .in(n => {
            if(!n) {
                throw new Error(`Unable to resolve type ${name}`);
            }

            return n;
        }) as TopLevelType;
}

export function getSchemaDependencies(metadata: Swagger.SchemaMetadata) {
    return [ 
        metadata.type,
        ...metadata.properties.map(p => p.typeReference.type.name)
    ];
}

export function getOperationDependencies(metadata: Swagger.OperationMetadata) {
    return [
        ...metadata.parameters.map(p => p.typeReference.type.name),
        ...metadata.responses.map(r => r.typeReference.type.name)
    ];
}

export function resolveModuleDependencies(module: Module, modules: Module[]) {
    const deps = getModuleDependencies(module)
        .filter(t => t.kind !== "primitive" && !module.types.some(mt => mt === t))
        .map(t => ({ type: t, module: findOrThrow(modules, mt => mt.types.some(mtt => mtt === t)) }));

    return toMap(deps, i => i.module, i => i.type);
}

export function createModule(name: string, ...types: Type[]): Module {
    return {
        kind: "module",
        name,
        types
    };
}

import { uniqueId, last, keyBy } from "lodash";

import { Dictionary } from "../types";

import {
    TypeDescription,
    EndpointMetadata,
    MethodMetadata,
    MethodParameterMetadata,
    MethodResponseMetadata,
    ModelMetadata,
    ModelPropertyMetadata,
    getTypeDescription
} from "../metadata";

export interface Response {
    swagger: string;
    info: Info;
    host: string;
    schemes: string[];
    paths: Dictionary<Path>;
    definitions: Dictionary<TypeDefinition>;
}

export interface Info {
    version: string;
    title: string;
}

export interface Path extends Dictionary<Endpoint> {
    get: Endpoint;
    post: Endpoint;
    put: Endpoint;
    delete: Endpoint;
}

export interface Endpoint {
    tags: string[];
    operationId: string;
    consumes: string[];
    produces: string[];
    parameters: EndpointParameter[];
    responses: Dictionary<EndpointResponse>;
    deprecated: boolean;
}

export interface EndpointResponse {
    description: string;
    schema: Schema;
}

export interface EndpointParameter {
    name: string;
    in: string;
    required: boolean;
    type: string;
    schema: Schema;
}

export interface TypeDefinition {
    type: string;
    properties: Dictionary<PropertyDefinition>;
    enum: string[];
}

export interface Schema {
    type: string;
    format: string;
    $ref: string;
    items: Schema;
}

export interface PropertyDefinition extends Schema { }

function resolveJsonRef(root: Response, ref: string): Schema {
    const allPathSegments = ref.split("/");
    const pathSegments = allPathSegments[0] === "#" ?
        allPathSegments.slice(1) :
        allPathSegments;

    return {
        type: last(pathSegments),
        format: null as any,
        $ref: null as any,
        items: null as any
    };
}

function isComplexType(type: Schema) {
    return !!type.$ref;
}

function isCollection(type: Schema) {
    return type && type.type && type.type.toLowerCase() === "array";
}

function mapSchema(schema: Schema, data: Response): TypeDescription {
    if (isCollection(schema)) {
        return getTypeDescription(mapSchema(schema.items, data).name, true);
    }

    if (isComplexType(schema)) {
        return getTypeDescription(mapSchema(resolveJsonRef(data, schema.$ref || ""), data).name);
    }

    return getTypeDescription(schema.type);
}

export function getModels(data: Response): ModelMetadata[] {
    return Object.keys(data.definitions)
        .map(name => {
            const model = data.definitions[name];
            return {
                name,
                builtin: false,
                properties: Object.keys(model.properties)
                    .map(pname => {
                        const property = model.properties[pname];
                        return {
                            name: pname,
                            typeDescription: mapSchema(property, data)
                        };
                })
            };
        });
}

function getEndpointMethodName(identifier: string) {
    return last(identifier.split("_"));
}

export function getEndpoints(data: Response): EndpointMetadata[] {
    return Object.keys(data.paths)
        .map(uri => {
            const path = data.paths[uri];
            return {
                uri,
                methods: Object.keys(path)
                    .map(methodType => {
                        const method = path[methodType];
                        return {
                            methodType,
                            name: getEndpointMethodName(method.operationId),
                            tags: method.tags,
                            parameters: (method.parameters || [])
                                .map(p => ({
                                    name: p.name,
                                    in: p.in,
                                    required: p.required,
                                    typeDescription: mapSchema(p.schema || (p as any as Schema), data)
                                })),
                            responses: Object.keys(method.responses)
                                .map(code => {
                                    const response = method.responses[code];
                                    return {
                                        code,
                                        typeDescription: code === "200" && response.schema
                                            ? mapSchema(response.schema, data)
                                            : getTypeDescription("void")
                                    };
                                })
                        };
                    })
            };
        })
}

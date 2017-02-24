import { last, flatMap } from 'lodash';
import { Hash, use } from "../utils";

export interface Document {
    swagger: string;
    info: Info;
    basePath: string;
    paths: Hash<Path>;
    definitions: Hash<Schema | undefined>;
}

export interface Info {
    version: string;
    title: string;
}

export interface Path extends Hash<Operation | undefined> {
    get?: Operation;
    post?: Operation;
    put?: Operation;
    delete?: Operation;
}

export interface Operation {
    tags: string[];
    operationId: string;
    consumes: string[];
    produces: string[];
    parameters?: OperationParameter[];
    responses: Hash<OperationResponse | undefined>;
}

export interface OperationResponse {
    description: string;
    schema: SchemaReference;
}

export type PropertySchema = SchemaReference;

export type ParameterSource = "path" | "body" | "query";
export type PrimitiveType = "string" | "integer" | "object" | "array";
export type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

function asParameterSource(source: string): ParameterSource {
    switch(source) {
        case "path": return source;
        case "body": return source;
        case "query": return source;
        default: throw new Error(`Unknown parameter source ${source}`);
    }
}

function asPrimitiveType(type: string): PrimitiveType {
    switch(type) {
        case "string": return type;
        case "integer": return type;
        case "object": return type;
        case "array": return type;
        default: throw new Error(`Unknown primitive type ${type}`);
    }
}

function asHttpMethod(method: string): HttpMethod {
    switch(method) {
        case "get": return method;
        case "post": return method;
        case "put": return method;
        case "delete": return method;
        case "patch": return method;
        default: throw new Error(`Unknown HTTP-method ${method}`);
    }
}

export interface OperationParameter extends SchemaReference {
    name: string;
    in: ParameterSource;
    required: boolean;
    schema?: SchemaReference;
}

export interface Schema {
    type: PrimitiveType;
    properties: Hash<PropertySchema>;
    enum?: string[];
}

export interface SchemaReference {
    type: PrimitiveType;
    format?: string;
    $ref?: string;
    items?: SchemaReference;
}

export interface ArraySchemaReference extends SchemaReference {
    items: SchemaReference;
}

export interface ComplexSchemaReference extends SchemaReference {
    $ref: string;
}

function resolveSchemaReference(document: Document, reference: string): string {
    return use(reference.split("/"))
        .in(segments => {
            const schema = (segments[0] === "#" ? segments.slice(1) : segments)
                .reduce((p, n) => p[n], document as any);
        
            if(schema) {
                return last(segments);
            }

            throw new Error(`Unable to resolve schema with reference ${reference}`);
        });
}

function isComplexSchemaReference(schemaReference: SchemaReference): schemaReference is ComplexSchemaReference {
    return !!schemaReference.$ref;
}

function isArraySchemaReference(schemaReference: SchemaReference): schemaReference is ArraySchemaReference {
    return schemaReference.type === "array" && !!schemaReference.items;
}

export interface IMetadata {
    name: string;
}

export type EntityMetadata = SchemaMetadata | OperationMetadata;

export interface TypeMetadata {
    name: string;
}

export interface TypeReferenceMetadata {
    type: TypeMetadata;
    isArray: boolean;
}

export interface PropertyMetadata {
    name: string;
    typeReference: TypeReferenceMetadata;
}

export interface SchemaMetadata extends IMetadata {
    kind: "schema";
    type: PrimitiveType;
    properties: PropertyMetadata[];
    enum: string[];
}

export interface ParameterMetadata {
    name: string;
    in: ParameterSource;
    required: boolean;
    typeReference: TypeReferenceMetadata;
}

export interface ResponseMetadata {
    responseCode: string;
    typeReference: TypeReferenceMetadata;
}

export interface OperationMetadata extends IMetadata {
    kind: "operation";
    path: string;
    method: HttpMethod;
    tags: string[];
    parameters: ParameterMetadata[];
    responses: ResponseMetadata[];
}

export interface PathMetadata extends IMetadata {
    kind: "path";
    path: string;
    operations: OperationMetadata[];
}

const VOID: TypeMetadata = { name: "void" };

export function getType(document: Document, schemaReference: SchemaReference): TypeMetadata {
    if(isArraySchemaReference(schemaReference)) {
        return getType(document, schemaReference.items)
    }

    if(isComplexSchemaReference(schemaReference)) {
        return {
            name: resolveSchemaReference(document, schemaReference.$ref)
        };
    }

    return {
        name: schemaReference.type
    };
}

const VOID_REFERENCE: TypeReferenceMetadata = { type: VOID, isArray: false };

export function getTypeReference(document: Document, schemaReference: SchemaReference) {
    return {
        type: getType(document, schemaReference),
        isArray: isArraySchemaReference(schemaReference)
    };
}

export type ParseExtension = "x-schema";

function xSchema(operationParameter: OperationParameter) {
    return (operationParameter as any)["x-schema"] as SchemaReference;
}

export function getSchemas(document: Document, ...parseExtensions: ParseExtension[]): SchemaMetadata[] {
    return (Object.entries(document.definitions) as ReadonlyArray<[string, Schema | undefined]>)
        .filter((x: any): x is [string, Schema] => !!x[1])
        .map<SchemaMetadata>(([schemaName, schema]) => ({
            kind: "schema",
            name: schemaName,
            type: asPrimitiveType(schema.type),
            properties: Object.entries(schema.properties)
                .map(([propertyName, property]) => ({
                    name: propertyName,
                    typeReference: getTypeReference(document, property)
                })),
            enum: schema.enum || []
        }));
}

export function getOperations(document: Document, ...parseExtensions: ParseExtension[]): OperationMetadata[] {
    return flatMap(
        (Object.entries(document.paths) as ReadonlyArray<[string, Path | undefined]>)
            .filter((x: any): x is [string, Path] => !!x[1]),
        ([path, pathDefinition]) => 
            (Object.entries(pathDefinition) as ReadonlyArray<[string, Operation | undefined]>)
                .filter((x: any): x is [string, Operation] => !!x[1])
                .map<OperationMetadata>(([method, operation]) => ({
                    kind: "operation",
                    path: path,
                    method: asHttpMethod(method),
                    name: operation.operationId,
                    tags: operation.tags,
                    parameters: (operation.parameters || [])
                        .map(p => ({
                            name: p.name,
                            in: asParameterSource(p.in),
                            required: p.required,
                            typeReference: getTypeReference(
                                document,
                                (parseExtensions.some(e => e === "x-schema") ?
                                    xSchema(p) :
                                    p.schema) || p)
                        })),
                    responses: (Object.entries(operation.responses) as ReadonlyArray<[string, OperationResponse | undefined]>)
                        .filter((x: any): x is [string, OperationResponse] => !!x[1])
                        .map(([responseCode, response]) => ({
                            responseCode,
                            typeReference: response.schema ?
                                getTypeReference(document, response.schema) :
                                VOID_REFERENCE
                        }))
                }))
    );
}

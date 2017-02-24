import { Hash } from "../utils";
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
export declare type PropertySchema = SchemaReference;
export declare type ParameterSource = "path" | "body" | "query";
export declare type PrimitiveType = "string" | "integer" | "object" | "array";
export declare type HttpMethod = "get" | "post" | "put" | "delete" | "patch";
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
export interface IMetadata {
    name: string;
}
export declare type EntityMetadata = SchemaMetadata | OperationMetadata;
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
export declare function getType(document: Document, schemaReference: SchemaReference): TypeMetadata;
export declare function getTypeReference(document: Document, schemaReference: SchemaReference): {
    type: TypeMetadata;
    isArray: boolean;
};
export declare type ParseExtension = "x-schema";
export declare function getSchemas(document: Document, ...parseExtensions: ParseExtension[]): SchemaMetadata[];
export declare function getOperations(document: Document, ...parseExtensions: ParseExtension[]): OperationMetadata[];

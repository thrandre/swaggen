import { Dictionary } from "../types";
import { EndpointMetadata, ModelMetadata } from "../metadata";
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
export interface PropertyDefinition extends Schema {
}
export declare function getModels(data: Response): ModelMetadata[];
export declare function getEndpoints(data: Response): EndpointMetadata[];

export interface MethodParameterMetadata {
    name: string;
    in: string;
    required: boolean;
    typeDescription: TypeDescription;
}
export interface MethodResponseMetadata {
    code: string;
    typeDescription: TypeDescription;
}
export interface MethodMetadata {
    methodType: string;
    name: string;
    tags: string[];
    parameters: MethodParameterMetadata[];
    responses: MethodResponseMetadata[];
}
export interface EndpointMetadata {
    uri: string;
    methods: MethodMetadata[];
}
export interface ModelPropertyMetadata {
    name: string;
    typeDescription: TypeDescription;
}
export interface ModelMetadata {
    name: string;
    properties: ModelPropertyMetadata[];
}
export interface TypeDescription {
    name: string;
    isCollection: boolean;
}
export declare function getTypeDescription(name: string, isCollection?: boolean): TypeDescription;

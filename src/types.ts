export interface Dictionary<T> {
    [key: string]: T;
}

export interface TypeInfo {
    type: Type;
    isCollection: boolean;
}

export interface Type { 
    id: string;
    name: string;
    builtin: boolean;
}

export interface TypeLookupTable extends Dictionary<Type> {}

export interface ModelProperty {
    name: string;
    typeInfo: TypeInfo;
}

export interface Model {
    type: Type;
    properties: ModelProperty[];
}

export interface Endpoint {
    uri: string;
    methods: Method[];
}

export interface Method {
    type: Type;
    methodType: "get" | "post" | "put" | "delete";
    tags: string[];
    parameters: MethodParameter[];
    responses: MethodResponse[];
}

export interface MethodParameter {
    name: string;
    parameterType: "query" | "body";
    required: boolean;
    typeInfo: TypeInfo;
}

export interface MethodResponse {
    code: string;
    typeInfo: TypeInfo;
}

export enum ModuleType {
    Endpoint,
    Model
}

export interface Module {
    name: string;
    type: ModuleType;
    members: Unit[];
    exports: string[];
    getPath: (ext: string) => string;
    dependencies: Dictionary<DependencyRecord[]>;
}

export interface EndpointModule extends Module {
    members: Endpoint[];
}

export interface ModelModule extends Module {
    members: Model[];
}

export interface DependencyRecord {
    exportedName: string;
    moduleName: string;
    type: ModuleType;
    getRelativePath: (ext: string, keepExtension?: boolean) => string;
}

export type Unit = Model | Endpoint;

export interface EmittedModule {
    path: string;
    content: string;
}

export interface Emitter {
    emit: (modules: Module[], basePath: string) => EmittedModule[];
    onBeforeEmit: (modules: Module[]) => void;
}

export interface CliFlags {
    url: string;
    basePath: string;
    extension: string;
}

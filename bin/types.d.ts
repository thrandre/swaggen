import * as Swagger from "./parsers/swagger";
export interface CliFlags {
    emitter: string;
    url: string;
    basePath: string;
    extension: string;
}
export interface IHaveName {
    name: string;
}
export interface ICanBeArray {
    isArray: boolean;
}
export interface IHaveContainingType {
    type: Primitive | Alias | Enum | Schema;
}
export interface Property extends IHaveName, ICanBeArray, IHaveContainingType {
    kind: "property";
}
export interface Primitive extends IHaveName {
    kind: "primitive";
}
export interface Schema extends IHaveName {
    kind: "schema";
    properties: Property[];
}
export interface Alias extends IHaveName, IHaveContainingType {
    kind: "alias";
}
export interface Enum extends IHaveName {
    kind: "enum";
    values: string[];
}
export interface Operation extends IHaveName {
    kind: "operation";
    path: string;
    method: Swagger.HttpMethod;
    tags: string[];
    parameters: Parameter[];
    responses: Response[];
}
export interface Parameter extends IHaveName, ICanBeArray, IHaveContainingType {
    kind: "parameter";
    in: Swagger.ParameterSource;
    required: boolean;
}
export interface Response extends IHaveName, ICanBeArray, IHaveContainingType {
    kind: "response";
    code: string;
}
export interface Module extends IHaveName {
    kind: "module";
    types: Type[];
    getDependencies?: () => Type[];
}
export declare type TopLevelType = Primitive | Schema | Enum | Alias;
export declare type Type = TopLevelType | Module | Response | Operation | Property;
export declare type DependencyResolver = (name: string) => TopLevelType;
export interface Emitter {
    createModules(types: Type[], createModule: (name: string, ...types: Type[]) => Module): Module[];
    getModuleFilename(module: Module): string;
    emitModule(module: Module, moduleDependencies: any): string;
}

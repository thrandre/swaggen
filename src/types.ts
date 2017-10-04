import * as Swagger from "./parsers/swagger";
import { Fn2 } from "./utils";

export interface CliFlags {
  config: string;
}

export interface IHaveName {
  name: string;
}

export interface IHaveDescription {
  description: string;
}

export interface ICanBeArray {
  isArray: boolean;
}

export interface ICanBeOptional {
  required: boolean;
}

export interface IHaveContainingType {
  type: Primitive | Alias | Enum | Schema;
}

export interface ICanBeResolvedToCustomType {
  resolvedType?: string;
}

export interface Property
  extends IHaveName,
    ICanBeArray,
    IHaveContainingType,
    ICanBeOptional {
  kind: "property";
}

export interface Primitive extends IHaveName, ICanBeResolvedToCustomType {
  kind: "primitive";
  resolvedType?: string;
}

export interface Schema extends IHaveName, ICanBeResolvedToCustomType {
  kind: "schema";
  isLanguageSpesificType: boolean;
  properties: Property[];
}

export interface Alias
  extends IHaveName,
    IHaveContainingType,
    ICanBeResolvedToCustomType {
  kind: "alias";
}

export interface Enum extends IHaveName, ICanBeResolvedToCustomType {
  kind: "enum";
  values: string[];
}

export interface Operation
  extends IHaveName,
    IHaveDescription,
    ICanBeResolvedToCustomType {
  kind: "operation";
  path: string;
  method: Swagger.HttpMethod;
  tags: string[];
  parameters: Parameter[];
  responses: Response[];
}

export interface Parameter
  extends IHaveName,
    IHaveDescription,
    ICanBeArray,
    IHaveContainingType,
    ICanBeOptional {
  kind: "parameter";
  in: Swagger.ParameterSource;
}

export interface Response extends IHaveName, ICanBeArray, IHaveContainingType {
  kind: "response";
  code: string;
}

export interface Module extends IHaveName {
  kind: "module";
  types: Type[];
  emittable: boolean;
  getDependencies?: () => Type[];
}

export type DataType = Primitive | Schema | Enum | Alias;
export type CustomDataType = Schema | Enum | Alias;
export type ContainsType = Property | Parameter | Alias | Response;
export type Type =
  | DataType
  | ContainsType
  | Module
  | Response
  | Operation
  | Property
  | Parameter;
export type DependencyResolver = (name: string) => DataType;

export interface Emitter {
  createModules(
    name: string,
    types: Type[],
    createModuleFn: Fn2<string, Type[], Module>
  ): [string, Module][];
  emitModule(module: Module, moduleDependencies: Map<Module, Type[]>): string;
}

export namespace TypeUtils {
  export function isPrimitive(type: Type): type is Primitive {
    return type.kind === "primitive";
  }

  export function isOperation(type: Type): type is Operation {
    return type.kind === "operation";
  }

  export function isSchema(type: Type): type is Schema {
    return type.kind === "schema";
  }

  export function isAlias(type: Type): type is Alias {
    return type.kind === "alias";
  }

  export function isEnum(type: Type): type is Enum {
    return type.kind === "enum";
  }

  export function isProperty(type: Type): type is Property {
    return type.kind === "property";
  }

  export function isParameter(type: Type): type is Parameter {
    return type.kind === "parameter";
  }

  export function isResponse(type: Type): type is Response {
    return type.kind === "response";
  }

  export function containsType(type: Type): type is ContainsType {
    return (
      type.kind === "property" ||
      type.kind === "parameter" ||
      type.kind === "alias" ||
      type.kind === "response"
    );
  }

  export function isDataType(type: Type): type is DataType {
    return (
      type.kind === "primitive" ||
      type.kind === "schema" ||
      type.kind === "alias" ||
      type.kind === "enum"
    );
  }

  export function isCustomDataType(type: Type): type is CustomDataType {
    return isDataType(type) && type.kind !== "primitive";
  }

  export function isResolvedToCustomType(type: ICanBeResolvedToCustomType) {
    return !!type.resolvedType;
  }
}

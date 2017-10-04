import {
  ICanBeArray,
  ICanBeOptional,
  ICanBeResolvedToCustomType,
  Parameter,
  Property,
  Response,
  Type,
  TypeUtils as TypeUtils
} from "../types";
import { Fn1, Fn2, Hash, teeIf } from "../utils";

import { readTemplate, resolveRelativePath, Fn3 } from "../utils";

import { compile as ejs } from "ejs";
import { Module, ContainsType } from '../types';

export type CompiledTemplate = Fn1<{ [key: string]: any }, string>;

export namespace Template {
  export function compile<T extends {[key: string]: any}>(hash: T): { [key in keyof T]: CompiledTemplate } {
    return Object
      .keys(hash)
      .reduce((prev, next) => ({...prev, [next]: ejs(readTemplate(hash[next]), { filename: hash[next] })}), {} as any);
  }

  export function render(
    template: CompiledTemplate,
    type: Type,
    dependencies: Map<Module, Type[]>,
    helper: any
  ) {
    return template({
      type,
      dependencies,
      emitter: helper
    });
  }
}

export namespace Constants {
  export const NEWLINE = "\r\n";
}

export namespace String {
  export function camelCase(str: string) {
    return str
      .split("_")
      .map(s => s.substr(0, 1).toLowerCase() + s.substr(1))
      .join("_");
  }

  export function pascalCase(str: string) {
    return str
    .split("_")
    .map(s => s.substr(0, 1).toUpperCase() + s.substr(1))
    .join("_");
  }
}

export namespace TypeInfo {
  export interface FormatterInfo {
    primitives: Hash<[string, string | undefined]>;
    formatOperationGroupName: Fn1<string, string>;
    formatSchemaName: Fn1<string, string>;
    formatAliasName: Fn1<string, string>;
    formatOperationName: Fn1<string, string>;
    formatPropertyName: Fn1<string, string>;
    formatParameterName: Fn1<string, string>;
    formatProperty: Fn2<string, string, string>;
    formatParameter: Fn3<string, string, Type, string>;
    formatResponse: Fn1<string, string>;
    formatOptional: Fn2<string, Type, string>;
    formatArray: Fn2<string, Type, string>;
  }

  export function getFormatter({
    primitives,
    formatOperationGroupName,
    formatOperationName,
    formatSchemaName,
    formatAliasName,
    formatPropertyName,
    formatParameterName,
    formatProperty,
    formatParameter,
    formatResponse,
    formatOptional,
    formatArray
  }: FormatterInfo) {
    return {
      primitives,
      formatOperationGroupName,
      formatOperationName,
      formatSchemaName,
      formatAliasName,
      formatPropertyName,
      formatParameterName,
      formatProperty,
      formatParameter,
      formatResponse,
      formatOptional,
      formatArray,
      
      getName(type: Type) {
        if(TypeUtils.isResolvedToCustomType(type as ICanBeResolvedToCustomType)) {
          return (type as ICanBeResolvedToCustomType).resolvedType || "";
        }

        if (TypeUtils.isSchema(type)) {
          return formatSchemaName(type.name);
        }

        if (TypeUtils.isAlias(type)) {
          return formatAliasName(type.name);
        }

        if (TypeUtils.isOperation(type)) {
          return formatOperationName(type.name);
        }

        if (TypeUtils.isProperty(type)) {
          return formatPropertyName(type.name);
        }

        if (TypeUtils.isParameter(type)) {
          return formatParameterName(type.name);
        }

        if (TypeUtils.isPrimitive(type)) {
          return primitives[type.name][0];
        }

        throw new Error("Unable to get name of type.");
      },

      getTypeDefinition(type: ContainsType) {
        const formatArrayIf = (type: Type, name:string, isArray: boolean) => isArray ? formatArray(name, type) : name;
        const formatOptionalIf = (type: Type, name: string, isOptional: boolean) => isOptional ? formatOptional(name, type) : name;
        
        return formatOptionalIf(
          type.type,
          formatArrayIf(
            type.type,
            this.getName(type.type),
            (type.kind === "property" || type.kind === "parameter" || type.kind === "response") && type.isArray),
          type.kind === "parameter" && !type.required);
      },

      getPropertyDefinition(property: Property) {
        return formatProperty(
          this.getName(property),
          this.getTypeDefinition(property)
        );
      },

      getParameterDefinition(parameter: Parameter) {
        return formatProperty(
          this.getName(parameter),
          this.getTypeDefinition(parameter)
        );
      },

      getResponseDefinition(response: Response) {
        return formatResponse(this.getTypeDefinition(response));
      }
    };
  }
}

import { resolve } from "path";
import { Hash, Fn2, tee, not, toMap, Fn3 } from "../../utils";
import * as Common from "../common";
import { groupBy } from "lodash";

import {
  Type,
  Parameter,
  Primitive,
  Operation,
  Property,
  Alias,
  Enum,
  Module,
  Response,
  Schema,
  TypeUtils
} from "../../types";

function indent(code: string, depth: number = 4) {
  const spaces = Array(depth)
    .fill(" ")
    .join("");
  return code
    .split(Common.Constants.NEWLINE)
    .map((line, idx) => (idx === 0 ? line : spaces + line))
    .join(Common.Constants.NEWLINE);
}

export const primitiveMap: Hash<[string, string]> = {
  object: ["object", "System"],
  void: ["void", "System"],
  boolean: ["bool", "System"],
  integer: ["int", "System"],
  long: ["long", "System"],
  float: ["float", "System"],
  double: ["double", "System"],
  string: ["string", "System"],
  byte: ["byte", "System"],
  binary: ["byte", "System"],
  date: ["DateTimeOffset", "System"],
  datetime: ["DateTimeOffset", "System"],
  password: ["string", "System"],
  uuid: ["Guid", "System"]
};

const templates = Common.Template.compile({
  module: resolve(__dirname, "./module.ejs")
});

export interface CSharpConfig {
  useDateTimeOffset?: boolean;
  prependNamespace?: string;
}

export default function(config?: CSharpConfig) {
  const formatter = {
    ...Common.TypeInfo.getFormatter({
      primitives: primitiveMap,
      formatOperationGroupName: Common.String.pascalCase,
      formatOperationName: Common.String.pascalCase,
      formatSchemaName: Common.String.pascalCase,
      formatAliasName: (aliasName: string) => aliasName,
      formatPropertyName: Common.String.pascalCase,
      formatParameterName: Common.String.camelCase,
      formatProperty: (propertyName: string, propertyType: string) =>
        `public ${propertyType} ${propertyName} { get; set; }`,
      formatParameter: (
        parameterName: string,
        parameterType: string,
        parameter: Parameter
      ) =>
        `${parameterType} ${parameterName}${
          parameter.required ? "" : " = null"
        }`,
      formatResponse: t => t,
      formatOptional: (name: string, type: Type) =>
        `${name}${
          TypeUtils.isPrimitive(type) && type.name !== "string" ? "?" : ""
        }`,
      formatArray: (name: string) => `List<${name}>`
    }),
    formatResponse: (responseType: string, useInterface: boolean) =>
      (useInterface ? "I" : "") +
      (responseType === "void" ? "ApiRequest" : `ApiRequest<${responseType}>`),
    getOperationGroupName: Common.String.pascalCase,
    getOperationName: (operation: Operation) =>
      Common.String.pascalCase(operation.name),
    getNamespace: (module: Module) =>
      (config && config.prependNamespace && module.emittable
        ? config.prependNamespace + "."
        : "") +
      tee(module.name.split("."), p =>
        (p.length > 1 ? p.slice(0, -1) : p).join(".")
      ),
    getHttpMethod(method: string) {
      return `HttpMethod.${Common.String.pascalCase(method)}`;
    }
  };

  return {
    ...Common,

    Modules: {
      getFilename(module: Module) {
        return module.name.replace(/\./g, "/") + ".cs";
      },

      handleLanguageTypes(types: Type[]) {
        types
          .filter(t => (t.name || "").startsWith("Tuple"))
          .forEach(
            t =>
              ((t as Primitive).resolvedType = tee(
                t as Schema,
                t =>
                  [
                    `Tuple<${formatter.getTypeDefinition(
                      t.properties[0]
                    )}, ${formatter.getTypeDefinition(t.properties[1])}>`,
                    "System"
                  ] as [string, string]
              ))
          );
      },

      renameModels(types: Type[]) {
        types
          .filter(TypeUtils.isSchema)
          .forEach(
            t =>
              (t.name = t.name.toLowerCase().endsWith("model")
                ? t.name
                : `${t.name}Model`)
          );
      },

      createSystemModules(types: Type[]) {
        return [
          ...toMap(
            Object.entries(primitiveMap).filter(([name, _]) =>
              types.some(t => (t.name || "").toLowerCase() === name.toLowerCase())
            ),
            ([name, [systemName, systemModule]]) => systemModule,
            ([name, [systemName, systemModule]]) =>
              types.find(t => t.name === name) as Type
          ).entries()
        ].map(
          ([moduleName, types]) =>
            [moduleName, types, false] as [string, Type[], boolean]
        );
      },

      createSchemaModules(apiName: string, types: Type[]) {
        return types
          .filter(TypeUtils.isDataType)
          .map(
            t =>
              [
                `${Common.String.pascalCase(apiName)}.Models.${t.name}`,
                [t],
                true
              ] as [string, Type[], boolean]
          );
      },

      createOperationModules(apiName: string, types: Type[]) {
        return [
          ...toMap(
            types.filter(TypeUtils.isOperation),
            t => t.tags[0],
            t => t as Type
          )
        ].map(
          ([moduleName, types]) =>
            [
              `${Common.String.pascalCase(apiName)}.Resources.${moduleName}`,
              types,
              true
            ] as [string, Type[], boolean]
        );
      },

      create(
        apiName: string,
        types: Type[],
        createModuleFn: Fn3<string, Type[], boolean, Module>
      ): [string, Module][] {
        this.handleLanguageTypes(types);
        this.renameModels(types);

        const customTypes = (types as ReadonlyArray<Type>)
          .filter(not(TypeUtils.isPrimitive))
          .filter(t => !(t as Primitive).resolvedType);

        const systemModules = this.createSystemModules(types);
        const schemaModules = this.createSchemaModules(apiName, customTypes);
        const operationModules = this.createOperationModules(
          apiName,
          customTypes
        );

        return [...systemModules, ...schemaModules, ...operationModules].map(
          ([moduleName, types, emittable]) =>
            tee(
              createModuleFn(moduleName, types, emittable),
              m => [this.getFilename(m), m] as [string, Module]
            )
        );
      },

      emit(
        apiName: string,
        module: Module,
        moduleDependencies: Map<Module, Type[]>
      ) {
        return templates.module({
          indent,
          module,
          moduleDependencies,
          emitter: {
            formatter,
            getApiName: () => Common.String.pascalCase(apiName)
          }
        });
      }
    },

    Formatter: formatter
  };
}

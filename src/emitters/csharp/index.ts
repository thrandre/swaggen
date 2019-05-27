import { compile } from "ejs";
import { Template } from "./../common";
import { groupBy } from "lodash";
import { resolve } from "path";

import {
  Alias,
  Emitter,
  Enum,
  Module,
  Operation,
  Parameter,
  Property,
  Response,
  Schema,
  Type,
  TypeUtils
} from "../../types";

import {
  readTemplate,
  resolveRelativePath,
  tee,
  Fn2,
  Fn3,
  use
} from "../../utils";
import csharp from "./csharp";

export = function(config?: any): Emitter {
  const csharpEmitter = csharp(config);

  return {
    createModules(
      apiName: string,
      types: Type[],
      createModuleFn: Fn3<string, Type[], boolean, Module>
    ) {
      return csharpEmitter.Modules.create(apiName, types, createModuleFn);
    },

    emitModule(
      apiName: string,
      module: Module,
      moduleDependencies: Map<Module, Type[]>
    ) {
      return csharpEmitter.Modules.emit(apiName, module, moduleDependencies);
    }
  };
};

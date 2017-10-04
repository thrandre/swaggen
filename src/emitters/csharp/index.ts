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
  Type
} from "../../types";
import { TypeUtils } from "../../types";
import { readTemplate, resolveRelativePath, tee, Fn2, Fn3 } from "../../utils";
import { use } from "../../utils";

import CSharp from "./csharp";

export = function(config?: any): Emitter {
  const csharp = CSharp(config);

  return {
    createModules(apiName: string, types: Type[], createModuleFn: Fn3<string, Type[], boolean, Module>) {
      return csharp.Modules.create(apiName, types, createModuleFn);
    },

    emitModule(module: Module, moduleDependencies: Map<Module, Type[]>) {
      return csharp.Modules.emit(module, moduleDependencies);
    }
  };
}

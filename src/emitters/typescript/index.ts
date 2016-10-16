import { join } from "path";
import { compile, render } from "ejs";
import { assign, last } from "lodash";

import { Module, ModuleType, Endpoint, EndpointModule, ModelModule, EmittedModule } from "../../types";

import { readTemplate, nixPath } from "../../utils";
import * as helpers from "./helpers";

const modelTemplate = compile(readTemplate("./modelTemplate.ejs")) as any;
const endpointTemplate = compile(readTemplate("./endpointTemplate.ejs")) as any;

function emitModule(mod: Module) {
    if (mod.type === ModuleType.Endpoint) {
        return endpointTemplate(assign({}, { helpers }, { module: mod }));
    }


    return modelTemplate(assign({}, { helpers }, { module: mod }));
}

function createModelIndex(modules: Module[], basePath: string) {
    var indexPath = nixPath(join(basePath, 'models', 'index.ts'));

    //console.log(modules.map(m => m.members.map(mm => mm.type.name).join('+') + " - " + utils.nixPath(utils.resolveRelativePath(indexPath, m.getPath(".ts"), ".ts"))));

    return {
        path: indexPath,
        content: "Dette er en index"
    };
}

function isEndpoint(module: Module): module is EndpointModule {
    return module.type === ModuleType.Endpoint;
}

export function onBeforeEmit(modules: Module[]) {
    modules.forEach(m => {
        if (isEndpoint(m)) {
            m.members.forEach(mm => {
                mm.methods.forEach(mmm => mmm.type.name = last(mmm.type.name.split('_')).toLowerCase())
            })
        }
    });
}

export function emit(modules: Module[], basePath: string): EmittedModule[] {
    var modelIndex = createModelIndex(
        modules.filter(m => m.type === 1),
        basePath
    );

    return modules
        .map(m => ({
            path: m.getPath(".ts"),
            content: emitModule(m)
        }))
        .concat([modelIndex]);
}

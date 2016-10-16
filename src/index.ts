process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import {
    Dictionary,
    TypeLookupTable,
    TypeInfo,
    Type,
    Model,
    Method,
    Endpoint,
    Module,
    ModuleType,
    DependencyRecord,
    Unit,
    Emitter,
    EmittedModule,
    CliFlags
} from "./types";

import { ModelMetadata, EndpointMetadata } from "./metadata";
import { getModels, getEndpoints } from "./parsers/swagger";
import { getSwaggerResponse } from "./api";

import {
    getTypeResolver,
    getLookupFn,
    mapModels,
    mapEndpoints,
    getModuleCreator,
    groupModels,
    groupEndpoints,
    getDependencyResolver,
    getModelTypes,
    getEndpointTypes,
    resolveModuleDependencies
} from "./processing";

import { resolveRelativeModulePath, nixPath, resolvePath, resolveModulePath } from "./utils";
import { ensureDirectoriesExists, writeFile } from "./fsUtils";

import { flatMap } from "lodash";

function getIndexTypes(indexUnits: (Model | Method)[]) {
    return () => flatMap(indexUnits, m => m.type);
}

function getPathResolver(baseDir: string) {
    return (module: Module, extension: string) => resolveModulePath(module, baseDir, extension);
}

function cleanOutput(output: string) {
    return output.replace(/\r\n\s*\r\n/g, "\r\n");
}

function start(emitter: Emitter, url: string, basePath: string) {
    getSwaggerResponse(url)
        .catch(err => console.error(`Unable to contact swagger at: ${ url }`))
        .then(res => {
            const endpoints = getEndpoints(res);
            const models = getModels(res);

            const conversionMap: Dictionary<string[]> = {
                "number": ["integer", "float", "double", "decimal"],
                "string": ["string"],
                "boolean": ["boolean", "bool"],
                "any": ["object", "system.object"],
                "void": ["void"]
            };

            const typeResolver = getTypeResolver(getLookupFn(conversionMap, models, flatMap(endpoints, e => e.methods)));

            const mappedModels = mapModels(models, typeResolver);
            const mappedEndpoints = mapEndpoints(endpoints, typeResolver);

            const pathResolver = getPathResolver(basePath);

            const modelModuleCreator = getModuleCreator((m: Model) => [m.type.name], pathResolver, ModuleType.Model);
            const endpointModuleCreator = getModuleCreator((e: Endpoint) => e.methods.map(m => m.type.name), pathResolver, ModuleType.Endpoint);

            const modelGroups = groupModels(mappedModels);
            const endpointGroups = groupEndpoints(mappedEndpoints);

            const modelModules = Object.keys(modelGroups).map(name => modelModuleCreator(name, modelGroups[name]));
            modelModules.forEach(m => m.dependencies = resolveModuleDependencies(getDependencyResolver(getModelTypes), m, modelModules));

            const endpointModules = Object.keys(endpointGroups).map(name => endpointModuleCreator(name, endpointGroups[name]));
            endpointModules.forEach(m => m.dependencies = resolveModuleDependencies(getDependencyResolver(getEndpointTypes), m, endpointModules.concat(modelModules)));

            const modules = modelModules.concat(endpointModules);

            ensureDirectoriesExists(basePath, basePath + "/models", basePath + "/endpoints");
            emitter.onBeforeEmit(modules);

            const output = emitter.emit(modules, basePath);

            output.forEach(o => writeFile(o.path, o.content));
        });
}

function getEmitter(path: string) {
    try {
        return require(resolvePath(path));
    }
    catch(err) {
        throw new Error(`Unable to resolve emitter "${ path }": ${ err }`);
    }
}

export function run(emitterPath: string, flags: CliFlags) {
    if(!flags.url) {
        throw new Error(`Missing required parameter "url"`);
    }
    start(getEmitter(emitterPath), flags.url, flags.basePath || "./api");
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { getSwaggerResponse } from "./api";
import { writeFile } from "./fsUtils";

import { use, toLookup } from "./utils";
import * as Swagger from './parsers/swagger';

import { Emitter, CliFlags, Type } from "./types";
import { Hash, resolvePath } from "./utils";

import { resolve } from "./topoUtils";

import { join, dirname } from "path";
import * as mkdirp from 'mkdirp';

import Emitters from "./emitters";

import {
    createModule,
    createType,
    getOperationDependencies,
    getResolver,
    getSchemaDependencies,
    resolveModuleDependencies
} from './processing';

const TOPO_ROOT_NODE = "_ROOT_";

function outputModules(modules: [string, string][], basePath: string) {
     modules.forEach(([path, content]) => {
        mkdirp.sync(join(basePath, dirname(path)));
        writeFile(join(basePath, path), content);
    });
}

function getTypePool(entities: Swagger.EntityMetadata[]) {
    return use(toLookup(entities, t => t.name))
        .in(lookup => resolve({
            root: TOPO_ROOT_NODE,
            getChildrenFn: node => node !== TOPO_ROOT_NODE ?
                use(lookup[node])
                    .in(s => s ? (
                        s.kind === "schema" ?
                            getSchemaDependencies(s) :
                            getOperationDependencies(s)
                    ) : []):
                Object.values(lookup).map(s => s.name),
            resolveFn: (node, pool: Type[]) => use(lookup[node])
                .in(s => createType(s || { name: node, kind: "schema" }, getResolver(pool)))
        }));
}

async function start(emitter: Emitter, url: string, basePath: string) {
    try {
        const res = await getSwaggerResponse(url);

        if (!res) {
            throw new Error(`Invalid response`);
        }

        const operations = Swagger.getOperations(res, "x-schema");
        const schemas = Swagger.getSchemas(res, "x-schema");

        const typePool = getTypePool((schemas as Swagger.EntityMetadata[]).concat(operations));
        
        const modules = emitter.createModules(typePool, createModule);
        const emittedModules = modules.map<[string, string]>(m => [
            emitter.getModuleFilename(m),
            emitter.emitModule(m, resolveModuleDependencies(m, modules))
        ]);

        outputModules(emittedModules, basePath);
    }
    catch(err) {
        console.log(err);
        process.exit(1);
    }
}

function getEmitter(path: string) {
    try {
        const emitter = (Emitters as Hash<string>)[path];
        return require(resolvePath(emitter || path, emitter ? __dirname : process.cwd()));
    }
    catch (err) {
        throw new Error(`Unable to resolve emitter "${path}": ${err}`);
    }
}

export function run(flags: CliFlags) {
    if (!flags.url) {
        throw new Error(`Missing required parameter "url"`);
    }

    if(!flags.emitter) {
        throw new Error(`No emitter specified. Try one of the following: ts`);
    }

    start(getEmitter(flags.emitter), flags.url, flags.basePath || "./api");
}

import { EmitterEntry } from './emitters';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { getSwaggerResponse } from "./api";
import { writeFile } from "./fsUtils";

import { Action1, createTimer, execTool, Fn1, getModuleHash, toLookup, use } from './utils';
import * as Swagger from './parsers/swagger';

import { Emitter, CliFlags, Type, Extension } from "./types";
import { Hash, resolvePath } from "./utils";

import { resolve } from "./topoUtils";

import { join, dirname, resolve as res } from "path";
import * as mkdirp from 'mkdirp';

import { execFile, execFileSync, spawn } from 'child_process';

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

const MODULES: { [key: string]: string } = {};

function outputModules(modules: [string, string][], basePath: string, postprocess: Fn1<string, string[]> | undefined, onEmit: Action1<string>) {
     modules.forEach(([path, content]) => {
        const oldHash = MODULES[path];
        const hash = getModuleHash(content);

        if(oldHash) {
            if(oldHash === hash) {
                return;
            }
        }

        MODULES[path] = hash;

        const filename = join(basePath, path);

        mkdirp.sync(join(basePath, dirname(path)));
        writeFile(filename, content);

        if(postprocess) {
            execTool(...postprocess(filename));
        }

        onEmit(path);
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

async function loop(emitter: { emitter: Emitter, meta: EmitterEntry }, url: string, basePath: string, onEmit: Action1<string>, onError: Action1<any>) {
    let res;

    try {
        res = await getSwaggerResponse(url);
    }
    catch(err) {
        onError(`Unable to contact swagger at ${url}`);
        return;
    }

    const operations = Swagger.getOperations(res);
    const schemas = Swagger.getSchemas(res);

    const typePool = getTypePool((schemas as Swagger.EntityMetadata[]).concat(operations));
    
    const modules = emitter.emitter.createModules(typePool, createModule);
    const emittedModules = modules.map<[string, string]>(m => [
        emitter.emitter.getModuleFilename(m),
        emitter.emitter.emitModule(m, resolveModuleDependencies(m, modules))
    ]);

    outputModules(emittedModules, basePath, emitter.meta.postprocess, onEmit);
}

function start(emitter: { emitter: Emitter, meta: EmitterEntry }, url: string, basePath: string) {
    createTimer(
        async () => {
            await loop(
                emitter,
                url,
                basePath,
                name => console.log(`Emitted module: ${name}`),
                (e: any) => console.error(e));
        },
        10000,
        true);
}

function getEmitter(path: string) {
    try {
        const emitter = (Emitters as Hash<EmitterEntry>)[path];
        return {
            meta: emitter,
            emitter: require(resolvePath((emitter && emitter.path) || path, emitter ? __dirname : process.cwd()))
        };
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
        throw new Error(`No emitter specified. Try one of the following: ts, elm`);
    }

    const emitter = getEmitter(flags.emitter);

    start(
        emitter,
        flags.url,
        flags.basePath || "./api",
    );
}

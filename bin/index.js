"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const api_1 = require("./api");
const fsUtils_1 = require("./fsUtils");
const utils_1 = require("./utils");
const Swagger = require("./parsers/swagger");
const utils_2 = require("./utils");
const topoUtils_1 = require("./topoUtils");
const path_1 = require("path");
const mkdirp = require("mkdirp");
const emitters_1 = require("./emitters");
const processing_1 = require("./processing");
const TOPO_ROOT_NODE = "_ROOT_";
function outputModules(modules, basePath) {
    modules.forEach(([path, content]) => {
        mkdirp.sync(path_1.join(basePath, path_1.dirname(path)));
        fsUtils_1.writeFile(path_1.join(basePath, path), content);
    });
}
function getTypePool(entities) {
    return utils_1.use(utils_1.toLookup(entities, t => t.name))
        .in(lookup => topoUtils_1.resolve({
        root: TOPO_ROOT_NODE,
        getChildrenFn: node => node !== TOPO_ROOT_NODE ?
            utils_1.use(lookup[node])
                .in(s => s ? (s.kind === "schema" ?
                processing_1.getSchemaDependencies(s) :
                processing_1.getOperationDependencies(s)) : []) :
            Object.values(lookup).map(s => s.name),
        resolveFn: (node, pool) => utils_1.use(lookup[node])
            .in(s => processing_1.createType(s || { name: node, kind: "schema" }, processing_1.getResolver(pool)))
    }));
}
function start(emitter, url, basePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield api_1.getSwaggerResponse(url);
            if (!res) {
                throw new Error(`Invalid response`);
            }
            const operations = Swagger.getOperations(res, "x-schema");
            const schemas = Swagger.getSchemas(res, "x-schema");
            const typePool = getTypePool(schemas.concat(operations));
            const modules = emitter.createModules(typePool, processing_1.createModule);
            const emittedModules = modules.map(m => [
                emitter.getModuleFilename(m),
                emitter.emitModule(m, processing_1.resolveModuleDependencies(m, modules))
            ]);
            outputModules(emittedModules, basePath);
        }
        catch (err) {
            console.log(err);
            process.exit(1);
        }
    });
}
function getEmitter(path) {
    try {
        const emitter = emitters_1.default[path];
        return require(utils_2.resolvePath(emitter || path, emitter ? __dirname : process.cwd()));
    }
    catch (err) {
        throw new Error(`Unable to resolve emitter "${path}": ${err}`);
    }
}
function run(flags) {
    if (!flags.url) {
        throw new Error(`Missing required parameter "url"`);
    }
    if (!flags.emitter) {
        throw new Error(`No emitter specified. Try one of the following: ts`);
    }
    start(getEmitter(flags.emitter), flags.url, flags.basePath || "./api");
}
exports.run = run;
//# sourceMappingURL=index.js.map
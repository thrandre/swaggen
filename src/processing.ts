import {
    Dictionary,
    TypeLookupTable,
    TypeInfo,
    Type,
    Model,
    Endpoint,
    Module,
    ModuleType,
    DependencyRecord,
    Unit
} from "./types";

import { ModelMetadata, EndpointMetadata, MethodMetadata } from "./metadata";
import { flatMap, groupBy, uniqueId, keyBy, invert, uniq, uniqBy, sortBy, reverse, find } from "lodash";
import { resolveRelativeModulePath } from "./utils";

function getMethodFullName(method: MethodMetadata) {
    return `${ method.tags.join("_") }_${ method.name }`;
}

function getTypeLookupTable(builtins: string[], models: ModelMetadata[], methods: MethodMetadata[]): TypeLookupTable {
    return keyBy(
        builtins
            .map(b => ({ id: b, name: b, builtin: true }))
            .concat(
                models.map(m => ({
                    id: uniqueId("model-"),
                    name: m.name,
                    builtin: false
                }))
            )
            .concat(
                methods.map(m => ({
                    id: uniqueId("method-"),
                    name: getMethodFullName(m),
                    builtin: false
                }))
            ),
        i => i.name
    )
}

function invertMap(map: Dictionary<string[]>): Dictionary<string> {
    return flatMap(Object.keys(map), k => map[k].map(v => ({ key: k, val: v }))).reduce((prev: any, next: any) => {
        prev[next.val] = next.key;
        return prev;
    }, {});
}

export function getLookupFn(conversionMap: Dictionary<string[]>, models: ModelMetadata[], methods: MethodMetadata[]) {
    const inverseMap = invertMap(conversionMap);
    const table = getTypeLookupTable(Object.keys(conversionMap), models, methods);

    return (typeName: string) => table[inverseMap[typeName.toLowerCase()] || typeName];
}

export function getTypeResolver(lookup: (typeName: string) => Type) {
    return (name: string) => {
        const type = lookup(name);
        if(!type) {
            throw new Error(`Unable to resolve type ${ name }`);
        }

        return type;
    };
}

function getTypeInfo(type: Type, isCollection: boolean = false): TypeInfo {
    return {
        type,
        isCollection
    };
}

export function mapModels(models: ModelMetadata[], resolveType: (name: string) => Type): Model[] {
    return models.map(m => ({
        type: resolveType(m.name),
        properties: m.properties.map(p => ({
            name: p.name,
            typeInfo: getTypeInfo(resolveType(p.typeDescription.name), p.typeDescription.isCollection)
        }))
    }))
    .filter(m => !m.type.builtin);
}

export function mapEndpoints(endpoints: EndpointMetadata[], resolveType: (name: string) => Type): Endpoint[] {
    return endpoints.map(e => ({
        uri: e.uri,
        methods: e.methods.map(m => ({
            type: resolveType(getMethodFullName(m)),
            methodType: m.methodType as any,
            tags: m.tags,
            parameters: reverse(sortBy(
                m.parameters.map(p => ({
                    name: p.name,
                    parameterType: p.in as any,
                    required: p.required,
                    typeInfo: getTypeInfo(resolveType(p.typeDescription.name), p.typeDescription.isCollection)
                })),
                p => p.required
            )),
            responses: m.responses.map(r => ({
                code: r.code,
                typeInfo: getTypeInfo(resolveType(r.typeDescription.name), r.typeDescription.isCollection)
            }))
        }))
    }));
}

export function getModelTypes(model: Model) {
    return model.properties.map(p => p.typeInfo.type);
}

export function getEndpointTypes(endpoint: Endpoint) {
    return flatMap(
        endpoint.methods,
        m => m.parameters
            .map(p => p.typeInfo.type)
            .concat(m.responses.map(r => r.typeInfo.type))
    );
}

export function getDependencyResolver(getTypes: (entities: (Model | Endpoint)) => Type[]) {
    return (entity: (Model | Endpoint), module: Module, modules: Module[]) => getDependencies(getTypes(entity), module, modules);
}

function getDependencies(types: Type[], module: Module, modules: Module[]): DependencyRecord[]  {
    return uniq(
        types
            .filter(t => !t.builtin && !module.exports.some(m => m === t.name))
            .map(t => {
                const dep = find(modules, m => m.exports.some(e => e === t.name));
                
                if(!dep) {
                    throw new Error(`Dependency ${ t.name } not found.`);
                }

                return {
                    exportedName: t.name,
                    moduleName: dep.name,
                    getRelativePath: (ext: string, keepExt: boolean = false) => resolveRelativeModulePath(module, dep, ext, keepExt),
                    type: dep.type
                };
            })
    );
}

export function getModuleCreator(
    resolveExports: (unit: Unit) => string[],
    getPath: (module: Module, ext: string) => string,
    moduleType: ModuleType
): (name: string, units: Unit[]) => Module {
    return (name: string, units: Unit[]) => {
        const module = {
            name,
            type: moduleType,
            members: units,
            exports: flatMap(units, resolveExports),
            getPath: null as any,
            dependencies: [] as any
        };

        module.getPath = (ext: string) => getPath(module, ext);

        return module;
    };
}

export function resolveModuleDependencies(
    resolveDependencies: (unit: Unit, module: Module, modules: Module[]) => DependencyRecord[],
    module: Module,
    modules: Module[]
) {
    return groupBy(
        uniqBy(flatMap(module.members, mm => resolveDependencies(mm, module, modules)), d => d.exportedName),
        record => record.moduleName
    );
}

export function groupModels(models: Model[]): Dictionary<Model[]> {
    return groupBy(models, m => m.type.name);
}

export function groupEndpoints(endpoints: Endpoint[]): Dictionary<Endpoint[]> {
    return groupBy(endpoints, e => e.methods[0].tags[0]);
}

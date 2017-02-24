import { TopLevelType, DependencyResolver, Type, Module } from "./types";
import * as Swagger from "./parsers/swagger";
export declare function createType(metadata: Swagger.EntityMetadata, dependencyResolver: DependencyResolver): Type;
export declare function getResolver<T extends Type>(pool: T[]): (name: string) => TopLevelType;
export declare function getSchemaDependencies(metadata: Swagger.SchemaMetadata): string[];
export declare function getOperationDependencies(metadata: Swagger.OperationMetadata): string[];
export declare function resolveModuleDependencies(module: Module, modules: Module[]): Map<Module, Type[]>;
export declare function createModule(name: string, ...types: Type[]): Module;

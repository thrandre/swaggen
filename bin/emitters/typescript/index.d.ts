import { Module, EmittedModule } from "../../types";
export declare function onBeforeEmit(modules: Module[]): void;
export declare function emit(modules: Module[], basePath: string): EmittedModule[];

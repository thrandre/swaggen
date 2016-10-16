import { Module } from "./types";
export declare function readTemplate(filePath: string): string;
export declare function resolveModulePath(module: Module, baseDir: string, extension: string): string;
export declare function resolveRelativePath(source: string, target: string, extension: string, keepExtension?: boolean): string;
export declare function resolveRelativeModulePath(source: Module, target: Module, extension: string, keepExtension?: boolean): string;
export declare function nixPath(path: string): string;
export declare function resolvePath(path: string): string;

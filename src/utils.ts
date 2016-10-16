import { readFileSync } from "fs";
import { resolve, relative, dirname, basename, join } from "path";
import { startsWith } from "lodash";

import { Module, ModuleType } from "./types";

export function readTemplate(filePath: string): string {
    return readFileSync(resolve(process.cwd(), filePath)).toString();
}

export function resolveModulePath(module: Module, baseDir: string, extension: string) {
    return `${ baseDir }/${{
        [ModuleType.Model]: "models",
        [ModuleType.Endpoint]: "endpoints"
    }[module.type]}/${ module.name }${ startsWith(extension, ".") ? extension : "." + extension }`;
}

export function resolveRelativePath(source: string, target: string, extension: string, keepExtension: boolean = false) {
    return join(
        relative(
            dirname(source),
            dirname(target)
        ),
        basename(target, !keepExtension ? extension : "")
    );
}

export function resolveRelativeModulePath(source: Module, target: Module, extension: string, keepExtension: boolean = false) {
    const sourcePath = source.getPath(extension);
    const targetPath = target.getPath(extension);
    
    return resolveRelativePath(sourcePath, targetPath, extension, keepExtension);
}

function fixDot(path: string) {
    return !startsWith(path, "../")
        ? (!startsWith(path, "./") 
            ? (!startsWith(path, "/")
                ? "./" + path
                : "." + path)
            : path)
        : path;
}

export function nixPath(path: string) {
    return fixDot(path.replace(/\\/g, "/"));
}

export function resolvePath(path: string) {
    return resolve(process.cwd(), path);
}

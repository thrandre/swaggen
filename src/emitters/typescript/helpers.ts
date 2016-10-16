import { TypeInfo } from "../../types";
import { nixPath } from "../../utils";

export function expandIdentifier(identifier: string, typeInfo: TypeInfo, required: boolean = true, shouldEscapeDots: boolean = true) {
    return `${ shouldEscapeDots ? escapeDots(identifier) : identifier }${ !required ? "?" : "" }: ${ expandTypeInfo(typeInfo) }`;
}

export function expandTypeInfo(typeInfo: TypeInfo) {
    return `${ typeInfo.type.name }${typeInfo.isCollection ? "[]" : ""}`;
}

export function escapeDots(identifier: string) {
    return identifier.replace(/\./g, "_");
}

export function ifNotNull<TTarget, TResult>(target: TTarget, func: (target: TTarget) => TResult): TResult {
    return target && func(target);
}

export function createParameterHash(keys: string[], shouldEscapeDots: boolean = true) {
    return keys.length > 0
        ? `{ ${ keys.map(k => `"${ escapeDots ? escapeDots(k) : k }": ${ k }`) } }`
        : "{}";
}

export function formatUri(uri: string, shouldEscapeDots: boolean = true) {
    return "`" + uri.replace(/\{(.*?)\}/g, (sub: any, ...args: any[]) => "${ " + shouldEscapeDots ? escapeDots(args[0]) : args[0] + " }") + "`";
}

export function fixPath(path: string) {
    return nixPath(path);
}
import { nixPath } from "../../utils";

export function escapeDots(identifier: string) {
    return identifier.replace(/\./g, "_");
}

export function createParameterHash(keys: string[], shouldEscapeDots: boolean = true) {
    return keys.length > 0
        ? `{ ${ keys.map(k => `"${ shouldEscapeDots ? escapeDots(k) : k }": ${ k }`) } }`
        : "{}";
}

export function fixPath(path: string) {
    return nixPath(path);
}

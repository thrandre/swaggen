import { EndpointMetadata, ModelMetadata } from "./metadata";
import { readTemplate, resolveRelativeModulePath, nixPath } from "./utils";

import { join } from "path";
import { template, groupBy, assign } from "lodash";

const helpers = {
    expandVar(name: string, typeInfo: any, required: boolean = true, escape: boolean = true) {
        return `${ escape ? this.escapeName(name) : name }${ !required ? "?" : "" }: ${ this.expandType(typeInfo) }`;
    },

    expandType(typeInfo: any) {
        return `${ typeInfo.type.name }${ typeInfo.isCollection ? "[]": "" }`;
    },

    escapeName(name: string) {
        return name.replace(/\./g, "_");
    },

    ifNotNull(target: any, func: (t: any) => any) {
        target && func(target);
    },

    createObject(keys: string[], escape: boolean = true) {
        return keys.length > 0
            ? `{ ${ keys.map(key => `${ escape ? (this.escapeName(key) !== key ? `"${key}": ` + this.escapeName(key) : key) : key}`).join(", ") } }`
            : "{}";
    },

    formatUri(uri: string) {
        return "`" + uri.replace(/\{(.*?)\}/g, (sub: any, ...args: any[]) => "${ " + this.escapeName(args[0]) + " }") + "`";
    },

    fixPath(path: string) {
        return nixPath(path);
    }
};

export function emitEndpointModule(module: any) {
    return template(readTemplate("./endpoint.template.tpl"))(assign({}, { module }, { helpers }));
}

export function emitModelModule(module: any) {
    return template(readTemplate("./model.template.tpl"))(assign({}, { module }, { helpers }));
}

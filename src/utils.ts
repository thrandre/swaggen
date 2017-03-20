import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { resolve, relative, dirname, basename, join } from "path";
import { startsWith } from "lodash";
import { createHash } from "crypto";

export function execTool(...cmds: string[]) {
    const [
        exe,
        ...args
    ] = cmds;

     spawnSync(join(__dirname, "../node_modules/.bin", exe), args, { shell: true });
}

export function readTemplate(filePath: string): string {
    return readFileSync(filePath).toString();
}

export function getModuleHash(content: string) {
    return createHash("sha256")
        .update(content)
        .digest()
        .toString("hex");
}

export function resolveRelativePath(
    source: string,
    target: string,
    extension: string,
    keepExtension: boolean = false
) {
    const path = join(
        relative(
            dirname(source),
            dirname(target)
        ),
        basename(target, !keepExtension ? extension : "")
    );

    return nixPath(path);
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

export function resolvePath(path: string, relativeTo: string = process.cwd()) {
    return resolve(relativeTo, path);
}

export interface Hash<T> {
    [key: string]: T;
    [key: number]: T;
}

export interface IUse<T, T2> {
    default(value: T): IUse<T, T2>;
    in<T2>(inFn: (target: T) => T2): T2;
}

export function use<T, T2>(target: T): IUse<T, T2> {
    let defaultValue: T;
    const fns = {
        in(inFn: (target: T) => T2) {
            return inFn(target ? target : (defaultValue ? defaultValue : target));
        },
        default(value: T) { defaultValue = value; return fns; }
    };

    return fns;
}

export function toLookup<T>(target: T[], keySelector: (i: T) => string): Hash<T> {
    return target.reduce((p, n) => ({ ...p, [keySelector(n)]: n }), {});
}

export function findOrThrow<T>(target: T[], predicate: (i: T) => boolean) {
    const found = target.find(predicate);
    
    if(!found) {
        throw new Error("Found no matching items.");
    }

    return found;
}

export function createTimer(tickFn: Action, interval: number, fireImmediately = true) {
    if(fireImmediately) {
        tickFn();
    }

    return setInterval(tickFn, interval);
}

export function toMap<TKey, TVal>(target: TVal[], keySelector: (obj: TVal) => TKey): Map<TKey, TVal[]>
export function toMap<TKey, TVal, TTVal>(target: TVal[], keySelector: (obj: TVal) => TKey, transformValue: (obj: TVal) => TTVal): Map<TKey, TTVal[]>
export function toMap<TKey, TVal, TTVal>(target: TVal[], keySelector: (obj: TVal) => TKey, transformValue?: (obj: TVal) => TTVal): Map<TKey, TTVal[]>
{
    const map = new Map<TKey, TTVal[]>();
    
    target.forEach(o => {
        const key = keySelector(o);
        const val = (transformValue ? transformValue(o) : o) as TTVal;
        
        if(map.has(key)) {
            const bucket = map.get(key) as TTVal[];
            if(!bucket.includes(val)) {
                bucket.push(val);
            }
            return;
        }

        map.set(key, [ val ]);
    });
    
    return map;
}

export type Action = () => void;
export type Action1<TIn> = (input: TIn) => void;
export type Fn<TOut> = () => TOut;
export type Fn1<TIn, TOut> = (input: TIn) => TOut;
export type Fn2<TIn1, TIn2, TOut> = (input1: TIn1, input2: TIn2) => TOut;

export namespace Helpers {
    export function ifNotNull<TTarget, TResult>(target: TTarget, func: (target: TTarget) => TResult): TResult {
        return target && func(target);
    }

    export function camelCase(str: string) {
        return str.split("_")
            .map(s => s.substr(0, 1).toLowerCase() + s.substr(1))
            .join("_");
    }

    export function interpolateUrl(
        url: string,
        interpolateFn: Fn2<string, boolean, string>,
        wrapInnerFn: Fn1<string, string> = i => i,
        wrapOuterFn: Fn1<string, string> = i => i,
        outerRegex = /(\{[0-9a-zA-Z]+\})/,
        innerRegex = /\{([0-9a-zA-Z]+)\}/
    ) {
        return wrapOuterFn(
            url
                .split(outerRegex)
                .filter(c => !!c)
                .map(c => {
                    const patternMatch = innerRegex.exec(c);
                    return {
                        chunk: patternMatch ? patternMatch[1] : c,
                        interpolate: !!patternMatch
                    };
                })
                .reduce(
                    (agg, { chunk, interpolate }, idx, arr) =>
                        agg + (interpolate ? interpolateFn(chunk, idx === arr.length-1) : wrapInnerFn(chunk)), 
                    ""
        ));
    }
}

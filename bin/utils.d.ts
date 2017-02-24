export declare function readTemplate(filePath: string): string;
export declare function resolveRelativePath(source: string, target: string, extension: string, keepExtension?: boolean): string;
export declare function nixPath(path: string): string;
export declare function resolvePath(path: string, relativeTo?: string): string;
export interface Hash<T> {
    [key: string]: T;
    [key: number]: T;
}
export interface IUse<T, T2> {
    default(value: T): IUse<T, T2>;
    in<T2>(inFn: (target: T) => T2): T2;
}
export declare function use<T, T2>(target: T): IUse<T, T2>;
export declare function toLookup<T>(target: T[], keySelector: (i: T) => string): Hash<T>;
export declare function findOrThrow<T>(target: T[], predicate: (i: T) => boolean): T;
export declare function toMap<TKey, TVal>(target: TVal[], keySelector: (obj: TVal) => TKey): Map<TKey, TVal[]>;
export declare function toMap<TKey, TVal, TTVal>(target: TVal[], keySelector: (obj: TVal) => TKey, transformValue: (obj: TVal) => TTVal): Map<TKey, TTVal[]>;

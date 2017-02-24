export declare function escapeDots(identifier: string): string;
export declare function ifNotNull<TTarget, TResult>(target: TTarget, func: (target: TTarget) => TResult): TResult;
export declare function createParameterHash(keys: string[], shouldEscapeDots?: boolean): string;
export declare function formatUri(uri: string, shouldEscapeDots?: boolean): string;
export declare function fixPath(path: string): string;

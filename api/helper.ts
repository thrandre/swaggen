export type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

export interface RequestInfo<TSuccess, TError> {
    url: string;
    method: HttpMethod;
    query: {[key: string]: any};
    data?: any;
}

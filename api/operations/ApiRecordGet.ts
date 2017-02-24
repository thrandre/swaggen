import { Record } from "../schemas/Record";
import { RequestInfo } from "../helper";

export function apiRecordGet(): RequestInfo<Record[], any> {
    return {
        url: `/api/Record`,
        method: "get",
        query: {},
        data: null
    };
}

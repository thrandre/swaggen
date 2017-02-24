import { RecordId } from "../schemas/RecordId";
import { Record } from "../schemas/Record";
import { RequestInfo } from "../helper";

export function apiRecordByIdGet(id: RecordId): RequestInfo<Record, any> {
    return {
        url: `/api/Record/${id}`,
        method: "get",
        query: {},
        data: null
    };
}

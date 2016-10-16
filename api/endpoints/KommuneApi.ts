import { RequestInfo } from "../utils";
import { KommuneViewModel } from "../models/KommuneViewModel";

export function get(): RequestInfo<KommuneViewModel[]> {
	return {
		uri: `/api/kommune`,
		method: "get",
		query: {},
		data: null
	};
}


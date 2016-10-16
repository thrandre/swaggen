import { RequestInfo } from "../utils";
import { FylkesmannViewModel } from "../models/FylkesmannViewModel";

export function get(): RequestInfo<FylkesmannViewModel[]> {
	return {
		uri: `/api/fylkesmann`,
		method: "get",
		query: {},
		data: null
	};
}


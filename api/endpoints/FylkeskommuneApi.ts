import { RequestInfo } from "../utils";
import { FylkeskommuneViewModel } from "../models/FylkeskommuneViewModel";

export function get(): RequestInfo<FylkeskommuneViewModel[]> {
	return {
		uri: `/api/fylkeskommune`,
		method: "get",
		query: {},
		data: null
	};
}


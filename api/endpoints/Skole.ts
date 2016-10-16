import { RequestInfo } from "../utils";
import { SkoleViewModel } from "../models/SkoleViewModel";

export function get(organisasjonsnummer: string): RequestInfo<SkoleViewModel> {
	return {
		uri: `/api/skole`,
		method: "get",
		query: { "organisasjonsnummer": organisasjonsnummer },
		data: null
	};
}


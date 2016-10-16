import { RequestInfo } from "../utils";

export function get(): RequestInfo<any> {
	return {
		uri: `/api/status`,
		method: "get",
		query: {},
		data: null
	};
}

export function test(id: number): RequestInfo<any> {
	return {
		uri: `/api/status/test/id`,
		method: "get",
		query: {},
		data: null
	};
}


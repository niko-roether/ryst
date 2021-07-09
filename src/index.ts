import { IncomingMessage } from "http";
import { URL } from "url";
import Request, { RequestAbortedError, RequestOptions, RequestTimeoutError } from "./request";

export type RequestOptionsWithoutMethod = Omit<RequestOptions, "method">;


function request(url: string | URL, options: RequestOptions, cb?: ((res: IncomingMessage) => void) | undefined) {
	return new Request(url, options, cb);
}

function get(url: string | URL, options: RequestOptionsWithoutMethod, cb?: ((res: IncomingMessage) => void) | undefined) {
	return new Request(url, {...options, method: "GET"}, cb);
}
function post(url: string | URL, options: RequestOptionsWithoutMethod, cb?: ((res: IncomingMessage) => void) | undefined) {
	return new Request(url, {...options, method: "POST"}, cb);
}

function head(url: string | URL, options: RequestOptionsWithoutMethod, cb?: ((res: IncomingMessage) => void) | undefined) {
	return new Request(url, {...options, method: "HEAD"}, cb);
}

export type { RequestOptions }

export {
	RequestAbortedError,
	RequestTimeoutError,
	request,
	get,
	post,
	head
}
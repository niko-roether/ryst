import { IncomingMessage } from "http";
import { URL } from "url";
import Request, { RequestAbortedError, RequestOptions, RequestTimeoutError } from "./request";
import Response from "./response";

export type RequestOptionsWithoutMethod = Omit<RequestOptions, "method">;

/**
 * Makes a http request.
 * @param url The target url for the request.
 * @param options Options for the request, such as it's method, headers or data.
 * @param cb An optional callback, called when the request is sent and given an `IncomingMessage` as a parameter.
 * @returns a `ryst.Request` object representing the request.
 */
function request(url: string | URL, options: RequestOptions, cb?: ((res: IncomingMessage) => void) | undefined) {
	return new Request(url, {method: "GET", ...options}, cb);
}

/**
 * Makes a http GET request.
 * @param url The target url for the request.
 * @param options Options for the request, such as it's headers or data.
 * @param cb An optional callback, called when the request is sent and given an `IncomingMessage` as a parameter.
 * @returns a `ryst.Request` object representing the request.
 */
function get(url: string | URL, options?: RequestOptionsWithoutMethod, cb?: ((res: IncomingMessage) => void) | undefined) {
	return new Request(url, {...options, method: "GET"}, cb);
}

/**
 * Makes a http POST request.
 * @param url The target url for the request.
 * @param options Options for the request, such as it's headers or data.
 * @param cb An optional callback, called when the request is sent and given an `IncomingMessage` as a parameter.
 * @returns a `ryst.Request` object representing the request.
 */
function post(url: string | URL, options?: RequestOptionsWithoutMethod, cb?: ((res: IncomingMessage) => void) | undefined) {
	return new Request(url, {...options, method: "POST"}, cb);
}

/**
 * Makes a http HEAD request.
 * @param url The target url for the request.
 * @param options Options for the request, such as it's headers or data.
 * @param cb An optional callback, called when the request is sent and given an `IncomingMessage` as a parameter.
 * @returns a `ryst.Request` object representing the request.
 */
function head(url: string | URL, options?: RequestOptionsWithoutMethod, cb?: ((res: IncomingMessage) => void) | undefined) {
	return new Request(url, {...options, method: "HEAD"}, cb);
}

export type { RequestOptions }

export {
	RequestAbortedError,
	RequestTimeoutError,
	Request,
	Response,
	request,
	get,
	post,
	head
}
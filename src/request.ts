import { ClientRequest as HttpClientRequest, ClientRequestArgs, IncomingMessage } from "http";
import { urlToHttpOptions } from "url";
import { globalAgent as httpsGlobalAgent } from "https";
import { URL } from "url";
import { VERSION } from "./constants";
import Response from "./response";
import { toURL } from "./utils";


/** An error that occurs when a request was aborted by the client. */
class RequestAbortedError extends Error {
	/** The request that was aborted. */
	public readonly request: Request;

	/**
	 * @param request The request that was aborted.
	 */
	constructor(request: Request) {
		super(`The ${request.method} request for ${request.host}/${request.path} was aborted by the client.`);
		this.request = request;
	}
};

/** An error that occurs when a request times out. */
class RequestTimeoutError extends Error {
	/** The request that timed out. */
	public readonly request: Request;

	/**
	 * @param request The request that timed out.
	 */
	constructor(request: Request) {
		super(`The ${request.method} request for ${request.host}/${request.path} timed out.`);
		this.request = request;
	}
}

/** Options for a http request. */
export interface RequestOptions extends Pick<ClientRequestArgs, Exclude<keyof ClientRequestArgs | "auth" | "hash" | "_defaultAgent", keyof URL>> {
	/**
	 * The data to be sent. Can be in one of these three formats:
	 *  - An object, which will be automatically converted to json
	 *  - A string
	 *  - A buffer
	 */
	data?: {[key: string]: any} | string | Buffer;
	/**
	 * The text encoding in which the data is to be sent, if applicapble.
	 * 
	 * The default is utf-8.
	 */
	encoding?: BufferEncoding;
	/** A callback called when the data is written to the request, possibly with an error as an argument. */
	dataWriteCallback?: (err: Error | null | undefined) => void;
}

function createRequestArgs(url: string | URL, options?: RequestOptions, defaultHeaders?: {[key: string]: string}): string | URL | ClientRequestArgs {
	if(!options) return url;
	url = toURL(url);
	
	let args: ClientRequestArgs = {
		...urlToHttpOptions(url),
		_defaultAgent: httpsGlobalAgent,
	};
	if(options) {
		let {data, encoding, dataWriteCallback, headers, ...other} = options
		args = {
			...args,
			headers: {
				...defaultHeaders,
				...headers
			},
			...other
		};
	}
	return args;
}

/** An object representing an http request. */
class Request extends HttpClientRequest implements Promise<Response> {
	private dataCallbacks: ((value: Response) => unknown)[] = [];
	private errorCallbacks: ((value: Error) => unknown)[] = [];
	private finallyCallbacks: (() => void)[] = [];
	private data?: string | Buffer;

	private static readonly STATIC_DEFAULT_HEADERS = {
		"Accept": "*/*",
		"Connection": "close",
		"User-Agent": "ryst/" + VERSION
	}

	/**
	 * @param url The target url for the request
	 * @param options The request options
	 * @param cb An optional callback for when the request is sent
	 */
	constructor(url: string | URL, options?: RequestOptions, cb?: ((res: IncomingMessage) => void) | undefined) {
		super(createRequestArgs(url, options, {
			...Request.STATIC_DEFAULT_HEADERS,
			"Host": (typeof url == "string" ? new URL(url) : url).host
		}), res => {
			res.on("data", data => {
				data = data.toString();
				if(!this.data) this.data = data;
				else this.data += data;
			});
			res.on("end", () => {
				const response = new Response(res, this.data);
				this.dataCallbacks.forEach(dcb => dcb(response));
				this.emit("data", response);
			});
			cb?.(res);
		});
		if(options?.data !== undefined) {
			let data = options.data;
			if(typeof data !== "string" && !(data instanceof Buffer))
				data = JSON.stringify(data);
			this.write(data, options.encoding ?? "utf-8", options.dataWriteCallback);
		}
		const onFinally = () => this.finallyCallbacks.forEach(cb => cb());
		this.on("abort", () => {
			this.errorCallbacks.forEach(cb => cb(new RequestAbortedError(this)));
			onFinally();
		});
		this.on("timeout", () => {
			this.destroy();
			this.errorCallbacks.forEach(cb => cb(new RequestTimeoutError(this)));
			onFinally();
		});
	}

	private onResponse<R = Response>(cb?: (value: Response) => R | PromiseLike<R>): Promise<R> {
		return new Promise(res => this.dataCallbacks.push(response => res(cb?.(response) ?? response as unknown as R)));
	}

	private onError<R = Error>(cb?: (value: Error) => R | PromiseLike<R>): Promise<R> {
		return new Promise(res => this.errorCallbacks.push(err => res(cb?.(err) ?? err as unknown as R)));
	}

	private onFinally(cb: () => void) {
		this.finallyCallbacks.push(cb);
	}

	public then<TResult1 = Response, TResult2 = never>(onfulfilled?: ((value: Response) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2> {
		this.end();
		let promises: Promise<TResult1 | TResult2>[] = [];
		if(onfulfilled) promises.push(this.onResponse(onfulfilled));
		else promises.push(Promise.resolve(this) as unknown as Promise<TResult1>);
		if(onrejected) promises.push(this.onError(onrejected));
		else promises.push(this.onError().then(() => Promise.reject()));
		return Promise.race(promises);
	}

	public catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null): Promise<Response | TResult> {
		let promises: Promise<Response | TResult>[] = [];
		if(onrejected) promises.push(this.onError(onrejected));
		else promises.push(this.onError().then(() => Promise.reject()));
		promises.push(this.onResponse());
		return Promise.race(promises);
	}

	public finally(onfinally?: (() => void) | null): Promise<Response> {
		if(onfinally) this.onFinally(onfinally);
		return this;
	}

	[Symbol.toStringTag] = "RystRequest";
}

export default Request;

export {
	RequestAbortedError,
	RequestTimeoutError
}
import { ClientRequest as HttpClientRequest, ClientRequestArgs, IncomingMessage } from "http";
import { URL } from "url";

class RequestAbortedError extends Error {
	public readonly request: Request;

	constructor(request: Request) {
		super(`The ${request.method} request for ${request.host}/${request.path} was aborted by the client.`);
		this.request = request;
	}
};

class RequestTimeoutError extends Error {
	public readonly request: Request;

	constructor(request: Request) {
		super(`The ${request.method} request for ${request.host}/${request.path} timed out.`);
		this.request = request;
	}
}

class Request extends HttpClientRequest implements Promise<IncomingMessage> {
	private responseCallbacks: ((value: IncomingMessage) => unknown)[] = [];
	private errorCallbacks: ((value: Error) => unknown)[] = [];
	private finallyCallbacks: (() => void)[] = [];

	constructor(url: string | URL | ClientRequestArgs, cb?: ((res: IncomingMessage) => void) | undefined) {
		super(url, cb);
		const onFinally = () => this.finallyCallbacks.forEach(cb => cb());
		this.on("response", response => {
			this.responseCallbacks.forEach(cb => cb(response));
			onFinally();
		});
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

	private onResponse<R = IncomingMessage>(cb?: (value: IncomingMessage) => R | PromiseLike<R>): Promise<R> {
		return new Promise(res => this.responseCallbacks.push(response => res(cb?.(response) ?? response as unknown as R)));
	}

	private onError<R = Error>(cb?: (value: Error) => R | PromiseLike<R>): Promise<R> {
		return new Promise(res => this.errorCallbacks.push(err => res(cb?.(err) ?? err as unknown as R)));
	}

	private onFinally(cb: () => void) {
		this.finallyCallbacks.push(cb);
	}

	then<TResult1 = IncomingMessage, TResult2 = never>(onfulfilled?: ((value: IncomingMessage) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2> {
		let promises: Promise<TResult1 | TResult2>[] = [];
		if(onfulfilled) promises.push(this.onResponse(onfulfilled));
		else promises.push(Promise.resolve(this) as unknown as Promise<TResult1>);
		if(onrejected) promises.push(this.onError(onrejected));
		else promises.push(this.onError().then(() => Promise.reject()));
		return Promise.race(promises);
	}

	catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null): Promise<IncomingMessage | TResult> {
		let promises: Promise<IncomingMessage | TResult>[] = [];
		if(onrejected) promises.push(this.onError(onrejected));
		else promises.push(this.onError().then(() => Promise.reject()));
		promises.push(this.onResponse());
		return Promise.race(promises);
	}

	finally(onfinally?: (() => void) | null): Promise<IncomingMessage> {
		if(onfinally) this.onFinally(onfinally);
		return this;
	}

	[Symbol.toStringTag] = "RystRequest";
}
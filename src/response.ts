import { IncomingMessage } from "http";

class Response {
	public readonly response: IncomingMessage;
	public readonly data?: string | Buffer;

	constructor(response: IncomingMessage, data?: string | Buffer) {
		this.response = response;
		this.data = data?.toString();
	}
}

export default Response;
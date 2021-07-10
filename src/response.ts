import { IncomingMessage } from "http";

class Response {
	public readonly message: IncomingMessage;
	public readonly data?: string | Buffer;

	constructor(response: IncomingMessage, data?: string | Buffer) {
		this.message = response;
		this.data = data?.toString();
	}
}

export default Response;
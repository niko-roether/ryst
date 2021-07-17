import { IncomingMessage } from "http";

/** An object representing a response to a sent http request. */
class Response {
	/** The `IncomingMessage` corresponding to the response, containing meta data such as headers and the response code. */
	public readonly message: IncomingMessage;
	/** The response data. */
	public readonly data?: string | Buffer;

	constructor(response: IncomingMessage, data?: string | Buffer) {
		this.message = response;
		this.data = data?.toString();
	}

	/**
	 * A method for automatically parsing the response data as json.
	 * @returns The parsed data if the data is indeed a string and not null; otherwise it returns null.
	 */
	public json(): {[key: string]: any} | null {
		if(!this.data || this.data instanceof Buffer) return null;
		return JSON.parse(this.data);
	}
}

export default Response;
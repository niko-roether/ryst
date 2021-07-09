import * as ryst from "./index";
import * as https from "https";

const req = ryst.get("https://www.google.com");

const test = async () => {
	const res = await req;
	console.log(res.response.statusCode);
}

test();

// https.get("https://httpstat.us/200", {
// 	timeout: 10
// }).on("connect", arg => console.log("arg: ", arg)).on("response", res => console.log("res: ", res.headers));
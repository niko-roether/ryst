# Ryst
Ryst is lightweight library for promise-based http requests in node-js, sort of a chimera-like mix between node-js' built-in 
https library, and modern promise-based code.

The example code in this README will be written in typescript.

## Making requests
The most important and fundamental function in ryst is `request()`. As the name entails, it will send an http-request to a server.
By default, this will be a GET-Request.

This method takes three arguments:
* **`url`**, which can either be a `URL` instance or a string
* **`options`**, which will be covered in more detail shortly
* **`cb`**, a callback function which will be passed an `IncomingMessage` instance, just like in node's built-in package.

The method will return a `ryst.Request`, whose properties will also be covered later, but which contains all properties
of the `http.ClientRequest`-class from the `http` package.

### Request Options
The `options` argument is very similar to the options that can be passed as the first parameter of `https.request()`;
in fact, it contains all of it's properties, **except** the following, which can instead be encoded into a `URL`-object passed as the first parameter:
* *`host`*
* *`hostname`*
* *`path`*
* *`port`*
* *`protocol`*
* *`auth`*

In addition, it contains the following new properties:
* **`data`**, which can be passed a string, a buffer, or an object that will be encoded as JSON; this will be sent as the request's content.
* **`encoding`**, the text encoding of the message's content; by default utf-8.
* **`dataWriteCallback`**, a callback that is called when data is written to the request, being given an error as an argument if one occured. The same that would be passed to `http.ClientRequest.prototype.write`.

### Helper Functions
For convenience, ryst supports the following functions, which are identical to `ryst.request()`, except that the method is predetermined and can't be set in the options:
* **`ryst.get()`**, which sends a get request
* **`ryst.post()`**, which sends a post request
* **`ryst.head()`**, which sends a head request

### Sending a request
Creating a post request with this method might look something like this:

```typescript
import * as ryst from "ryst";

const req = ryst.post("https://some.server.com", {
	headers: {
		"Content-Type": "application/json"
	},
	data: {
		property: "value",
		anotherProperty: 2
	}
});
```

## The Request Object
The `ryst.Request` object can be handled in two ways: either using Promises, or almost exactly like a `http.ClientRequest`. You can also use a mixture of both.

### Using Promises
When using `ryst.Request` using Promises, the `ryst.Request` object itself can be treated like a promise returning a `ryst.Response` object.

With this method, logging the html of the google homepage might look something like this:

```typescript
import * as ryst from "ryst";

// Using normal promise functions
const req = ryst.get("https://www.google.com");
req.then(res => console.log(res.data));

// using async/await (only within asynchronous functions):
const res = await ryst.get("https://www.google.com");
console.log(res.data);
```

### Like A ClientRequest
When using `ryst.Request` like a `http.ClientRequest`, response data is obtained by using event listeners. For conveniences sake,
`ryst.Request` emits an event that `http.ClientRequest` doesn't, which is the `data` event. It will be emitted exactly once when
the response data has been entirely recieved, and passed a `ryst.Response` object as a parameter, which will be explained in detail shortly.

It is also possible to write headers and data to the request using `setHeader()` and `write()` respectively, as well as other such methods
inherited from `http.ClientRequest`.

Note that using this method, it is necessary to close the request manually using the `end()` method.

With this method, logging the html of the google homepage might look something like this:

```typescript
import * as ryst from "ryst";

const req = ryst.get("https://www.google.com");
req.on("data", res => console.log(res.data))
req.end();
```

### Mixing the two methods
It is of course possible to mix the two methods, for example using `write()` to write content to the request or `setHeader()` to write
headers, and then using `await` to get the response. You can also use event listeners on requests while also treating them as a promise.
The only caveat here is that awaiting a request or calling `then()` on it has the same effect of calling `end()`; at that moment the request will be sent and it is no longer possible to alter it.

As an example, you could set request headers this way instead of using the options parameter:

```typescript
const req = ryst.get("https://www.google.com");
req.setHeader("Accept", "text/html");
const res = await req;
console.log(res.data);
```

## The Response Object
The response object contains two properties; `message`, which is an instance of `IncomingMessage`, containing meta data for the response such as headers
and the status code, and `data`, which is the response data. It also has the `json()` method, which automatically parses the data as json and returns
it, if the data is in fact a string. This method will throw an error if the data is a string but not of valid json format; if the data is not a string it will simply return null.

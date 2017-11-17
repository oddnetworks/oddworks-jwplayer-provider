const crypto = require(`crypto`);
const {delay} = require(`./library`);
const httpClient = require(`./http-client`);

// The API will allow about 180 requests per minute.
const DEFAULT_REQUEST_INTERVAL = 200;
const DEFAULT_HOSTNAME = `api.jwplatform.com`;

// A queue is necessary to stay under the rate limiting threshholds.
//
// This queue works by creating pushing Promise wrappers (closure functions) onto an
// Array and poping them off in order for execution. A preconfigured request interval
// determines how often this wrapped executables are popped off and executed.
function createQueue(requestInterval) {
	const queue = [];
	let requestInProgress = false;

	function nextRequest() {
		if (requestInProgress) {
			return null;
		}

		const req = queue.pop();
		if (!req) {
			return null;
		}

		requestInProgress = true;
		return req();
	}

	function onComplete() {
		return delay(requestInterval).then(() => { // eslint-disable-line no-use-extend-native/no-use-extend-native
			requestInProgress = false;
			nextRequest();
			return null;
		});
	}

	function queueRequest(req) {
		return new Promise((resolve, reject) => {
			// Create a closure function around the request and push it onto the queue.
			queue.push(() => {
				return req().then(res => {
					onComplete();
					resolve(res);
					return null;
				}).catch(err => {
					onComplete();
					reject(err);
					return null;
				});
			});

			nextRequest();
		});
	}

	return queueRequest;
}

function stringifyParams(params) {
	return Object.keys(params)
		.map(k => [encodeURIComponent(k), encodeURIComponent(params[k])])
		.sort()
		.map(query => `${query[0]}=${query[1]}`)
		.join(`&`);
}

function signParameters(secret, queryString) {
	const sha = crypto.createHash(`sha1`);
	sha.update(queryString + secret);
	return sha.digest(`hex`);
}

exports.createClient = function (options) {
	options = options || {};
	const {apiKey, apiSharedSecret} = options;
	const hostname = options.hostname || DEFAULT_HOSTNAME;
	const requestInterval = Number.isInteger(options.requestInterval) ? options.requestInterval : DEFAULT_REQUEST_INTERVAL;

	if (typeof apiKey !== `string` || apiKey.length < 1) {
		throw new Error(`Invalid options.apiKey passed to createClient().`);
	}
	if (typeof apiSharedSecret !== `string` || apiSharedSecret.length < 1) {
		throw new Error(`Invalid options.apiSharedSecret passed to createClient().`);
	}

	const queue = createQueue(requestInterval);

	function makeRequest(path, params) {
		// API Authentication:
		//   https://developer.jwplayer.com/jw-platform/reference/v1/authentication.html
		const queryParams = Object.assign(
			{
				api_key: apiKey, // eslint-disable-line camelcase
				api_timestamp: Math.floor(Date.now() / 1000), // eslint-disable-line camelcase
				api_nonce: Math.floor(Math.random() * 90000000) + 10000000, // eslint-disable-line camelcase
				api_format: `json` // eslint-disable-line camelcase
			},
			params
		);

		const queryString = stringifyParams(queryParams);
		const signature = signParameters(apiSharedSecret, queryString);

		const requestParams = {
			hostname,
			path: `/v1${path}?${queryString}&api_signature=${signature}`,
			headers: {
				Accept: `*/*`
			}
		};

		// Queue the request as an anonymous encapsulated function.
		return queue(() => {
			return httpClient.makeRequest(requestParams).then(res => {
				// We get a statusCode: 429 when the API rate limit is hit.
				// console.log(`statusCode:`, res.statusCode);
				// console.log(`headers:`, JSON.stringify(res.headers, null, 2));
				const body = JSON.parse(res.body);
				console.log(JSON.stringify(body, null, 2));
				return null;
			});
		});
	}

	return makeRequest;
};

// statusCode: 400
// headers: {
//   "cache-control": "no-cache",
//   "content-type": "application/json; charset=utf-8",
//   "date": "Fri, 10 Nov 2017 00:46:51 GMT",
//   "pragma": "no-cache",
//   "server": "openresty",
//   "content-length": "86",
//   "connection": "Close"
// }
// body =>
// {"status": "error", "message": "", "code": "NoMethod", "title": "No Method Specified"}

// statusCode: 200
// headers: {
//   "cache-control": "no-cache",
//   "content-type": "application/json; charset=utf-8",
//   "date": "Fri, 10 Nov 2017 00:48:35 GMT",
//   "pragma": "no-cache",
//   "server": "openresty",
//   "x-ratelimit-limit": "180",
//   "x-ratelimit-remaining": "174",
//   "x-ratelimit-reset": "1510274940",
//   "content-length": "9181",
//   "connection": "Close"
// }
// body =>
// {"status": "ok", "rate_limit": {"reset": 1510274940, "limit": 180, "remaining": 174},

// {
//   "status": "ok",
//   "rate_limit": {
//     "reset": 1510278240,
//     "limit": 180,
//     "remaining": 179
//   },
//   "channels": [
//     {
//       "description": null,
//       "videos": {
//         "total": 1
//       },
//       "views": 0,
//       "link": null,
//       "key": "arHmpXSg",
//       "title": "*Homepage TV Widget",
//       "default": false,
//       "author": null,
//       "custom": {},
//       "pin_slot_2": null,
//       "pin_slot_1": null,
//       "type": "manual"
//     },
//     {
//       "description": null,
//       "videos": {
//         "max": 10,
//         "total": 6
//       },
//       "views": 0,
//       "link": null,
//       "key": "izDrdBOV",
//       "title": "Air Checks",
//       "default": false,
//       "author": null,
//       "custom": {},
//       "pin_slot_2": null,
//       "pin_slot_1": null,
//       "type": "dynamic"
//     },
//     {
//       "description": null,
//       "videos": {
//         "max": 10,
//         "total": 10
//       },
//       "views": 47567,
//       "link": null,
//       "key": "eEmgSEYZ",
//       "title": "Dana Free",
//       "default": false,
//       "author": null,
//       "custom": {},
//       "pin_slot_2": null,
//       "pin_slot_1": null,
//       "type": "dynamic"
//     }
//   ],
//   "limit": 3,
//   "offset": 0,
//   "total": 37
// }

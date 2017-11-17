const JWManagement = require(`./lib/management-client`);

const client = JWManagement.createClient({
	apiKey: `7P7fiutP`,
	apiSharedSecret: `ioPr4TIErtUzuK3hRD21zg1T`
});

// function range(n) {
// 	const a = [];
// 	for (; n >= 0; n--) {
// 		a.push(n);
// 	}
// 	return a;
// }

// const chunks = range(9).map(() => range(20));

// const start = Date.now();

// chunks.reduce((promise, chunk) => {
// 	return promise.then(() => {
// 		return Promise.all(chunk.map(() => {
// 			return client(`/channels/list`, {result_limit: 10}).then(() => {
// 				console.log(Date.now() - start);
// 			});
// 		}));
// 	});
// }, Promise.resolve(null));

return client(`/channels/list`, {result_limit: 3});

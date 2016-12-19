'use strict';

const Promise = require('bluebird');
const yargs = require('yargs');
const Client = require('./lib/client');

const REQUEST_METHODS = Object.create(null);
REQUEST_METHODS.makeRequest = '{"path": "STRING"}';
REQUEST_METHODS.getPlaylists = '{}';
REQUEST_METHODS.getPlaylist = '{"playlistId": "STRING"}';
REQUEST_METHODS.getVideosByPlaylist = '{"playlistId": "STRING"}';
REQUEST_METHODS.getVideo = '{"videoId": "STRING"}';
REQUEST_METHODS.getConversionsByVideo = '{"videoId": "STRING"}';

exports.main = function () {
	const args = yargs
		.usage('Usage: $0 <command> [options]')
		.command('req', 'Make an jwplayer client request', {
			method: {
				alias: 'm',
				default: 'makeRequest',
				describe: 'Use the "list" command to see available methods'
			},
			args: {
				alias: 'a',
				describe: 'Arguments object as a JSON string',
				demand: true
			},
			apiKey: {
				describe: 'Defaults to env var JWPLAYER_API_KEY'
			},
			secretKey: {
				describe: 'Defaults to env var JWPLAYER_SECRET_KEY'
			},
			baseUrl: {
				describe: 'Base URL to use',
				default: 'https://api.jwplatform.com'
			}
		})
		.command('list', 'List jwplayer client methods')
		.help();

	const argv = args.argv;

	const command = argv._[0];

	switch (command) {
		case 'list':
			return listCommand();
		case 'req':
			return requestCommand({
				baseUrl: argv.baseUrl,
				apiKey: argv.apiKey || process.env.JWPLAYER_API_KEY,
				secretKey: argv.secretKey || process.env.JWPLAYER_SECRET_KEY,
				method: argv.method,
				args: argv.args
			});
		default:
			console.error('A command argument is required.');
			console.error('Use the --help flag to print out help.');
			return Promise.resolve(null);
	}
};

function listCommand() {
	console.log('Request methods:');
	console.log('');

	Object.getOwnPropertyNames(Client.prototype).forEach(key => {
		if (REQUEST_METHODS[key]) {
			console.log('  %s --args %s', key, REQUEST_METHODS[key]);
		}
	});

	return Promise.resolve(null);
}

function requestCommand(args) {
	const apiKey = args.apiKey;
	const secretKey = args.secretKey;
	const baseUrl = args.baseUrl;
	const method = args.method;

	if (!baseUrl) {
		console.error('An baseUrl is required (--baseUrl)');
		return Promise.resolve(null);
	}
	if (!apiKey) {
		console.error('An apiKey is required (JWPLAYER_API_KEY)');
		return Promise.resolve(null);
	}
	if (!secretKey) {
		console.error('A secretKey is required (JWPLAYER_SECRET_KEY)');
		return Promise.resolve(null);
	}

	let params;
	try {
		params = JSON.parse(args.args);
	} catch (err) {
		console.error('--args JSON parsing error:');
		console.error(err.message);
		return Promise.resolve(null);
	}

	const client = new Client({
		baseUrl,
		apiKey,
		secretKey
	});

	return client[method](params).then(res => {
		console.log(JSON.stringify(res));
		return null;
	});
}

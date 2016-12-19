'use strict';

const crypto = require('crypto');
const Promise = require('bluebird');
const request = require('request');
const Boom = require('boom');
const debug = require('debug')('oddworks:client:jwplayer:makeRequest');

const PATH_PREFIX = '/v1';

class Client {
	// spec.bus *optional
	// spec.baseUrl *required
	// spec.apiKey *required
	// spec.secretKey *required
	constructor(spec) {
		// The bus is optional, so you need to check for it before
		// using it.
		this.bus = spec.bus || null;

		this.baseUrl = spec.baseUrl;
		this.apiKey = spec.apiKey;
		this.secretKey = spec.secretKey;

		this.getPlaylists = this.getPlaylists.bind(this);
		this.getPlaylist = this.getPlaylist.bind(this);
		this.getVideosByPlaylist = this.getVideosByPlaylist.bind(this);
		this.getVideo = this.getVideo.bind(this);
	}

	// args.apiKey
	// args.secretKey
	getPlaylists(args) {
		args = args || {};
		args.path = `${PATH_PREFIX}/channels/list`;
		return this.makeRequest(args);
	}

	// args.playlistId *required
	// args.apiKey
	// args.secretKey
	getPlaylist(args) {
		const id = args.playlistId;
		if (!id || typeof id !== 'string') {
			throw new Error('getPlaylist() playlistId is required');
		}
		args.path = `${PATH_PREFIX}/channels/show`;
		args.query = {
			channel_key: id // eslint-disable-line camelcase
		};
		return this.makeRequest(args);
	}

	// args.playlistId *required
	// args.apiKey
	// args.secretKey
	getVideosByPlaylist(args) {
		const id = args.playlistId;
		if (!id || typeof id !== 'string') {
			throw new Error('getVideosByPlaylist() playlistId is required');
		}
		args.path = `${PATH_PREFIX}/channels/videos/list`;
		args.query = {
			channel_key: id // eslint-disable-line camelcase
		};
		return this.makeRequest(args);
	}

	// args.videoId *required
	// args.apiKey
	// args.secretKey
	getVideo(args) {
		const id = args.videoId;
		if (!id || typeof id !== 'string') {
			throw new Error('getVideo() videoId is required');
		}
		args.path = `${PATH_PREFIX}/videos/show`;
		args.query = {
			video_key: id // eslint-disable-line camelcase
		};
		return this.makeRequest(args);
	}

	// args.videoId *required
	// args.apiKey
	// args.secretKey
	getConversionsByVideo(args) {
		const id = args.videoId;
		if (!id || typeof id !== 'string') {
			throw new Error('getConversionsByVideo() videoId is required');
		}
		args.path = `${PATH_PREFIX}/videos/conversions/list`;
		args.query = {
			video_key: id // eslint-disable-line camelcase
		};
		return this.makeRequest(args);
	}

	// args.path *required
	// args.apiKey
	// args.secretKey
	makeRequest(args) {
		const method = 'GET';
		const path = args.path;

		const apiKey = args.apiKey || this.apiKey;
		const secretKey = args.secretKey || this.secretKey;

		if (!apiKey || typeof apiKey !== 'string') {
			throw new Error('An apiKey is required to makeRequest()');
		}
		if (!secretKey || typeof secretKey !== 'string') {
			throw new Error('An secretKey is required to makeRequest()');
		}

		let timestamp = new Date();
		timestamp = new Date(timestamp.getUTCFullYear(), timestamp.getUTCMonth(), timestamp.getUTCDate(), timestamp.getUTCHours(), timestamp.getUTCMinutes(), timestamp.getUTCSeconds());
		timestamp = timestamp.getTime() / 1000;

		/* eslint-disable camelcase, no-mixed-operators */
		const query = Object.assign({
			api_format: 'json',
			api_nonce: Math.floor(Math.random() * (99999999 - 100000 + 1) + 10000000),
			api_timestamp: timestamp,
			api_key: apiKey
		}, args.query);
		/* eslint-enable */

		const signature = Client.generateSignature({secretKey, query});

		const qs = Object.assign({}, query, {api_signature: signature}); // eslint-disable-line camelcase
		const url = `${this.baseUrl}${path}`;

		debug(`Making JWPlayer Request - url: ${url}`);
		debug(' with querystring %o', qs);
		return Client.request({method, url, qs});
	}

	isAuthenticated() {
		const hasApiKey = this.apiKey && typeof this.apiKey === 'string';
		const hasSecretKey = this.secretKey && typeof this.secretKey === 'string';
		return hasApiKey && hasSecretKey;
	}

	static request(params) {
		return new Promise((resolve, reject) => {
			request(params, (err, res, body) => {
				if (err) {
					return reject(err);
				}

				if (res.statusCode === 404) {
					return resolve(null);
				}

				const isJson = /^application\/json/.test(res.headers['content-type']);

				let data = {};
				if (isJson && typeof body === 'string') {
					try {
						data = resolve(JSON.parse(body));
					} catch (err) {
						return reject(new Error(
							`jwplayer client JSON parsing error: ${err.message}`
						));
					}
				} else if (isJson) {
					return reject(new Error(
						'jwplayer client received an empty application/json body'
					));
				} else {
					return reject(new Error(
						'jwplayer client expects content-type to be application/json'
					));
				}

				if (res.statusCode !== 200) {
					return reject(Boom.create(res.statusCode, res.statusMessage, data));
				}

				return resolve(data);
			});
		});
	}

	// params.secretKey
	// params.query
	static generateSignature(params) {
		const secretKey = params.secretKey;
		const query = Client.concatQueryParameters(params.query);
		const sha = crypto.createHash('sha1');
		sha.update(`${query}${secretKey}`);
		return sha.digest('hex');
	}

	static concatQueryParameters(params) {
		return Object.keys(params || {})
			.map(k => {
				return [k, params[k]];
			})
			.sort()
			.reduce((str, query) => {
				return `${str}&${query.join('=')}`;
			}, '')
			.substring(1);
	}
}

module.exports = Client;

'use strict';
 /* eslint-disable camelcase */

const crypto = require('crypto');
const Promise = require('bluebird');
const request = require('request');
const Boom = require('boom');
const debug = require('debug')('oddworks:client:jwplayer:makeRequest');
const jwt = require('jsonwebtoken');

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
		this.getMedia = this.getMedia.bind(this);
		this.searchVideos = this.searchVideos.bind(this);
		this.searchPlaylists = this.searchPlaylists.bind(this);
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
			channel_key: id
		};
		return this.makeRequest(args);
	}

	// args.playlistId *required
	getVideosByPlaylist(args) {
		const id = args.playlistId;
		if (!id || typeof id !== 'string') {
			throw new Error('getVideosByPlaylist() playlistId is required');
		}
		const V2_PREFIX = `/v2`;
		args.path = `${V2_PREFIX}/playlists/${id}`;

		args.query = {
			format: 'json',
			poster_width: 1920
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
			video_key: id
		};
		return this.makeRequest(args);
	}

	// args.apiKey
	// args.secretKey
	getVideos(args) {
		args = args || {};
		args.path = `${PATH_PREFIX}/videos/list`;
		return this.makeRequest(args);
	}

	// args.videoId *required
	// args.apiKey
	// args.secretKey
	getMedia(args) {
		const id = args.videoId;
		if (!id || typeof id !== 'string') {
			throw new Error('getMedia() videoId is required');
		}
		const V2_PREFIX = `/v2`;
		args.path = `${V2_PREFIX}/media/${id}`;

		args.query = {
			format: 'json',
			poster_width: 1920
		};
		return this.makeRequest(args);
	}

	// args.apiKey
	// args.secretKey
	// args.search *required
	searchVideos(args) {
		args = args || {};
		const search = args.search;
		const query = args.query || {};

		if (!search || typeof search !== 'string' || search.length < 1) {
			throw new Error('searchVideos() search STRING with a length > 1 is required');
		}
		args.query = Object.assign(
			query,
			{search},
			{statuses_filter: 'ready'}
		);
		args.path = `${PATH_PREFIX}/videos/list`;
		return this.makeRequest(args);
	}

	// args.apiKey
	// args.secretKey
	// args.search *required
	searchPlaylists(args) {
		args = args || {};
		const search = args.search;
		const query = args.query || {};

		if (!search || typeof search !== 'string' || search.length < 1) {
			throw new Error('searchPlaylists() search STRING with a length > 1 is required');
		}
		args.query = Object.assign(query, {search});
		args.path = `${PATH_PREFIX}/channels/list`;
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
			video_key: id
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

		let url = `${this.baseUrl}${path}`;
		let qs = Object.assign({}, args.query);

		const pathParts = path.split('/');
		if (pathParts[1] === 'v2') {
			const V2_PATH = 'https://cdn.jwplayer.com';
			url = `${V2_PATH}${path}`;

			const tokenParams = Object.assign(
				{},
				{secretKey},
				args.query,
				{path}
			);
			qs.token = Client.generateToken(tokenParams);
		} else {
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
			qs = Object.assign({}, query, {api_signature: signature});
		}

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
					return reject(new Boom(res.statusMessage, {statusCode: res.statusCode, data}));
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

	// params.path *required
	// params.secretKey *required
	// params.related_media_id
	static generateToken(params) {
		if (!params.secretKey || typeof params.secretKey !== 'string') {
			throw new Error('A secretKey is required to generateToken()');
		}
		if (!params.path || typeof params.path !== 'string') {
			throw new Error('An params.path is required to generateToken()');
		}

		const resource = params.path;

		let exp = new Date();
		exp = new Date(exp.getUTCFullYear(), exp.getUTCMonth(), exp.getUTCDate(), exp.getUTCHours(), exp.getUTCMinutes(), exp.getUTCSeconds());
		exp = exp.getTime() / 1000;

		const payload = {exp, resource};
		payload.search = 'boss';

		if (params.related_media_id) {
			payload.related_media_id = params.related_media_id;
		}

		const token = jwt.sign(payload, params.secretKey);
		return token;
	}
}

module.exports = Client;

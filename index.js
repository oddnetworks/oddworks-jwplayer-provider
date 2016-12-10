'use strict';

const Promise = require('bluebird');
const Client = require('./lib/client');
const defaultVideoTransform = require('./lib/default-video-transform');
const defaultCollectionTransform = require('./lib/default-collection-transform');
const createChannelCache = require('./lib/create-channel-cache');
const fetchJWPlayerVideo = require('./lib/fetch-jwplayer-video');
const fetchJWPlayerCollection = require('./lib/fetch-jwplayer-playlist');

const DEFAULTS = {
	baseUrl: 'https://api.jwplatform.com',
	// baseUrl: 'https://api.jwplayer.com',
	collectionTransform: defaultCollectionTransform,
	videoTransform: defaultVideoTransform
};

// options.bus
// options.baseUrl
// options.secretKey
// options.apiKey
// options.collectionTransform
// options.assetTransform
exports.initialize = function (options) {
	options = Object.assign({}, DEFAULTS, options || {});

	const bus = options.bus;
	const baseUrl = options.baseUrl;
	const apiKey = options.apiKey;
	const secretKey = options.secretKey;
	const role = 'provider';
	const cmd = 'get';

	if (!bus || typeof bus !== 'object') {
		throw new Error('oddworks-jwplayer-provider requires an Oddcast Bus');
	}

	const collectionTransform = options.collectionTransform;
	const videoTransform = options.videoTransform;

	const client = new Client({bus, baseUrl, secretKey, apiKey});

	const getChannel = createChannelCache(bus);

	bus.queryHandler(
		{role, cmd, source: 'jwplayer-playlist-provider'},
		exports.createPlaylistHandler(bus, getChannel, client, collectionTransform)
	);

	bus.queryHandler(
		{role, cmd, source: 'jwplayer-video-provider'},
		exports.createVideoHandler(bus, getChannel, client, videoTransform)
	);

	return Promise.resolve({
		name: 'jwplayer-provider',
		client
	});
};

exports.createPlaylistHandler = function (bus, getChannel, client, transform) {
	const getCollection = fetchJWPlayerCollection(bus, client, transform);

	// Called from Oddworks core via bus.query
	// Expects:
	//   args.spec.playlist.id
	return function jwplayerPlaylistProvider(args) {
		const spec = args.spec;
		const playlistId = (spec.playlist || {}).id;
		const channelId = spec.channel;

		if (!playlistId || typeof playlistId !== 'string') {
			throw new Error(
				'jwplayer-playlist-provider spec.playlist.id String is required'
			);
		}

		// The Oddworks collection.
		const collection = args.object;

		return getChannel(channelId).then(channel => {
			return getCollection({spec, channel, collection, playlistId});
		});
	};
};

exports.createVideoHandler = function (bus, getChannel, client, transform) {
	const getJWPlayerVideo = fetchJWPlayerVideo(bus, client, transform);

	// Called from Oddworks core via bus.query
	// Expects:
	//   args.spec.video
	return function jwplayerVideoProvider(args) {
		const spec = args.spec;
		const channelId = spec.channel;
		const video = spec.video || {};
		const videoId = video.id;

		if (!videoId || typeof videoId !== 'string') {
			throw new Error(
				'jwplayer-video-provider spec.video.id String is not available'
			);
		}

		return getChannel(channelId).then(channel => {
			return getJWPlayerVideo({spec, channel, videoId});
		});
	};
};

// options.secretKey *required
// options.apiKey *required
// options.bus *optional
// options.baseUrl *optional
exports.createClient = function (options) {
	options = Object.assign({}, DEFAULTS, options || {});

	const bus = options.bus;
	const baseUrl = options.baseUrl;
	const secretKey = options.secretKey;
	const apiKey = options.apiKey;

	if (!apiKey || typeof apiKey !== 'string') {
		throw new Error('oddworks-jwplayer-provider requires an jwplayer apiKey key');
	}
	if (!secretKey || typeof secretKey !== 'string') {
		throw new Error('oddworks-jwplayer-provider requires an jwplayer secretKey key');
	}

	return new Client({bus, baseUrl, secretKey, apiKey});
};

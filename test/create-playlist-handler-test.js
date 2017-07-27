'use strict';

const Promise = require('bluebird');
const test = require('ava');
const nock = require('nock');

const provider = require('../');
const collectionTransform = require('../lib/default-collection-transform');
const playlistResponse = require('./fixtures/example-responses/get-playlist-response');
const videosByPlaylistResponse = require('./fixtures/example-responses/get-videos-by-playlist-response');
const helpers = require('./helpers');

const apiKey = 'fake-apiKey';
const secretKey = 'fake-secretKey';
const baseUrl = 'https://cdn.jwplayer.com';
const PATH_PREFIX = '/v1';

// mock channel fetching function
const channelId = 'fake-channel';
const getChannel = () => {
	return Promise.resolve({
		id: channelId,
		secrets: {
			brightcove: {
				apiKey,
				secretKey
			}
		}
	});
};

let bus;
let playlistHandler = null;

test.before(() => {
	// mock API calls
	nock(
		`${baseUrl}${PATH_PREFIX}`, {})
		.get(`/channels/show`)
		.query(params => {
			return params.channel_key === '12345';
		})
		.times(2)
		.reply(404);

	nock(
		`${baseUrl}${PATH_PREFIX}`, {})
		.get(`/channels/show`)
		.query(params => {
			return params.channel_key === 'bITKS2O3';
		})
		.reply(200, playlistResponse);

	nock(
		`${baseUrl}${PATH_PREFIX}`, {})
		.get(`/channels/videos/list`)
		.query(true)
		.times(2)
		.reply(200, videosByPlaylistResponse);
});

test.beforeEach(() => {
	bus = helpers.createBus();

	// mock command for creating a video spec
	bus.commandHandler({role: 'catalog', cmd: 'setItemSpec'}, spec => {
		return Promise.resolve({type: 'videoSpec', resource: `${spec.video.key}`});
	});

	// create client with initial credentials that will be overridden
	const client = provider.createClient({
		bus,
		apiKey: 'foo',
		secretKey: 'bar'
	});

	// create handler
	playlistHandler = provider.createPlaylistHandler(bus, getChannel, client, collectionTransform);
});

test('when JWPlayer playlist not found', t => {
	const spec = {
		channel: channelId,
		type: 'collectionSpec',
		playlistId: '12345',
		playlist: {key: '12345'}
	};

	const obs = new Promise(resolve => {
		bus.observe({level: 'error'}, payload => {
			resolve(payload);
		});
	});

	t.throws(playlistHandler({spec}), `JW Player channel not found for id "${spec.playlistId}"`);
	return playlistHandler({spec}).catch(err => {
		return obs.then(event => {
			// test bus event
			t.deepEqual(event.error, {code: 'JW_CHANNEL_PLAYLIST_NOT_FOUND'});
			t.is(event.code, 'JW_CHANNEL_PLAYLIST_NOT_FOUND');
			t.deepEqual(event.spec, spec);
			t.is(event.message, 'playlist not found');

			// test playlist handler rejection
			t.is(err.message, `JW Player channel not found for id "${spec.playlistId}"`);
			return event;
		});
	});
});

test('when JWPlayer playlist found', t => {
	const spec = {
		channel: channelId,
		type: 'collectionSpec',
		playlistId: `spec-jwplayer-playlist-${playlistResponse.channel.key}`,
		playlist: {key: playlistResponse.channel.key}
	};

	return playlistHandler({spec})
		.then(res => {
			const keys = Object.keys(res);
			t.deepEqual(keys, [
				'id',
				'title',
				'type',
				'description',
				'genres',
				'images',
				'meta',
				'releaseDate',
				'relationships'
			]);

			// videos are present in relationships
			// Oddworks will ensure these IDs get prefixed with "res-jw-video-".
			t.is(res.relationships.entities.data[0].id, '617kMdbG');
			t.is(res.relationships.entities.data[1].id, 'F33ExjRC');
			t.is(res.relationships.entities.data[2].id, 'F33ExjRC');
		});
});

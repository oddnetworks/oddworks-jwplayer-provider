'use strict';

const Promise = require('bluebird');
const test = require('ava');
const nock = require('nock');

const provider = require('../');
const collectionTransform = require('../lib/default-collection-transform');
const playlistResponse = require('./fixtures/example-responses/get-playlist-response');
const v2playlistResponse = require('./fixtures/example-responses/v2-get-playlist-response');
const helpers = require('./helpers');

const apiKey = 'fake-apiKey';
const secretKey = 'fake-secretKey';
const v1baseUrl = 'https://api.jwplatform.com/v1';
const v2baseUrl = 'https://cdn.jwplayer.com/v2';

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
		v1baseUrl, {})
		.get(`/channels/show`)
		.query(params => {
			return params.channel_key === '12345';
		})
		.times(2)
		.reply(404);

	nock(
		v2baseUrl, {})
		.get(`/playlists/12345`)
		.query(true)
		.times(2)
		.reply(404);

	nock(
		v2baseUrl, {})
		.get(`/playlists/jfDeJZmI`)
		.query(true)
		.times(2)
		.reply(200, v2playlistResponse);

	nock(
		v1baseUrl, {})
		.get(`/channels/show`)
		.times(2)
		.query(params => {
			return params.channel_key === 'jfDeJZmI';
		})
		.reply(200, playlistResponse);
});

test.beforeEach(() => {
	bus = helpers.createBus();

	// mock command for creating a video spec
	bus.commandHandler({role: 'catalog', cmd: 'setItemSpec'}, spec => {
		return Promise.resolve({type: 'videoSpec', resource: `${spec.video.mediaid}`});
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
	t.plan(6);
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
			t.plan(3);
			const keys = Object.keys(res);

			t.deepEqual(keys, [
				'id',
				'title',
				'type',
				'description',
				'genres',
				'images',
				'meta',
				'tags',
				'cast',
				'releaseDate',
				'relationships'
			]);

			// videos are present in relationships
			t.is(res.relationships.entities.data[0].id, 'jwplayer-video-O2AWXESU');

			const length = res.relationships.entities.data.length || 0;
			t.is(res.relationships.entities.data[length - 1].id, 'jwplayer-video-yjN1PB8E');
			return res;
		});
});

test('when JWPlayer playlist found with id in the spec', t => {
	const spec = {
		channel: channelId,
		type: 'collectionSpec',
		id: `spec-jwplayer-playlist-${playlistResponse.channel.key}`,
		playlist: {id: playlistResponse.channel.key}
	};

	return playlistHandler({spec})
		.then(res => {
			t.plan(3);
			const keys = Object.keys(res);

			t.deepEqual(keys, [
				'id',
				'title',
				'type',
				'description',
				'genres',
				'images',
				'meta',
				'tags',
				'cast',
				'releaseDate',
				'relationships'
			]);

			// videos are present in relationships
			t.is(res.relationships.entities.data[0].id, 'jwplayer-video-O2AWXESU');

			const length = res.relationships.entities.data.length || 0;
			t.is(res.relationships.entities.data[length - 1].id, 'jwplayer-video-yjN1PB8E');
			return res;
		});
});

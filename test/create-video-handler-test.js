'use strict';

const test = require('ava');
const nock = require('nock');
const Promise = require('bluebird');
// const debug = require('debug')('oddworks:provider:jwplayer-provider:create-video-handler-test');

const provider = require('../');
const videoTransform = require('../lib/default-video-transform');
const formatReleaseDate = require('../lib/utils').formatReleaseDate;
const videoResponse = require('./fixtures/example-responses/v2-get-media-response');
const helpers = require('./helpers');

const apiKey = 'fake-apiKey';
const secretKey = 'fake-secretKey';
const v2baseUrl = `https://cdn.jwplayer.com/v2`;

const type = 'videoSpec';

// mock channel fetching function
const channel = 'fake-channel';
const getChannel = () => {
	return Promise.resolve({
		id: channel,
		secrets: {
			apiKey,
			secretKey
		}
	});
};

let bus;
let videoHandler = null;

test.before(() => {
	nock(
		`${v2baseUrl}`, {})
		.get(`/media/12345`)
		.query(true)
		.reply(404);

	nock(
		`${v2baseUrl}`, {})
		.get(`/media/O2AWXESU`)
		.query(true)
		.reply(200, videoResponse);
});

test.beforeEach(() => {
	bus = helpers.createBus();

	// create client with initial credentials that will be overridden
	const client = provider.createClient({
		bus,
		apiKey,
		secretKey
	});

	videoHandler = provider.createVideoHandler(bus, getChannel, client, videoTransform);
});

test('when JWPlayer video not found', t => {
	t.plan(5);

	const spec = {
		channel,
		type,
		id: 'spec-brightcove-video-12345',
		video: {mediaid: '12345'}
	};

	const obs = new Promise(resolve => {
		bus.observe({level: 'error'}, payload => {
			resolve(payload);
		});
	});

	return videoHandler({spec}).catch(err => {
		// test video handler rejection
		t.is(err.message, `Video not found for id "${spec.video.mediaid}"`);
		return obs.then(errEvent => {
			// test bus event
			t.deepEqual(errEvent.error, {code: 'VIDEO_NOT_FOUND'});
			t.is(errEvent.code, 'VIDEO_NOT_FOUND');
			t.deepEqual(errEvent.spec, spec);
			t.is(errEvent.message, 'video not found');
		});
	});
});

test('when JWPlayer video found', t => {
	t.plan(8);
	const mediaid = videoResponse.playlist[0].mediaid;
	const spec = {
		channel,
		type,
		id: `spec-jwplayer-video-${mediaid}`,
		video: {mediaid}
	};

	return videoHandler({spec})
		.then(res => {
			t.deepEqual(Object.keys(res), [
				'id',
				'type',
				'title',
				'description',
				'images',
				'sources',
				'cast',
				'duration',
				'genres',
				'releaseDate',
				'tags'
			]);

			t.is(res.id, `res-jwplayer-video-${mediaid}`);
			t.is(res.title, videoResponse.playlist[0].title);
			t.is(res.description, videoResponse.playlist[0].description);

			t.is(res.images.length, 6);
			t.is(res.sources.length, 5);

			t.is(res.duration, Math.round((videoResponse.playlist[0].duration || 0) * 1000));
			t.is(res.releaseDate, formatReleaseDate(videoResponse.playlist[0].pubdate));
		});
});

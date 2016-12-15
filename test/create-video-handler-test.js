'use strict';

const test = require('ava');
const nock = require('nock');
const Promise = require('bluebird');
// const debug = require('debug')('oddworks:provider:brightcove:create-video-handler-test');

const provider = require('../');
const videoTransform = require('../lib/default-video-transform');
const formatReleaseDate = require('../lib/utils').formatReleaseDate;
const videoResponse = require('./fixtures/example-responses/get-video-response');
const conversionsResponse = require('./fixtures/example-responses/get-conversions-by-video-response');
const helpers = require('./helpers');

const apiKey = 'fake-apiKey';
const secretKey = 'fake-secretKey';
const baseUrl = 'https://api.jwplatform.com';
const PATH_PREFIX = '/v1';

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
		`${baseUrl}${PATH_PREFIX}`, {})
		.get(`/channels/videos/list`)
		.query(true)
		.times(2)
		.reply(200, videoResponse);

	// replace with jw video conversions
	// nock(
	// 	'https://cms.api.brightcove.com/v1',
	// 	{
	// 		reqheaders: {
	// 			authorization: cmsAuthHeader
	// 		}
	// 	})
	// 	.get(`/accounts/${accountId}/videos/${videoResponse.id}/sources`)
	// 	.reply(200, videoSourcesResponse);

	nock(
		`${baseUrl}${PATH_PREFIX}`, {})
		.get(`/videos/show`)
		.query(params => {
			return params.video_key === '617kMdbG';
		})
		.reply(200, videoResponse);

	nock(
		`${baseUrl}${PATH_PREFIX}`, {})
		.get(`/videos/conversions/list`)
		.query(params => {
			return params.video_key === '617kMdbG';
		})
		.times(2)
		.reply(200, conversionsResponse);
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

// test('when Brightcove video not found', t => {
// 	const spec = {
// 		channel,
// 		type,
// 		id: 'spec-brightcove-video-12345',
// 		video: {id: '12345'}
// 	};

// 	const obs = new Promise(resolve => {
// 		bus.observe({level: 'error'}, payload => {
// 			resolve(payload);
// 		});
// 	});

// 	return videoHandler({spec}).catch(err => {
// 		return obs.then(event => {
// 			// test bus event
// 			t.deepEqual(event.error, {code: 'VIDEO_NOT_FOUND'});
// 			t.is(event.code, 'VIDEO_NOT_FOUND');
// 			t.deepEqual(event.spec, spec);
// 			t.is(event.message, 'video not found');

// 			// test video handler rejection
// 			t.is(err.message, `Video not found for id "${spec.video.id}"`);
// 		});
// 	});
// });

test('when JWPlayer video found', t => {
	const spec = {
		channel,
		type,
		id: `spec-jwplayer-video-${videoResponse.video.key}`,
		video: {id: videoResponse.video.key}
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
				'meta',
				'releaseDate',
				'tags'
			]);

			t.is(res.id, `res-jwplayer-video-${videoResponse.video.key}`);
			t.is(res.title, videoResponse.video.title);
			t.is(res.description, videoResponse.video.description);

			t.is(res.images.length, 6);
			t.is(res.sources.length, 6);

			t.is(res.duration, Math.round((videoResponse.video.duration || 0) * 1000));
			t.is(res.releaseDate, formatReleaseDate(videoResponse.video.date));
		});
});

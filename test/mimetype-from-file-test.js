'use strict';

const test = require('ava');

const mimetypeFromSource = require('../lib/utils').mimetypeFromSource;
const videoResponse = require('./fixtures/example-responses/v2-get-media-response');

const correctResponses = [
	'application/x-mpegURL',
	'video/mp4',
	'video/mp4',
	'video/mp4',
	'audio/mp4'
];

let testResponses = [];

test.before(() => {
	testResponses = videoResponse.playlist[0].sources.map(source => {
		return mimetypeFromSource(source);
	});
});

test('Correct mimetypes are returned from example jw response', t => {
	t.plan(testResponses.length);
	for (let i = 0; i < testResponses.length; i++) {
		t.is(testResponses[i], correctResponses[i]);
	}
});

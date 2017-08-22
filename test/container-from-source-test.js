'use strict';

const test = require('ava');

const utils = require('../').utils;
const videoResponse = require('./fixtures/example-responses/v2-get-media-response');

const correctResponses = [
	'hls',
	'mp4',
	'mp4',
	'mp4',
	'mp4'
];

let testResponses = [];

test.before(() => {
	const containerFromSource = utils.containerFromSource;
	testResponses = videoResponse.playlist[0].sources.map(source => {
		return containerFromSource(source);
	});
});

test('Correct containers are returned from example jw response', t => {
	t.plan(testResponses.length);
	for (let i = 0; i < testResponses.length; i++) {
		t.is(testResponses[i], correctResponses[i]);
	}
});

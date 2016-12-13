'use strict';

const test = require('ava');
const sinon = require('sinon');

const provider = require('../');
const defaultVideoTransform = require('../lib/default-video-transform');
const defaultCollectionTransform = require('../lib/default-collection-transform');
const helpers = require('./helpers');

const apiKey = 'jwplatform-apiKeyy';
const secretKey = 'jwplatform-secretKey';

let bus;
let result = null;

let createVideoHandlerSpy;
let createPlaylistHandlerSpy;
let queryHandlerSpy;

function videoHandler() {}
function playlistHandler() {}

test.before(() => {
	bus = helpers.createBus();

	createVideoHandlerSpy = sinon.stub(provider, 'createVideoHandler').returns(videoHandler);
	createPlaylistHandlerSpy = sinon.stub(provider, 'createPlaylistHandler').returns(playlistHandler);
	queryHandlerSpy = sinon.spy(bus, 'queryHandler');

	const options = {
		bus,
		apiKey,
		secretKey
	};

	return provider.initialize(options).then(res => {
		result = res;
		return null;
	});
});

test('creates a jwplatform client', t => {
	t.plan(3);

	t.truthy(result.client);
	t.is(result.client.apiKey, apiKey);
	t.is(result.client.secretKey, secretKey);
});

test('calls createVideoHandler', t => {
	t.plan(2);

	t.true(createVideoHandlerSpy.calledOnce);
	t.true(createVideoHandlerSpy.calledWith(bus, sinon.match.func, result.client, defaultVideoTransform));
});

test('calls createPlaylistHandler', t => {
	t.plan(2);

	t.true(createPlaylistHandlerSpy.calledOnce);
	t.true(createPlaylistHandlerSpy.calledWith(bus, sinon.match.func, result.client, defaultCollectionTransform));
});

test('calls bus.queryHandler', t => {
	t.plan(3);

	t.true(queryHandlerSpy.calledTwice);
	t.deepEqual(queryHandlerSpy.firstCall.args, [
		{role: 'provider', cmd: 'get', source: 'jwplayer-playlist-provider'},
		playlistHandler
	]);
	t.deepEqual(queryHandlerSpy.secondCall.args, [
		{role: 'provider', cmd: 'get', source: 'jwplayer-video-provider'},
		videoHandler
	]);
});

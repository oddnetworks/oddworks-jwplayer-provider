/* global describe, beforeAll, it, expect, spyOn */
/* eslint prefer-arrow-callback: 0 */
/* eslint-disable max-nested-callbacks */
'use strict';

const provider = require('../');
const defaultVideoTransform = require('../lib/default-video-transform');
const defaultCollectionTransform = require('../lib/default-collection-transform');

describe('initialize', function () {
	describe('with valid data', function () {
		let bus;
		let result = null;

		function playlistHandler() {}
		function videoHandler() {}

		beforeAll(function (done) {
			bus = this.createBus();
			spyOn(provider, 'createPlaylistHandler').and.returnValue(playlistHandler);
			spyOn(provider, 'createVideoHandler').and.returnValue(videoHandler);
			spyOn(bus, 'queryHandler');

			const options = {
				bus,
				apiKey: 'foo',
				secretKey: 'bar'
			};

			provider.initialize(options).then(res => {
				result = res;
				done();
				return null;
			}).catch(done.fail);
		});

		it('creates an jwplayer client', function () {
			expect(result.client).toBeTruthy();
			expect(result.client.apiKey).toBe('foo');
			expect(result.client.secretKey).toBe('bar');
			expect(result.client.baseUrl).toBe('https://api.jwplatform.com');
		});

		it('calls createPlaylistHandler', function () {
			expect(provider.createPlaylistHandler).toHaveBeenCalledTimes(1);
			const args = provider.createPlaylistHandler.calls.allArgs()[0];
			expect(args[0]).toBe(bus);
			expect(typeof args[1]).toBe('function');
			expect(args[2]).toBe(result.client);
			expect(args[3]).toBe(defaultCollectionTransform);
		});

		it('calls createVideoHandler', function () {
			expect(provider.createVideoHandler).toHaveBeenCalledTimes(1);
			const args = provider.createVideoHandler.calls.allArgs()[0];
			expect(args[0]).toBe(bus);
			expect(typeof args[1]).toBe('function');
			expect(args[2]).toBe(result.client);
			expect(args[3]).toBe(defaultVideoTransform);
		});

		it('calls bus.queryHandler', function () {
			expect(bus.queryHandler).toHaveBeenCalledTimes(2);
			expect(bus.queryHandler).toHaveBeenCalledWith(
				{role: 'provider', cmd: 'get', source: 'jwplayer-playlist-provider'},
				playlistHandler
			);
			expect(bus.queryHandler).toHaveBeenCalledWith(
				{role: 'provider', cmd: 'get', source: 'jwplayer-video-provider'},
				videoHandler
			);
		});
	});
});
